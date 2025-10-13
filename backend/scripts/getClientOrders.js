const mongoose = require('mongoose');
const Order = require('../models/Order');
const Client = require('../models/Client');
require('dotenv').config();

async function getClientOrders() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsupply');
        console.log('✅ Connected to MongoDB');

        const clientEmail = 'essayedneder0798@gmail.com';

        console.log(`\n🔍 Searching for orders for client: ${clientEmail}\n`);

        // Find the client
        const client = await Client.findOne({ email: clientEmail });
        if (!client) {
            console.log(`❌ Client ${clientEmail} not found`);
            return;
        }

        console.log(`👤 Client found: ${client.name} (${client.email})`);
        console.log(`🆔 Client ID: ${client._id}`);

        // Get all orders for this client
        const orders = await Order.find({ client: client._id })
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 });

        console.log(`\n📋 Total orders found: ${orders.length}\n`);

        if (orders.length === 0) {
            console.log('❌ No orders found for this client');
            return;
        }

        // Display all orders
        orders.forEach((order, index) => {
            console.log(`\n${index + 1}. Order #${order.orderNumber}`);
            console.log(`   📅 Created: ${order.createdAt.toLocaleString()}`);
            console.log(`   📅 Updated: ${order.updatedAt.toLocaleString()}`);
            console.log(`   💰 Total: €${order.totalAmount}`);
            console.log(`   📊 Status: ${order.status}`);
            console.log(`   💳 Payment: ${order.paymentStatus}`);
            console.log(`   📝 Notes: ${order.notes || 'None'}`);

            if (order.paymentDetails) {
                console.log(`   💳 Payment Method: ${order.paymentDetails.method}`);
                console.log(`   🆔 Transaction ID: ${order.paymentDetails.transactionId}`);
            }

            if (order.coupon) {
                console.log(`   🎫 Coupon: ${order.coupon.code} (€${order.coupon.discountAmount} discount)`);
            }

            console.log(`   📦 Items (${order.items.length}):`);
            order.items.forEach((item, itemIndex) => {
                if (item.product) {
                    console.log(`      ${itemIndex + 1}. ${item.product.name}`);
                    console.log(`         Quantity: ${item.quantity}`);
                    console.log(`         Unit Price: €${item.unitPrice}`);
                    console.log(`         Total: €${item.totalPrice}`);
                } else {
                    console.log(`      ${itemIndex + 1}. Product ID: ${item.product} (not found)`);
                }
            });

            console.log(`   📍 Delivery Address:`);
            console.log(`      Street: ${order.deliveryAddress.street}`);
            console.log(`      City: ${order.deliveryAddress.city}`);
            console.log(`      Postal Code: ${order.deliveryAddress.postalCode}`);
            console.log(`      Country: ${order.deliveryAddress.country}`);
        });

        // Summary by status
        console.log(`\n📊 Summary by Status:`);
        const statusCounts = {};
        orders.forEach(order => {
            statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });

        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} orders`);
        });

        // Summary by payment status
        console.log(`\n💳 Summary by Payment Status:`);
        const paymentStatusCounts = {};
        orders.forEach(order => {
            paymentStatusCounts[order.paymentStatus] = (paymentStatusCounts[order.paymentStatus] || 0) + 1;
        });

        Object.entries(paymentStatusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} orders`);
        });

        // Total amount
        const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        console.log(`\n💰 Total Amount: €${totalAmount.toFixed(2)}`);

        console.log(`\n✅ Order retrieval completed`);

    } catch (error) {
        console.error('❌ Error retrieving orders:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
getClientOrders();
















