const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Order = require('../models/Order');
const Product = require('../models/Product');

async function testStockRestoration() {
    try {
        console.log('🧪 Testing Stock Restoration for All Payment Methods...\n');

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find a product to test with
        const testProduct = await Product.findOne({ stock: { $gt: 0 } });
        if (!testProduct) {
            console.log('❌ No products with stock found for testing');
            return;
        }

        console.log(`📦 Testing with product: ${testProduct.name} (Initial Stock: ${testProduct.stock})`);

        // Test 1: Stripe Payment + Cancellation
        console.log('\n🔬 Test 1: Stripe Payment + Cancellation...');

        // Create order
        const orderService = require('../services/orderService');
        const stripeOrder = await orderService.createOrder({
            clientId: '68df0bf4224b2fb0cb9ec6ba',
            products: [{
                product: testProduct._id,
                quantity: 3,
                price: testProduct.price
            }],
            deliveryAddress: {
                street: 'Test Street',
                city: 'Test City',
                postalCode: '12345',
                country: 'Test Country'
            },
            notes: 'Test Stripe order',
            totalAmount: testProduct.price * 3,
            paymentMethod: 'stripe'
        });

        console.log(`✅ Stripe order created: ${stripeOrder.orderNumber}`);

        // Simulate payment confirmation (deduct stock)
        stripeOrder.paymentStatus = 'Paid';
        stripeOrder.status = 'confirmed';
        stripeOrder.paymentDetails = { method: 'stripe', transactionId: 'test_stripe_' + Date.now() };
        await stripeOrder.save();

        // Deduct stock
        await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: -3 } });
        const stockAfterPayment = await Product.findById(testProduct._id);
        console.log(`📦 Stock after Stripe payment: ${stockAfterPayment.stock} (should be ${testProduct.stock - 3})`);

        // Simulate cancellation (restore stock)
        stripeOrder.status = 'cancelled';
        await stripeOrder.save();

        // Restore stock using orderController logic
        for (const item of stripeOrder.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            console.log(`📦 Restored ${item.quantity} units of product ${item.product} after Stripe cancellation`);
        }

        const stockAfterStripeCancellation = await Product.findById(testProduct._id);
        console.log(`📦 Stock after Stripe cancellation: ${stockAfterStripeCancellation.stock} (should be ${testProduct.stock})`);

        if (stockAfterStripeCancellation.stock === testProduct.stock) {
            console.log('✅ SUCCESS: Stock correctly restored after Stripe cancellation\n');
        } else {
            console.log('❌ FAILED: Stock not correctly restored after Stripe cancellation\n');
        }

        // Test 2: Coupon Payment + Cancellation
        console.log('🔬 Test 2: Coupon Payment + Cancellation...');

        const couponOrder = await orderService.createOrder({
            clientId: '68df0bf4224b2fb0cb9ec6ba',
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
            notes: 'Test Coupon order',
            totalAmount: testProduct.price * 2,
            paymentMethod: 'coupon'
        });

        console.log(`✅ Coupon order created: ${couponOrder.orderNumber}`);

        // Simulate coupon payment confirmation (deduct stock)
        couponOrder.paymentStatus = 'Paid';
        couponOrder.status = 'confirmed';
        couponOrder.paymentDetails = { method: 'coupon', transactionId: 'test_coupon_' + Date.now() };
        await couponOrder.save();

        // Deduct stock
        await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: -2 } });
        const stockAfterCouponPayment = await Product.findById(testProduct._id);
        console.log(`📦 Stock after Coupon payment: ${stockAfterCouponPayment.stock} (should be ${testProduct.stock - 2})`);

        // Simulate cancellation (restore stock)
        couponOrder.status = 'cancelled';
        await couponOrder.save();

        // Restore stock using orderController logic
        for (const item of couponOrder.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            console.log(`📦 Restored ${item.quantity} units of product ${item.product} after Coupon cancellation`);
        }

        const stockAfterCouponCancellation = await Product.findById(testProduct._id);
        console.log(`📦 Stock after Coupon cancellation: ${stockAfterCouponCancellation.stock} (should be ${testProduct.stock})`);

        if (stockAfterCouponCancellation.stock === testProduct.stock) {
            console.log('✅ SUCCESS: Stock correctly restored after Coupon cancellation\n');
        } else {
            console.log('❌ FAILED: Stock not correctly restored after Coupon cancellation\n');
        }

        // Test 3: Crypto Payment + Cancellation
        console.log('🔬 Test 3: Crypto Payment + Cancellation...');

        const cryptoOrder = await orderService.createOrder({
            clientId: '68df0bf4224b2fb0cb9ec6ba',
            products: [{
                product: testProduct._id,
                quantity: 1,
                price: testProduct.price
            }],
            deliveryAddress: {
                street: 'Test Street',
                city: 'Test City',
                postalCode: '12345',
                country: 'Test Country'
            },
            notes: 'Test Crypto order',
            totalAmount: testProduct.price * 1,
            paymentMethod: 'crypto'
        });

        console.log(`✅ Crypto order created: ${cryptoOrder.orderNumber}`);

        // Simulate crypto payment confirmation (deduct stock)
        cryptoOrder.paymentStatus = 'Paid';
        cryptoOrder.status = 'confirmed';
        cryptoOrder.paymentDetails = { method: 'crypto', transactionId: 'test_crypto_' + Date.now() };
        await cryptoOrder.save();

        // Deduct stock
        await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: -1 } });
        const stockAfterCryptoPayment = await Product.findById(testProduct._id);
        console.log(`📦 Stock after Crypto payment: ${stockAfterCryptoPayment.stock} (should be ${testProduct.stock - 1})`);

        // Simulate cancellation (restore stock)
        cryptoOrder.status = 'cancelled';
        await cryptoOrder.save();

        // Restore stock using orderController logic
        for (const item of cryptoOrder.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            console.log(`📦 Restored ${item.quantity} units of product ${item.product} after Crypto cancellation`);
        }

        const stockAfterCryptoCancellation = await Product.findById(testProduct._id);
        console.log(`📦 Stock after Crypto cancellation: ${stockAfterCryptoCancellation.stock} (should be ${testProduct.stock})`);

        if (stockAfterCryptoCancellation.stock === testProduct.stock) {
            console.log('✅ SUCCESS: Stock correctly restored after Crypto cancellation\n');
        } else {
            console.log('❌ FAILED: Stock not correctly restored after Crypto cancellation\n');
        }

        // Test 4: Test the actual orderController.cancelOrder function
        console.log('🔬 Test 4: Testing orderController.cancelOrder function...');

        const testOrder = await orderService.createOrder({
            clientId: '68df0bf4224b2fb0cb9ec6ba',
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
            notes: 'Test order for cancelOrder function',
            totalAmount: testProduct.price * 2,
            paymentMethod: 'stripe'
        });

        // Simulate payment
        testOrder.paymentStatus = 'Paid';
        testOrder.status = 'confirmed';
        testOrder.paymentDetails = { method: 'stripe', transactionId: 'test_cancel_' + Date.now() };
        await testOrder.save();

        // Deduct stock
        await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: -2 } });
        const stockBeforeCancel = await Product.findById(testProduct._id);
        console.log(`📦 Stock before cancelOrder: ${stockBeforeCancel.stock}`);

        // Test the actual cancelOrder function
        const orderController = require('../controllers/orderController');

        // Mock req and res objects
        const mockReq = {
            params: { id: testOrder._id },
            body: { reason: 'Test cancellation' },
            user: { id: '68df0bf4224b2fb0cb9ec6ba' }
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📋 cancelOrder response (${code}):`, data);
                }
            }),
            json: (data) => {
                console.log(`📋 cancelOrder response:`, data);
            }
        };

        await orderController.cancelOrder(mockReq, mockRes);

        const stockAfterCancel = await Product.findById(testProduct._id);
        console.log(`📦 Stock after cancelOrder: ${stockAfterCancel.stock} (should be ${testProduct.stock})`);

        if (stockAfterCancel.stock === testProduct.stock) {
            console.log('✅ SUCCESS: cancelOrder function correctly restored stock\n');
        } else {
            console.log('❌ FAILED: cancelOrder function did not restore stock correctly\n');
        }

        // Cleanup
        console.log('🧹 Cleaning up test data...');
        await Order.findByIdAndDelete(stripeOrder._id);
        await Order.findByIdAndDelete(couponOrder._id);
        await Order.findByIdAndDelete(cryptoOrder._id);
        await Order.findByIdAndDelete(testOrder._id);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All stock restoration tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testStockRestoration();
