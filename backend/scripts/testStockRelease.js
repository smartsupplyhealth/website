const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Order = require('../models/Order');
const Product = require('../models/Product');
const stockReleaseService = require('../services/stockReleaseService');

async function testStockRelease() {
    try {
        console.log('🧪 Testing Stock Release Service...\n');

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get stats before
        console.log('📊 Stats before test:');
        const statsBefore = await stockReleaseService.getStats();
        console.log(JSON.stringify(statsBefore, null, 2));
        console.log('');

        // Find an unpaid order older than 30 minutes
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const oldUnpaidOrder = await Order.findOne({
            paymentStatus: 'Pending',
            status: 'pending',
            createdAt: { $lte: thirtyMinutesAgo }
        }).populate('items.product');

        if (oldUnpaidOrder) {
            console.log(`🔍 Found old unpaid order: ${oldUnpaidOrder.orderNumber}`);
            console.log(`📅 Created at: ${oldUnpaidOrder.createdAt}`);
            console.log(`⏰ Minutes old: ${Math.floor((Date.now() - oldUnpaidOrder.createdAt.getTime()) / 60000)}`);
            console.log('');

            // Show product stock before
            console.log('📦 Product stock before release:');
            for (const item of oldUnpaidOrder.items) {
                if (item.product) {
                    console.log(`  - ${item.product.name}: ${item.product.stock} units`);
                }
            }
            console.log('');

            // Manually release stock for this order
            console.log('🔄 Manually releasing stock...');
            await stockReleaseService.releaseOrderStockManually(oldUnpaidOrder._id);
            console.log('✅ Stock released successfully!\n');

            // Show product stock after
            console.log('📦 Product stock after release:');
            for (const item of oldUnpaidOrder.items) {
                if (item.product) {
                    const updatedProduct = await Product.findById(item.product._id);
                    console.log(`  - ${updatedProduct.name}: ${updatedProduct.stock} units (+${item.quantity})`);
                }
            }
            console.log('');

            // Check order status
            const updatedOrder = await Order.findById(oldUnpaidOrder._id);
            console.log('📋 Updated order status:');
            console.log(`  - Status: ${updatedOrder.status}`);
            console.log(`  - Payment Status: ${updatedOrder.paymentStatus}`);
            console.log(`  - Notes: ${updatedOrder.notes}`);

        } else {
            console.log('❌ No old unpaid orders found for testing');
            console.log('💡 Create an order and wait 30+ minutes to test the automatic release');
        }

        // Get stats after
        console.log('\n📊 Stats after test:');
        const statsAfter = await stockReleaseService.getStats();
        console.log(JSON.stringify(statsAfter, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testStockRelease();
