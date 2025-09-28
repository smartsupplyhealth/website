const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

async function updateOrderStatuses() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find orders that don't have a status or have null status
        const ordersWithoutStatus = await Order.find({
            $or: [
                { status: { $exists: false } },
                { status: null },
                { status: '' }
            ]
        });

        console.log(`Found ${ordersWithoutStatus.length} orders without status`);

        // Update them to have 'pending' status
        if (ordersWithoutStatus.length > 0) {
            const result = await Order.updateMany(
                {
                    $or: [
                        { status: { $exists: false } },
                        { status: null },
                        { status: '' }
                    ]
                },
                { $set: { status: 'pending' } }
            );

            console.log(`Updated ${result.modifiedCount} orders to 'pending' status`);
        }

        // Also check for orders with 'confirmed' status that might need to be 'pending'
        const confirmedOrders = await Order.find({ status: 'confirmed' });
        console.log(`Found ${confirmedOrders.length} orders with 'confirmed' status`);

        // Count orders by status
        const statusCounts = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('Current order status distribution:');
        statusCounts.forEach(stat => {
            console.log(`  ${stat._id || 'null'}: ${stat.count}`);
        });

        console.log('Update completed successfully');
    } catch (error) {
        console.error('Error updating order statuses:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateOrderStatuses();
