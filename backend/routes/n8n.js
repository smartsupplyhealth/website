const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Client = require('../models/Client');
const Product = require('../models/Product');
const ClientInventory = require('../models/ClientInventory');
const Stripe = require('stripe');
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Verrous pour éviter les appels simultanés
const processingLocks = new Map();

/**
 * POST /api/n8n/create
 * Accepte:
 *  - { clientId, products: [{productId, quantity}, ...] }
 *  - ou { clientId, products: {productId, quantity} }
 *  - ou { clientId, productId, quantity } (compat 1 produit)
 * Règle de paiement:
 *  - si client.stripeCustomerId => PaymentIntent off_session confirm=true
 *  - sinon, la commande est créée sans paiement (paymentStatus: 'Pending')
 */
// POST /api/n8n/create
router.post('/create', async (req, res) => {
    // 0) Normalisation de l'entrée
    const { clientId, products, productId, quantity } = req.body;

    // Toujours obtenir items = [{ productId, quantity }]
    let items = [];
    if (Array.isArray(products)) {
        items = products;
    } else if (products && typeof products === 'object') {
        items = [products];
    } else if (productId) {
        items = [{ productId, quantity: Number(quantity) || 1 }];
    }

    // Validation basique
    if (!clientId || !items.length || items.some(i => !i.productId)) {
        return res.status(400).json({
            success: false,
            message: 'clientId et au moins un productId sont requis',
            received: { clientId, products: items }
        });
    }

    // 1) Verrou (idempotence) par client + panier
    const productIds = items.map(i => String(i.productId));
    const productIdsHash = productIds.slice().sort().join(',');
    const lockKey = `auto-${clientId}-${Buffer.from(productIdsHash).toString('base64').slice(0, 16)}`;
    if (processingLocks.has(lockKey)) {
        return res.status(429).json({
            success: false,
            message: 'Auto-order déjà en cours pour ce client avec ces produits',
            lockKey
        });
    }
    processingLocks.set(lockKey, true);

    try {
        // 2) Client
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        // 3) Produits (DB en euros)
        const foundProducts = await Product.find({ _id: { $in: productIds } });
        if (foundProducts.length !== productIds.length) {
            const foundSet = new Set(foundProducts.map(p => String(p._id)));
            const missing = productIds.filter(id => !foundSet.has(String(id)));
            return res.status(404).json({
                success: false,
                message: 'Some products not found',
                missingProductIds: missing
            });
        }

        const byId = new Map(foundProducts.map(p => [String(p._id), p]));
        const orderItems = items.map(i => {
            const prod = byId.get(String(i.productId));
            const qty = Math.max(1, Math.trunc(Number(i.quantity || 0)));
            const unitPriceEUR = Number(prod.price || 0);
            const totalPriceEUR = unitPriceEUR * qty;
            return {
                product: prod._id,
                quantity: qty,
                unitPrice: unitPriceEUR,
                totalPrice: totalPriceEUR
            };
        });

        const totalAmountEUR = orderItems.reduce((s, li) => s + li.totalPrice, 0);
        if (totalAmountEUR <= 0) {
            return res.status(400).json({ success: false, message: 'Order total must be > 0' });
        }

        // 4) Anti-doublon court (10s)
        const tenSecAgo = new Date(Date.now() - 10 * 1000);
        const dup = await Order.findOne({
            client: clientId,
            'items.product': { $in: productIds },
            mode: 'auto',
            createdAt: { $gte: tenSecAgo }
        });
        if (dup) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate auto-order detected (same client/products within 10 seconds)',
                existingOrder: dup.orderNumber
            });
        }

        // 5) Numéro de commande
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNumber = `CMD${timestamp}${randomSuffix}`;

        // 6) Paiement Stripe off_session (si client a un Stripe customer)
        let paymentIntent = null;
        let paymentStatus = 'Pending';
        let paymentDetails = { method: null, approved: false };

        if (client.stripeCustomerId) {
            try {
                // Récupérer le customer pour s’assurer d’un PM par défaut
                const customer = await stripe.customers.retrieve(client.stripeCustomerId);
                const defaultPm =
                    customer?.invoice_settings?.default_payment_method ||
                    customer?.default_source || null;

                if (!defaultPm) {
                    return res.status(402).json({
                        success: false,
                        message:
                            'Stripe error: no default payment method on customer. Please set a default card on the customer.',
                        stripeCustomerId: client.stripeCustomerId
                    });
                }

                const amountInCents = Math.round(totalAmountEUR * 100);

                paymentIntent = await stripe.paymentIntents.create(
                    {
                        amount: amountInCents,
                        currency: 'eur',
                        customer: client.stripeCustomerId,
                        payment_method: defaultPm,
                        payment_method_types: ['card'],
                        off_session: true,
                        confirm: true,
                        description: `Auto-order ${orderNumber} for client ${client._id}`,
                        metadata: {
                            orderNumber,
                            clientId: String(client._id),
                            productIds: productIds.join(','),
                            source: 'n8n-auto'
                        }
                    },
                    {
                        idempotencyKey: `n8n-auto-${orderNumber}`
                    }
                );

                if (paymentIntent.status === 'succeeded') {
                    paymentStatus = 'Paid';
                    paymentDetails = {
                        method: 'stripe',
                        approved: true,
                        paymentIntentId: paymentIntent.id,
                        amount: totalAmountEUR,
                        currency: 'EUR',
                        off_session: true
                    };
                } else {
                    return res.status(402).json({
                        success: false,
                        message: `Payment did not succeed (status=${paymentIntent.status})`,
                        paymentIntent
                    });
                }
            } catch (err) {
                return res.status(402).json({
                    success: false,
                    message: `Stripe error: ${err.message}`,
                    code: err.code,
                    raw: err.raw
                });
            }
        }

        // 7) Création de la commande (DB en euros)
        const order = new Order({
            orderNumber,
            client: clientId,
            items: orderItems,
            totalAmount: totalAmountEUR,
            deliveryAddress: {
                street: client.address || 'N/A',
                city: 'N/A',
                postalCode: 'N/A',
                country: 'N/A'
            },
            notes: 'Auto-order created by n8n',
            mode: 'auto',
            status: paymentStatus === 'Paid' ? 'confirmed' : 'pending',
            paymentStatus,
            paymentDetails
        });

        await order.save();

        return res.json({
            success: true,
            message:
                paymentStatus === 'Paid'
                    ? 'Auto-order created and paid successfully'
                    : 'Auto-order created (payment pending)',
            order,
            paymentIntent
        });
    } catch (error) {
        console.error('Error creating auto-order:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        processingLocks.delete(lockKey);
    }
});

// Endpoint pour créer une auto-commande rejetée depuis n8n
router.post('/reject', async (req, res) => {
    try {
        const { clientId, productId, quantity, reason } = req.body;

        // Vérifier que les IDs ne sont pas vides
        if (!clientId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'clientId and productId are required',
                received: { clientId, productId, quantity }
            });
        }

        // Vérifier que le client existe
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        // Vérifier que le produit existe
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Générer un numéro de commande unique avec timestamp + random
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNumber = `CMD${timestamp}${randomSuffix}`;

        // Créer la commande rejetée
        const order = new Order({
            orderNumber: orderNumber,
            client: clientId,
            items: [{
                product: productId,
                quantity: quantity,
                unitPrice: product.price,
                totalPrice: product.price * quantity
            }],
            totalAmount: product.price * quantity,
            deliveryAddress: {
                street: client.address || 'N/A',
                city: 'N/A',
                postalCode: 'N/A',
                country: 'N/A'
            },
            notes: `Auto-order rejected: ${reason || 'Auto-order limit exceeded'}`,
            mode: 'auto',  // Marquer comme auto-commande (même si rejetée)
            status: 'cancelled',  // Auto-order rejetée = annulée
            paymentStatus: 'Failed',  // Paiement échoué pour auto-commande rejetée
            paymentDetails: { method: 'auto_order', approved: false }
        });

        await order.save();

        res.json({
            success: true,
            message: 'Auto-order rejected successfully',
            order: order
        });

    } catch (error) {
        console.error('Error rejecting auto-order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Endpoint pour mettre à jour le stock depuis n8n
router.post('/update-stock', async (req, res) => {
    try {
        const { clientId, productId, newStock, operation = 'set' } = req.body;

        // Vérifier que les IDs ne sont pas vides
        if (!clientId || !productId || newStock === undefined) {
            return res.status(400).json({
                success: false,
                message: 'clientId, productId, and newStock are required',
                received: { clientId, productId, newStock, operation }
            });
        }

        // Vérifier que le client existe
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        // Vérifier que le produit existe
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Trouver l'inventaire client
        const inventory = await ClientInventory.findOne({
            client: clientId,
            product: productId
        });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Client inventory not found for this product'
            });
        }

        // Mettre à jour le stock selon l'opération
        const oldStock = inventory.currentStock;
        let updatedStock;

        switch (operation) {
            case 'set':
                updatedStock = Math.max(0, newStock);
                break;
            case 'add':
                updatedStock = Math.max(0, oldStock + newStock);
                break;
            case 'subtract':
                updatedStock = Math.max(0, oldStock - newStock);
                break;
            default:
                updatedStock = Math.max(0, newStock);
        }

        inventory.currentStock = updatedStock;
        inventory.lastDecrementAt = new Date();
        await inventory.save();

        console.log(`📦 Stock updated for ${product.name}: ${oldStock} → ${updatedStock} (operation: ${operation})`);

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: {
                productId,
                productName: product.name,
                clientId,
                oldStock,
                newStock: updatedStock,
                operation
            }
        });

    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Endpoint pour décrémenter le stock quotidien depuis n8n
router.post('/daily-consumption', async (req, res) => {
    try {
        console.log('🔄 Starting daily consumption from n8n...');

        // Récupérer tous les inventaires clients
        const inventories = await ClientInventory.find({}).populate('product client');

        console.log(`📊 ${inventories.length} inventories found`);

        const results = [];

        for (const inv of inventories) {
            try {
                // Vérifier si le produit existe
                if (!inv.product) {
                    console.log(`❌ Product not found for inventory ${inv._id}`);
                    continue;
                }

                // Vérifier si le client existe
                if (!inv.client) {
                    console.log(`❌ Client not found for inventory ${inv._id}`);
                    continue;
                }

                // Calculer la consommation quotidienne
                const dailyConsumption = inv.dailyUsage || 0;
                const oldStock = inv.currentStock;
                const newStock = Math.max(0, oldStock - dailyConsumption);

                console.log(`📦 ${inv.product.name}: ${oldStock} → ${newStock} (consumption: ${dailyConsumption})`);

                // Mettre à jour le stock
                inv.currentStock = newStock;
                inv.lastDecrementAt = new Date();
                await inv.save();

                results.push({
                    inventoryId: inv._id,
                    productName: inv.product.name,
                    clientName: inv.client.name,
                    oldStock,
                    newStock,
                    dailyConsumption
                });

            } catch (error) {
                console.error(`❌ Error processing inventory ${inv._id}:`, error.message);
                results.push({
                    inventoryId: inv._id,
                    error: error.message
                });
            }
        }

        console.log('✅ Daily consumption completed');

        res.json({
            success: true,
            message: 'Daily consumption completed successfully',
            results,
            totalProcessed: results.length
        });

    } catch (error) {
        console.error('❌ Error in daily consumption:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;