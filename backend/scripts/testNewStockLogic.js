const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Order = require('../models/Order');
const Product = require('../models/Product');
const stockReleaseService = require('../services/stockReleaseService');

async function testNewStockLogic() {
    try {
        console.log('🧪 Testing New Stock Logic...\n');

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find a product to test with
        const testProduct = await Product.findOne({ stock: { $gt: 0 } });
        if (!testProduct) {
            console.log('❌ No products with stock found for testing');
            return;
        }

        console.log(`📦 Testing with product: ${testProduct.name} (Stock: ${testProduct.stock})`);

        // Get initial stock
        const initialStock = testProduct.stock;
        console.log(`📊 Initial stock: ${initialStock}\n`);

        // Test 1: Create an order (should NOT deduct stock)
        console.log('🔬 Test 1: Creating order (should NOT deduct stock)...');
        const orderData = {
            clientId: '68df0bf4224b2fb0cb9ec6ba', // Use existing client ID
            products: [{
                product: testProduct._id,
                quantity: 2,
                price: testProduct.price
            }],
            deliveryAddress: {
                street: 'Test Street',
                city: 'Test City',
                postalCode: '12345',
                country: 'Test Country'
            },
            notes: 'Test order for stock logic',
            totalAmount: testProduct.price * 2,
            paymentMethod: 'card'
        };

        const orderService = require('../services/orderService');
        const order = await orderService.createOrder(orderData);
        console.log(`✅ Order created: ${order.orderNumber}`);

        // Check stock after order creation
        const productAfterOrder = await Product.findById(testProduct._id);
        console.log(`📦 Stock after order creation: ${productAfterOrder.stock} (should be ${initialStock})`);

        if (productAfterOrder.stock === initialStock) {
            console.log('✅ SUCCESS: Stock was NOT deducted during order creation\n');
        } else {
            console.log('❌ FAILED: Stock was incorrectly deducted during order creation\n');
        }

        // Test 2: Simulate payment confirmation (should deduct stock)
        console.log('🔬 Test 2: Simulating payment confirmation (should deduct stock)...');

        // Update order to paid status
        order.paymentStatus = 'Paid';
        order.status = 'confirmed';
        order.paymentDetails = { method: 'stripe', transactionId: 'test_payment_' + Date.now() };
        await order.save();

        // Deduct stock manually (simulating payment controller)
        await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: -2 } });
        console.log('📦 Stock deducted after payment confirmation');

        // Check stock after payment
        const productAfterPayment = await Product.findById(testProduct._id);
        console.log(`📦 Stock after payment: ${productAfterPayment.stock} (should be ${initialStock - 2})`);

        if (productAfterPayment.stock === initialStock - 2) {
            console.log('✅ SUCCESS: Stock was correctly deducted after payment\n');
        } else {
            console.log('❌ FAILED: Stock was not correctly deducted after payment\n');
        }

        // Test 3: Test stock release service (should not affect stock)
        console.log('🔬 Test 3: Testing stock release service...');

        // Create an old unpaid order
        const oldOrderData = {
            ...orderData,
            totalAmount: testProduct.price * 1
        };

        // Manually set old date
        const oldOrder = await orderService.createOrder(oldOrderData);
        oldOrder.createdAt = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
        await oldOrder.save();

        console.log(`📦 Stock before stock release: ${productAfterPayment.stock}`);

        // Test stock release service
        await stockReleaseService.releaseOrderStockManually(oldOrder._id);

        const productAfterRelease = await Product.findById(testProduct._id);
        console.log(`📦 Stock after stock release: ${productAfterRelease.stock} (should be unchanged)`);

        if (productAfterRelease.stock === productAfterPayment.stock) {
            console.log('✅ SUCCESS: Stock release service did not affect stock (correct behavior)\n');
        } else {
            console.log('❌ FAILED: Stock release service incorrectly modified stock\n');
        }

        // Cleanup
        console.log('🧹 Cleaning up test data...');
        await Order.findByIdAndDelete(order._id);
        await Order.findByIdAndDelete(oldOrder._id);

        // Restore original stock
        await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: 2 } });
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testNewStockLogic();
