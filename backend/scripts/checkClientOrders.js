const mongoose = require('mongoose');
const Order = require('../models/Order');
const Client = require('../models/Client');

async function checkClientOrders() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsupply');
        console.log('Connected to MongoDB');

        // Find the client
        const client = await Client.findOne({ email: 'essayedneder0798@gmail.com' });
        if (!client) {
            console.log('Client not found');
            return;
        }

        console.log(`\nClient found: ${client.name} (${client.email})`);
        console.log(`Client ID: ${client._id}`);

        // Get all orders for this client
        const orders = await Order.find({ client: client._id })
            .populate('items.product', 'name')
            .sort({ createdAt: -1 });

        console.log(`\nTotal orders found: ${orders.length}`);

        // Group by status
        const statusCounts = {
            pending: 0,
            confirmed: 0,
            processing: 0,
            delivered: 0,
            cancelled: 0
        };

        console.log('\nOrder details:');
        orders.forEach((order, index) => {
            console.log(`${index + 1}. Order ${order.orderNumber}:`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Payment Status: ${order.paymentStatus}`);
            console.log(`   Created: ${order.createdAt}`);
            console.log(`   Total: €${order.totalAmount}`);
            console.log('');

            // Count by status
            if (statusCounts.hasOwnProperty(order.status)) {
                statusCounts[order.status]++;
            }
        });

        console.log('\nStatus summary:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`${status}: ${count}`);
        });

        console.log(`\nTotal: ${orders.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkClientOrders();
















