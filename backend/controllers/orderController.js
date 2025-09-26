const Order = require('../models/Order');
const Product = require('../models/Product');
const ClientInventory = require('../models/ClientInventory');
const orderService = require('../services/orderService');
const mongoose = require('mongoose');
const sendEmail = require('../utils/emailService');
const Client = require('../models/Client');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { products, deliveryAddress, notes, totalAmount } = req.body;
    const orderData = {
      clientId: req.user.id,
      products,
      deliveryAddress,
      notes,
      totalAmount,
    };
    const order = await orderService.createOrder(orderData);
    const client = await Client.findById(req.user.id);
    if (client && client.email) {
      const subject = 'Your Order has been placed successfully';
      const html = `<p>Hi ${client.name},</p>
                    <p>Your order with number ${order.orderNumber} has been placed successfully.</p>
                    <p>Total Amount: ${order.totalAmount}</p>
                    <p>Thank you for your purchase!</p>`;
      await sendEmail(client.email, subject, html);
    }
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Get orders (for admin/supplier)
exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let filter = {};
    if (status) {
      filter.status = status;
    }
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'items.product', select: 'name' },
        { path: 'client', select: 'name email clinicName' }
      ]
    };
    const orders = await orderService.getOrders(filter, options);
    res.json({
      success: true,
      data: orders.docs,
      pagination: {
        totalItems: orders.totalDocs,
        totalPages: orders.totalPages,
        currentPage: orders.page,
        hasNext: orders.hasNextPage,
        hasPrev: orders.hasPrevPage,
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get orders for the currently logged-in client
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let filter = { client: req.user.id }; // Automatically filter by the logged-in client's ID
    if (status) {
      filter.status = status;
    }
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'items.product', select: 'name' },
        { path: 'client', select: 'name email clinicName' }
      ]
    };
    const orders = await orderService.getOrders(filter, options);
    res.json({
      success: true,
      data: orders.docs,
      pagination: {
        totalItems: orders.totalDocs,
        totalPages: orders.totalPages,
        currentPage: orders.page,
        hasNext: orders.hasNextPage,
        hasPrev: orders.hasPrevPage,
      }
    });
  } catch (error) {
    console.error('Error fetching client-specific orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get a specific order by ID
exports.getOrderById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name description price')
            .populate('client', 'name email');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['confirmed', 'processing', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const order = await Order.findById(req.params.id)
            .populate('client', 'name email')
            .populate('items.product', 'name');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.status === 'delivered' || order.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot change status of a delivered or cancelled order.' });
        }

        // --- LOGIQUE DE RESTOCKAGE LORS DE L'ANNULATION ---
        // Si le nouveau statut est "annulé" et que l'ancien statut était un statut où le stock était réservé
        if (status === 'cancelled' && ['confirmed', 'processing'].includes(order.status)) {
            for (const item of order.items) {
                // On remet la quantité commandée dans le stock du produit
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
                console.log(`Stock pour le produit ${item.product._id} réapprovisionné de ${item.quantity}.`);
            }
        }
        // --- FIN DE LA LOGIQUE DE RESTOCKAGE ---

        order.status = status;
        await order.save();
        if (status === 'delivered') {
            for (const item of order.items) {
                await ClientInventory.findOneAndUpdate(
                    { client: order.client, product: item.product._id },
                    { $inc: { currentStock: item.quantity } },
                    { upsert: true, new: true }
                );
            }
        }
        if (order.client && order.client.email) {
            const productDetailsList = order.items.map(item => 
                `<li>${item.product.name} (Quantité: ${item.quantity})</li>`
            ).join('');
            const subject = `Mise à jour du statut de votre commande : ${status}`;
            const html = `
                <p>Bonjour ${order.client.name},</p>
                <p>Le statut de votre commande <strong>${order.orderNumber}</strong> est maintenant : <strong>${status}</strong>.</p>
                <h3>Détails de la commande :</h3>
                <ul>
                    ${productDetailsList}
                </ul>
                <p>Merci pour votre patience !</p>
            `;
            await sendEmail(order.client.email, subject, html);
        }
        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Cancel an order
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (!['confirmed', 'processing'].includes(order.status)) {
            return res.status(400).json({ message: 'This order can no longer be cancelled.' });
        }
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
        order.status = 'cancelled';
        await order.save();
        const client = await Client.findById(order.client);
        if (client && client.email) {
            const subject = 'Your Order has been cancelled';
            const html = `<p>Hi ${client.name},</p>
                        <p>Your order with number ${order.orderNumber} has been successfully cancelled.</p>
                        <p>We are sorry to see you go.</p>`;
            await sendEmail(client.email, subject, html);
        }
        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get clients for a supplier
exports.getSupplierClients = async (req, res) => {
    try {
        const supplierProducts = await Product.find({ supplier: req.user.id }).select('_id');
        const productIds = supplierProducts.map(p => p._id);
        const orders = await Order.find({ 'items.product': { $in: productIds } })
            .populate('client', 'name email phone clinicName');
        const clients = orders.reduce((acc, order) => {
            const client = order.client;
            if (client && !acc.some(c => c._id.equals(client._id))) {
                acc.push(client);
            }
            return acc;
        }, []);
        res.json(clients);
    } catch (error) {
        console.error('Error fetching supplier clients:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get products previously ordered by a client
exports.getMyOrderedProducts = async (req, res) => {
    try {
        const orders = await Order.find({ client: req.user.id }).populate('items.product');
        const products = orders
            .flatMap(order => order.items.map(item => item.product))
            .filter((product, index, self) => 
                product && self.findIndex(p => p._id.equals(product._id)) === index
            );
        res.json(products);
    } catch (error) {
        console.error('Error fetching ordered products:', error);
        res.status(500).json({ message: 'Server error' });
    }
};