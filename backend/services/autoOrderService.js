const mongoose = require('mongoose');
const ClientInventory = require('../models/ClientInventory');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Order = require('../models/Order');
const { createAndPayAutoOrder } = require('./paymentService');

class AutoOrderService {
    /**
     * Met à jour le stock client après une commande et vérifie l'auto-order
     */
    async updateClientStockAfterOrder(orderId) {
        try {
            console.log(`🔄 Order ${orderId} completed - auto-order will be checked by cron job`);

            // Ne rien faire ici - la logique d'auto-order est gérée par le cron job
            // Le cron job s'occupe de :
            // 1. Diminuer le stock de la consommation quotidienne
            // 2. Vérifier et déclencher l'auto-order si nécessaire

        } catch (error) {
            console.error('❌ Error in updateClientStockAfterOrder:', error);
        }
    }

    /**
     * Vérifie et déclenche un auto-order si nécessaire
     */
    async checkAndTriggerAutoOrder(clientId) {
        try {
            console.log(`🔍 Checking auto-order for client ${clientId}`);

            const client = await Client.findById(clientId);
            if (!client) {
                console.log(`❌ Client ${clientId} not found`);
                return;
            }

            // Vérifier les limites de commande
            const { autoOrders, manualOrders } = await this.getOrderCountsByType(clientId);

            console.log(`Client ${client.name} - Auto orders today: ${autoOrders}, Manual orders today: ${manualOrders}`);

            // Vérifier si le client a atteint la limite d'auto-commandes (max 2)
            if (autoOrders >= 2) {
                console.log(`Client ${client.name} has reached the daily auto order limit (2). Current auto orders: ${autoOrders}`);
                return;
            }

            // Vérifier si le client doit passer une commande manuelle d'abord
            if (autoOrders === 1 && manualOrders === 0) {
                console.log(`Client ${client.name} needs to place a manual order before the second auto order.`);
                return;
            }

            // Vérifier les items qui nécessitent un auto-order
            const inventoryItems = await ClientInventory.find({
                client: clientId,
                'autoOrder.enabled': true
            }).populate('product');

            const itemsToOrder = inventoryItems.filter(item =>
                item.currentStock <= item.reorderPoint &&
                item.reorderQty > 0
            );

            if (itemsToOrder.length === 0) {
                console.log(`No items need auto-ordering for client ${client.name}`);
                return;
            }

            console.log(`Found ${itemsToOrder.length} items that need auto-ordering for client ${client.name}`);

            // Déclencher l'auto-order
            const result = await createAndPayAutoOrder(clientId);
            if (result.order) {
                console.log(`✅ Auto-order created for client ${client.name}, Order ID: ${result.order._id}`);
            } else {
                console.log(`❌ No auto-order created for client ${client.name}. Reason: ${result.message}`);
            }

        } catch (error) {
            console.error(`❌ Error checking auto-order for client ${clientId}:`, error);
        }
    }

    /**
     * Compte les commandes par type pour un client
     */
    async getOrderCountsByType(clientId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const autoOrders = await Order.countDocuments({
            client: clientId,
            createdAt: { $gte: today, $lt: tomorrow },
            notes: { $regex: /\[AUTO-ORDER\]/ }
        });

        const manualOrders = await Order.countDocuments({
            client: clientId,
            createdAt: { $gte: today, $lt: tomorrow },
            notes: { $not: { $regex: /\[AUTO-ORDER\]/ } }
        });

        return { autoOrders, manualOrders };
    }
}

module.exports = new AutoOrderService();
