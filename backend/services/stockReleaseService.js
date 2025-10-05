const Order = require('../models/Order');
const Product = require('../models/Product');
const Client = require('../models/Client');
const sendEmail = require('../utils/emailService');

/**
 * Service pour gérer la libération automatique du stock des commandes non payées
 */
class StockReleaseService {
    constructor() {
        this.isRunning = false;
        this.cleanupInterval = null;
    }

    /**
     * Démarrer le service de nettoyage automatique
     * Vérifie toutes les 5 minutes les commandes non payées
     */
    start() {
        if (this.isRunning) {
            console.log('StockReleaseService is already running');
            return;
        }

        this.isRunning = true;
        console.log('🔄 Starting StockReleaseService - checking every 5 minutes');

        // Vérifier immédiatement
        this.checkAndReleaseStock();

        // Puis vérifier toutes les 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.checkAndReleaseStock();
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Arrêter le service de nettoyage
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.isRunning = false;
        console.log('⏹️ StockReleaseService stopped');
    }

    /**
     * Vérifier et libérer le stock des commandes non payées
     */
    async checkAndReleaseStock() {
        try {
            console.log('🔍 Checking for unpaid orders to release stock...');

            // Trouver les commandes non payées de plus de 30 minutes
            // Note: Ces commandes n'ont pas encore de stock déduit car le stock n'est déduit qu'après paiement
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

            const unpaidOrders = await Order.find({
                paymentStatus: 'Pending',
                status: 'pending',
                createdAt: { $lte: thirtyMinutesAgo },
                // Exclure les commandes déjà traitées par le service
                notes: { $not: /\[AUTO-CANCELLED\]/ }
            }).populate('items.product').populate('client');

            if (unpaidOrders.length === 0) {
                console.log('✅ No unpaid orders found to release stock');
                return;
            }

            console.log(`📦 Found ${unpaidOrders.length} unpaid orders to process`);

            for (const order of unpaidOrders) {
                await this.releaseOrderStock(order);
            }

        } catch (error) {
            console.error('❌ Error in checkAndReleaseStock:', error);
        }
    }

    /**
     * Annuler une commande non payée (pas de libération de stock nécessaire)
     */
    async releaseOrderStock(order) {
        try {
            console.log(`🔄 Cancelling unpaid order ${order.orderNumber}...`);

            // Note: Pas besoin de remettre le stock car il n'a jamais été déduit
            // Le stock n'est déduit qu'après paiement confirmé
            console.log(`📦 No stock to restore - stock was never deducted for unpaid order ${order.orderNumber}`);

            // Marquer la commande comme expirée
            order.status = 'cancelled';
            order.paymentStatus = 'Expired';
            order.notes = (order.notes || '') + `\n[AUTO-CANCELLED] Order cancelled due to unpaid status after 30 minutes`;

            await order.save();

            // Envoyer un email au client
            if (order.client && order.client.email) {
                await this.sendExpirationEmail(order);
            }

            console.log(`✅ Successfully released stock for order ${order.orderNumber}`);

        } catch (error) {
            console.error(`❌ Error releasing stock for order ${order.orderNumber}:`, error);
        }
    }

    /**
     * Envoyer un email d'expiration au client
     */
    async sendExpirationEmail(order) {
        try {
            const subject = `[SmartSupply Health] Commande ${order.orderNumber} expirée - Stock libéré`;

            const orderItemsList = order.items.map(item =>
                `<tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.product?.name || 'Produit'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">€${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">€${item.totalPrice.toFixed(2)}</td>
        </tr>`
            ).join('');

            const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
              ⏰ Commande Expirée
            </h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
              Votre commande n'a pas été payée dans les temps
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0; line-height: 1.6;">
              Bonjour <strong>${order.client.name}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.6;">
              Votre commande <strong style="color: #f6ad55;">${order.orderNumber}</strong> n'a pas été payée dans les 30 minutes suivant sa création. 
              La commande a été annulée automatiquement et les produits sont à nouveau disponibles pour tous les clients.
            </p>
            
            <!-- Order Details -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                📋 Détails de la commande
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr style="background: #e2e8f0;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #2d3748;">Produit</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #2d3748;">Quantité</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748;">Prix unitaire</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsList}
                </tbody>
              </table>
              
              <div style="border-top: 2px solid #e2e8f0; margin-top: 15px; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 18px; font-weight: 700; color: #2d3748;">Total de la commande :</span>
                  <span style="font-size: 20px; font-weight: 700; color: #f6ad55;">€${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <!-- Next Steps -->
            <div style="background: #ebf8ff; border-left: 4px solid #3182ce; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h4 style="color: #2c5282; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                🔄 Que faire maintenant ?
              </h4>
              <ul style="color: #2d3748; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Vous pouvez créer une nouvelle commande avec les mêmes produits</li>
                <li>Les produits sont maintenant disponibles pour tous les clients</li>
                <li>Assurez-vous de finaliser le paiement rapidement lors de votre prochaine commande</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #4a5568; margin: 25px 0 0 0; line-height: 1.6;">
              Merci pour votre compréhension. N'hésitez pas à nous contacter si vous avez des questions.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #718096; font-size: 14px;">
              Cordialement,<br>
              <strong style="color: #2d3748;">L'équipe SmartSupply Health</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      `;

            await sendEmail(order.client.email, subject, html);
            console.log(`📧 Expiration email sent to ${order.client.email} for order ${order.orderNumber}`);

        } catch (error) {
            console.error(`❌ Error sending expiration email for order ${order.orderNumber}:`, error);
        }
    }

    /**
     * Libérer manuellement le stock d'une commande spécifique
     */
    async releaseOrderStockManually(orderId) {
        try {
            const order = await Order.findById(orderId)
                .populate('items.product')
                .populate('client');

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.paymentStatus === 'Paid') {
                throw new Error('Cannot release stock for paid order');
            }

            await this.releaseOrderStock(order);
            return { success: true, message: 'Stock released successfully' };

        } catch (error) {
            console.error('Error in releaseOrderStockManually:', error);
            throw error;
        }
    }

    /**
     * Obtenir les statistiques du service
     */
    async getStats() {
        try {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

            const unpaidOrders = await Order.countDocuments({
                paymentStatus: 'Pending',
                status: 'pending',
                createdAt: { $lte: thirtyMinutesAgo }
            });

            const totalUnpaidOrders = await Order.countDocuments({
                paymentStatus: 'Pending',
                status: 'pending'
            });

            return {
                isRunning: this.isRunning,
                unpaidOrdersEligibleForRelease: unpaidOrders,
                totalUnpaidOrders: totalUnpaidOrders,
                lastCheck: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }
}

// Créer une instance singleton
const stockReleaseService = new StockReleaseService();

module.exports = stockReleaseService;
