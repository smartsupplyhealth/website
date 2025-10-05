const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// Create a notification for a user
const createNotification = async (userId, title, message, type = 'info', orderId = null, metadata = {}) => {
    try {
        const notification = new Notification({
            user: userId,
            title,
            message,
            type,
            orderId,
            metadata
        });

        await notification.save();
        console.log(`Notification created for user ${userId}: ${title}`);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Create notification when order status changes
const notifyOrderStatusChange = async (orderId, newStatus) => {
    try {
        const order = await Order.findById(orderId).populate('client');
        if (!order) {
            console.error('Order not found for notification:', orderId);
            return;
        }

        const userId = order.client._id;
        let title, message, type;

        switch (newStatus) {
            case 'confirmed':
                title = 'Commande Confirmée';
                message = `Votre commande #${order.orderNumber} a été confirmée et est en cours de traitement.`;
                type = 'success';
                break;
            case 'processing':
                title = 'Commande en Traitement';
                message = `Votre commande #${order.orderNumber} est maintenant en cours de traitement.`;
                type = 'info';
                break;
            case 'delivered':
                title = 'Commande Livrée';
                message = `Votre commande #${order.orderNumber} a été livrée avec succès. Merci pour votre achat !`;
                type = 'success';
                break;
            case 'cancelled':
                title = 'Commande Annulée';
                message = `Votre commande #${order.orderNumber} a été annulée.`;
                type = 'error';
                break;
            default:
                title = 'Mise à jour de Commande';
                message = `Votre commande #${order.orderNumber} a été mise à jour.`;
                type = 'info';
        }

        await createNotification(
            userId,
            title,
            message,
            type,
            orderId,
            { orderNumber: order.orderNumber, status: newStatus }
        );
    } catch (error) {
        console.error('Error creating order status notification:', error);
    }
};

// Create notification for new order (for suppliers)
const notifyNewOrder = async (orderId) => {
    try {
        const order = await Order.findById(orderId).populate('client');
        if (!order) {
            console.error('Order not found for notification:', orderId);
            return;
        }

        // For now, we'll create a notification for the client
        // In a real system, you'd also notify the supplier
        const userId = order.client._id;

        await createNotification(
            userId,
            'Nouvelle Commande Créée',
            `Votre commande #${order.orderNumber} a été créée avec succès. Montant: €${order.totalAmount.toFixed(2)}`,
            'success',
            orderId,
            { orderNumber: order.orderNumber, totalAmount: order.totalAmount }
        );
    } catch (error) {
        console.error('Error creating new order notification:', error);
    }
};

// Create welcome notification for new users
const notifyWelcome = async (userId, userName) => {
    try {
        await createNotification(
            userId,
            'Bienvenue sur SmartSupply Health!',
            `Bonjour ${userName}, votre compte a été créé avec succès. Vous pouvez maintenant commencer à passer des commandes.`,
            'info',
            null,
            { userName }
        );
    } catch (error) {
        console.error('Error creating welcome notification:', error);
    }
};

// Create notification when payment status changes
const notifyPaymentStatusChange = async (orderId, paymentStatus, paymentMethod) => {
    try {
        const order = await Order.findById(orderId).populate('client');
        if (!order) {
            console.error('Order not found for payment notification:', orderId);
            return;
        }

        const userId = order.client._id;
        let title, message, type;

        if (paymentStatus === 'Paid') {
            if (paymentMethod === 'crypto') {
                title = 'Paiement Crypto Confirmé';
                message = `Votre paiement crypto pour la commande #${order.orderNumber} a été confirmé et marqué comme payé.`;
                type = 'success';
            } else {
                title = 'Paiement Confirmé';
                message = `Votre paiement pour la commande #${order.orderNumber} a été confirmé.`;
                type = 'success';
            }
        } else if (paymentStatus === 'Failed') {
            title = 'Paiement Échoué';
            message = `Votre paiement pour la commande #${order.orderNumber} a échoué. Veuillez réessayer.`;
            type = 'error';
        } else {
            title = 'Mise à jour de Paiement';
            message = `Le statut de paiement de votre commande #${order.orderNumber} a été mis à jour.`;
            type = 'info';
        }

        await createNotification(
            userId,
            title,
            message,
            type,
            orderId,
            { orderNumber: order.orderNumber, paymentStatus, paymentMethod }
        );
    } catch (error) {
        console.error('Error creating payment status notification:', error);
    }
};

// Notify suppliers about new orders
const notifySuppliersNewOrder = async (orderId) => {
    try {
        const order = await Order.findById(orderId)
            .populate('client', 'name email')
            .populate('items.product', 'name supplier');

        if (!order) {
            console.error('Order not found for supplier notification:', orderId);
            return;
        }

        // Get unique suppliers from order items
        const supplierIds = [...new Set(order.items.map(item => item.product?.supplier).filter(Boolean))];

        if (supplierIds.length === 0) {
            console.log('No suppliers found for order:', orderId);
            return;
        }

        // Get supplier details
        const suppliers = await Supplier.find({ _id: { $in: supplierIds } });

        // Create notifications for each supplier
        for (const supplier of suppliers) {
            // Get products from this supplier in the order
            const supplierProducts = order.items.filter(item =>
                item.product?.supplier?.toString() === supplier._id.toString()
            );

            const productNames = supplierProducts.map(item => item.product?.name).join(', ');
            const totalAmount = supplierProducts.reduce((sum, item) => sum + item.totalPrice, 0);

            await createNotification(
                supplier._id,
                'Nouvelle Commande Reçue',
                `Vous avez reçu une nouvelle commande #${order.orderNumber} de ${order.client.name} pour ${productNames}. Montant: €${totalAmount.toFixed(2)}`,
                'success',
                orderId,
                {
                    orderNumber: order.orderNumber,
                    clientName: order.client.name,
                    clientEmail: order.client.email,
                    totalAmount: totalAmount,
                    productCount: supplierProducts.length
                }
            );
        }

        console.log(`Notified ${suppliers.length} suppliers about new order ${order.orderNumber}`);
    } catch (error) {
        console.error('Error notifying suppliers about new order:', error);
    }
};

// Notify suppliers about order cancellations
const notifySuppliersOrderCancelled = async (orderId) => {
    try {
        const order = await Order.findById(orderId)
            .populate('client', 'name email')
            .populate('items.product', 'name supplier');

        if (!order) {
            console.error('Order not found for supplier cancellation notification:', orderId);
            return;
        }

        // Get unique suppliers from order items
        const supplierIds = [...new Set(order.items.map(item => item.product?.supplier).filter(Boolean))];

        if (supplierIds.length === 0) {
            console.log('No suppliers found for cancelled order:', orderId);
            return;
        }

        // Get supplier details
        const suppliers = await Supplier.find({ _id: { $in: supplierIds } });

        // Create notifications for each supplier
        for (const supplier of suppliers) {
            // Get products from this supplier in the order
            const supplierProducts = order.items.filter(item =>
                item.product?.supplier?.toString() === supplier._id.toString()
            );

            const productNames = supplierProducts.map(item => item.product?.name).join(', ');
            const totalAmount = supplierProducts.reduce((sum, item) => sum + item.totalPrice, 0);

            await createNotification(
                supplier._id,
                'Commande Annulée',
                `La commande #${order.orderNumber} de ${order.client.name} pour ${productNames} a été annulée. Montant: €${totalAmount.toFixed(2)}`,
                'warning',
                orderId,
                {
                    orderNumber: order.orderNumber,
                    clientName: order.client.name,
                    clientEmail: order.client.email,
                    totalAmount: totalAmount,
                    productCount: supplierProducts.length
                }
            );
        }

        console.log(`Notified ${suppliers.length} suppliers about cancelled order ${order.orderNumber}`);
    } catch (error) {
        console.error('Error notifying suppliers about cancelled order:', error);
    }
};

module.exports = {
    createNotification,
    notifyOrderStatusChange,
    notifyNewOrder,
    notifyWelcome,
    notifyPaymentStatusChange,
    notifySuppliersNewOrder,
    notifySuppliersOrderCancelled
};
