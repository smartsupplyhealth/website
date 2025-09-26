const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.getSupplierStats = async (req, res) => {
    try {
        const supplierId = req.user.id;

        // Get product IDs for the supplier
        const supplierProducts = await Product.find({ supplier: new mongoose.Types.ObjectId(supplierId) }).select('_id');
        const productIds = supplierProducts.map(p => p._id);

        // 1. Active Clients (based on all non-cancelled orders)
        const allOrders = await Order.find({ 
            'items.product': { $in: productIds },
            status: { $ne: 'cancelled' } 
        }).populate('client');
        const activeClients = new Set(allOrders.map(order => order.client._id.toString()));

        // 2. Total Orders (excluding cancelled)
        const totalOrders = allOrders.length;

        // 3. Products in Stock (total quantity of all products)
        const stockAggregation = await Product.aggregate([
            { $match: { supplier: new mongoose.Types.ObjectId(supplierId) } },
            { $group: { _id: null, totalStock: { $sum: "$stock" } } }
        ]);
        const productsInStock = stockAggregation.length > 0 ? stockAggregation[0].totalStock : 0;

        // 4. Current Month's Revenue (CA ce mois)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        const monthlyOrders = await Order.find({
            'items.product': { $in: productIds },
            status: 'delivered',
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        });

        const monthlyRevenue = monthlyOrders.reduce((acc, order) => acc + order.totalAmount, 0);

        res.json({
            success: true,
            data: {
                activeClients: activeClients.size,
                totalOrders,
                productsInStock,
                monthlyRevenue
            }
        });
    } catch (error) {
        console.error('Error fetching supplier stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
