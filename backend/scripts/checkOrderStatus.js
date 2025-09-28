const mongoose = require('mongoose');
const Order = require('../models/Order');
const Client = require('../models/Client');
require('dotenv').config();

async function checkOrderStatus() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the most recent orders
        const recentOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('client', 'name email');

        console.log(`\n📋 Recent Orders (${recentOrders.length}):`);

        recentOrders.forEach((order, index) => {
            console.log(`\n${index + 1}. Order #${order.orderNumber}`);
            console.log(`   Client: ${order.client.name} (${order.client.email})`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Payment Status: ${order.paymentStatus}`);
            console.log(`   Total Amount: €${order.totalAmount}`);
            console.log(`   Created: ${order.createdAt.toLocaleString()}`);
            console.log(`   Updated: ${order.updatedAt.toLocaleString()}`);

            if (order.paymentDetails) {
                console.log(`   Payment Method: ${order.paymentDetails.method}`);
                console.log(`   Transaction ID: ${order.paymentDetails.transactionId}`);
            }

            if (order.coupon) {
                console.log(`   Coupon: ${order.coupon.code} (€${order.coupon.discountAmount} discount)`);
            }
        });

        // Check for orders with 'Paid' status that shouldn't be paid
        const paidOrders = await Order.find({
            paymentStatus: 'Paid',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        console.log(`\n🔍 Recently Paid Orders (${paidOrders.length}):`);
        paidOrders.forEach((order, index) => {
            console.log(`\n${index + 1}. Order #${order.orderNumber}`);
            console.log(`   Payment Status: ${order.paymentStatus}`);
            console.log(`   Created: ${order.createdAt.toLocaleString()}`);
            console.log(`   Updated: ${order.updatedAt.toLocaleString()}`);
            console.log(`   Time Difference: ${Math.round((order.updatedAt - order.createdAt) / 1000)} seconds`);
        });

    } catch (error) {
        console.error('❌ Error checking order status:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkOrderStatus();
