const mongoose = require('mongoose');
const Order = require('../models/Order');
const Client = require('../models/Client');
require('dotenv').config();

async function testOrderCreation() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a client
        const client = await Client.findOne({ email: 'essayedneder0798@gmail.com' });

        if (!client) {
            console.log('❌ No client found');
            return;
        }

        console.log(`✅ Found client: ${client.name} (${client.email})`);

        // Create a test order
        const testOrder = new Order({
            orderNumber: 'TEST-' + Date.now(),
            client: client._id,
            items: [{
                product: new mongoose.Types.ObjectId(),
                quantity: 1,
                unitPrice: 100,
                totalPrice: 100
            }],
            totalAmount: 100,
            deliveryAddress: {
                street: 'Test Street',
                city: 'Test City',
                postalCode: '12345',
                country: 'Test Country'
            },
            notes: 'Test order creation',
            paymentStatus: 'Pending'
        });

        console.log('\n📝 Creating test order...');
        console.log('Before save - Payment Status:', testOrder.paymentStatus);

        await testOrder.save();

        console.log('After save - Payment Status:', testOrder.paymentStatus);
        console.log('Order ID:', testOrder._id);
        console.log('Order Number:', testOrder.orderNumber);
        console.log('Created At:', testOrder.createdAt);
        console.log('Updated At:', testOrder.updatedAt);

        // Check if the order was modified after saving
        const savedOrder = await Order.findById(testOrder._id);
        console.log('\n🔍 Retrieved order from database:');
        console.log('Payment Status:', savedOrder.paymentStatus);
        console.log('Status:', savedOrder.status);
        console.log('Payment Details:', savedOrder.paymentDetails);

        // Clean up - delete the test order
        await Order.findByIdAndDelete(testOrder._id);
        console.log('\n🧹 Test order deleted');

    } catch (error) {
        console.error('❌ Error testing order creation:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testOrderCreation();


