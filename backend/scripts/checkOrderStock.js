const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Client = require('../models/Client');
require('dotenv').config();

async function checkOrderStock() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsupply');
        console.log('✅ Connected to MongoDB');

        const orderNumber = '306080';
        const clientEmail = 'essayedneder0798@gmail.com';

        console.log(`\n🔍 Checking order ${orderNumber} for client ${clientEmail}...\n`);

        // Find the client
        const client = await Client.findOne({ email: clientEmail });
        if (!client) {
            console.log(`❌ Client ${clientEmail} not found`);
            return;
        }
        console.log(`👤 Client found: ${client.name} (${client.email})`);

        // Find the order
        const order = await Order.findOne({
            orderNumber: orderNumber,
            client: client._id
        }).populate('items.product');

        if (!order) {
            console.log(`❌ Order ${orderNumber} not found for client ${clientEmail}`);
            return;
        }

        console.log(`\n📋 Order Details:`);
        console.log(`   - Order Number: ${order.orderNumber}`);
        console.log(`   - Status: ${order.status}`);
        console.log(`   - Payment Status: ${order.paymentStatus}`);
        console.log(`   - Total Amount: €${order.totalAmount}`);
        console.log(`   - Created At: ${order.createdAt}`);
        console.log(`   - Updated At: ${order.updatedAt}`);
        console.log(`   - Notes: ${order.notes || 'None'}`);

        console.log(`\n📦 Order Items:`);
        for (const item of order.items) {
            if (item.product) {
                console.log(`   - ${item.product.name}: ${item.quantity} units @ €${item.unitPrice} each = €${item.totalPrice}`);
            }
        }

        // Check current stock for all products in the order
        console.log(`\n📊 Current Stock Status:`);
        for (const item of order.items) {
            if (item.product) {
                const currentProduct = await Product.findById(item.product._id);
                console.log(`   - ${currentProduct.name}: ${currentProduct.stock} units available`);
            }
        }

        // Check if this order should have triggered stock release
        const now = new Date();
        const orderAge = Math.floor((now - order.createdAt) / (1000 * 60)); // minutes
        console.log(`\n⏰ Order Age: ${orderAge} minutes`);

        if (order.paymentStatus === 'Pending' && orderAge >= 30) {
            console.log(`⚠️  This order is ${orderAge} minutes old and still unpaid - should have triggered stock release`);
        } else if (order.paymentStatus === 'Paid') {
            console.log(`✅ Order is paid - stock should have been deducted`);
        } else {
            console.log(`⏳ Order is still within the 30-minute window`);
        }

        // Check recent stock release logs (if any)
        console.log(`\n🔍 Checking for stock release activity...`);

        // Look for orders with stock release notes
        const recentOrders = await Order.find({
            client: client._id,
            notes: { $regex: /stock.*release|Limite auto order/i }
        }).sort({ updatedAt: -1 }).limit(5);

        if (recentOrders.length > 0) {
            console.log(`📝 Recent orders with stock activity:`);
            for (const recentOrder of recentOrders) {
                console.log(`   - ${recentOrder.orderNumber}: ${recentOrder.status} (${recentOrder.paymentStatus}) - ${recentOrder.notes}`);
            }
        } else {
            console.log(`📝 No recent stock release activity found`);
        }

        // Check if there are any auto orders triggered
        const autoOrders = await Order.find({
            client: client._id,
            notes: { $regex: /auto.*order|Limite auto order/i }
        }).sort({ createdAt: -1 }).limit(3);

        if (autoOrders.length > 0) {
            console.log(`\n🤖 Auto orders found:`);
            for (const autoOrder of autoOrders) {
                console.log(`   - ${autoOrder.orderNumber}: ${autoOrder.status} (${autoOrder.paymentStatus}) - ${autoOrder.notes}`);
            }
        }

        console.log(`\n✅ Order check completed`);

    } catch (error) {
        console.error('❌ Error checking order:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkOrderStock();
















