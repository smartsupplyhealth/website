const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function createTestOrders() {
    try {
        console.log('🔄 Creating test client and orders...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find your supplier
        const supplier = await Supplier.findOne({ email: 'essayedneder0711@gmail.com' });
        if (!supplier) {
            console.log('❌ Supplier not found');
            return;
        }

        // Create a test client
        const testClient = new Client({
            name: 'Dr. Marie Dubois',
            email: 'marie.dubois@test.com',
            password: 'testclient123', // Will be hashed by pre-save middleware
            phone: '+33 1 23 45 67 89',
            clinicName: 'Clinique de Test',
            clinicType: 'clinic',
            address: '123 Rue de Test, 75001 Paris, France',
            isActive: true
        });
        await testClient.save();
        console.log(`✅ Test client created: ${testClient.name}`);

        // Get some products from your supplier
        const products = await Product.find({ supplier: supplier._id }).limit(3);
        if (products.length === 0) {
            console.log('❌ No products found for supplier');
            return;
        }

        // Create test orders
        const testOrders = [
            {
                orderNumber: 'TEST-' + Date.now(),
                client: testClient._id,
                items: [{
                    product: products[0]._id,
                    quantity: 2,
                    unitPrice: products[0].price,
                    totalPrice: products[0].price * 2
                }],
                totalAmount: products[0].price * 2,
                deliveryAddress: {
                    street: '123 Rue de Test',
                    city: 'Paris',
                    postalCode: '75001',
                    country: 'France'
                },
                status: 'pending',
                paymentStatus: 'Pending',
                notes: 'Test order 1'
            },
            {
                orderNumber: 'TEST-' + (Date.now() + 1),
                client: testClient._id,
                items: [{
                    product: products[1]._id,
                    quantity: 1,
                    unitPrice: products[1].price,
                    totalPrice: products[1].price * 1
                }],
                totalAmount: products[1].price * 1,
                deliveryAddress: {
                    street: '123 Rue de Test',
                    city: 'Paris',
                    postalCode: '75001',
                    country: 'France'
                },
                status: 'confirmed',
                paymentStatus: 'Paid',
                notes: 'Test order 2'
            },
            {
                orderNumber: 'TEST-' + (Date.now() + 2),
                client: testClient._id,
                items: [{
                    product: products[2]._id,
                    quantity: 3,
                    unitPrice: products[2].price,
                    totalPrice: products[2].price * 3
                }],
                totalAmount: products[2].price * 3,
                deliveryAddress: {
                    street: '123 Rue de Test',
                    city: 'Paris',
                    postalCode: '75001',
                    country: 'France'
                },
                status: 'delivered',
                paymentStatus: 'Paid',
                notes: 'Test order 3'
            }
        ];

        for (const orderData of testOrders) {
            const order = new Order(orderData);
            await order.save();
            console.log(`✅ Order created: ${order.orderNumber} - Status: ${order.status}`);
        }

        console.log('\n🎉 Test orders created successfully!');
        console.log('\n📋 Summary:');
        console.log(`- Test client: ${testClient.name} (${testClient.email})`);
        console.log(`- Orders created: ${testOrders.length}`);
        console.log(`- Supplier: ${supplier.name} (${supplier.email})`);

    } catch (error) {
        console.error('❌ Error creating test orders:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

createTestOrders();

