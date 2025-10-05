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
        const activeClients = new Set(allOrders
            .filter(order => order.client && order.client._id)
            .map(order => order.client._id.toString()));

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

exports.getSupplierOrders = async (req, res) => {
    try {
        const supplierId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        // Get product IDs for the supplier
        const supplierProducts = await Product.find({ supplier: new mongoose.Types.ObjectId(supplierId) }).select('_id');
        const productIds = supplierProducts.map(p => p._id);

        if (productIds.length === 0) {
            return res.json({
                success: true,
                data: [],
                allOrders: [],
                stats: {
                    totalOrders: 0,
                    cancelledOrders: 0,
                    netOrders: 0,
                    totalRevenue: 0,
                    cancelledRevenue: 0,
                    netRevenue: 0
                },
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: 1,
                    hasNext: false,
                    hasPrev: false,
                }
            });
        }

        // Build filter for orders containing supplier's products
        let filter = { 'items.product': { $in: productIds } };
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Get ALL orders for statistics calculation (not paginated)
        const allOrders = await Order.find({ 'items.product': { $in: productIds } })
            .populate('client', 'name email clinicName phone');

        // Calculate statistics
        const totalOrders = allOrders.length;
        const cancelledOrders = allOrders.filter(order => order.status === 'cancelled').length;
        const netOrders = totalOrders - cancelledOrders;

        const totalRevenue = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const cancelledRevenue = allOrders
            .filter(order => order.status === 'cancelled')
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const netRevenue = totalRevenue - cancelledRevenue;

        // Calculate pagination for the filtered results
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const filteredTotalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(filteredTotalOrders / parseInt(limit));

        // Fetch orders with pagination
        const orders = await Order.find(filter)
            .populate('client', 'name email clinicName phone')
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: orders,
            allOrders: allOrders, // Include all orders for client aggregation
            stats: {
                totalOrders,
                cancelledOrders,
                netOrders,
                totalRevenue,
                cancelledRevenue,
                netRevenue
            },
            pagination: {
                totalItems: filteredTotalOrders,
                totalPages: totalPages,
                currentPage: parseInt(page),
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1,
            }
        });
    } catch (error) {
        console.error('Error fetching supplier orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
