const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ClientInventory = require('../models/ClientInventory');
const PaymentMethod = require('../models/PaymentMethod');
const Coupon = require('../models/Coupon');

// Import product data
const productsData = require('./products.json');

async function restoreDatabase() {
    try {
        console.log('🔄 Starting database restoration...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            Client.deleteMany({}),
            Supplier.deleteMany({}),
            Product.deleteMany({}),
            Order.deleteMany({}),
            ClientInventory.deleteMany({}),
            PaymentMethod.deleteMany({}),
            Coupon.deleteMany({})
        ]);
        console.log('✅ Existing data cleared');

        // Create sample supplier
        console.log('👤 Creating sample supplier...');
        const supplier = new Supplier({
            name: 'Jean Martin',
            email: 'contact@medisupply.fr',
            password: 'supplier123', // Will be hashed by pre-save middleware
            phone: '+33 1 23 45 67 89',
            companyName: 'MediSupply France SARL',
            isActive: true
        });
        await supplier.save();
        console.log('✅ Supplier created:', supplier.name);

        // Create sample client
        console.log('👤 Creating sample client...');
        const client = new Client({
            name: 'Dr. Jean Dupont',
            email: 'essayedneder0798@gmail.com',
            password: 'client123', // Will be hashed by pre-save middleware
            phone: '+33 1 98 76 54 32',
            clinicName: 'Cabinet Médical Dupont',
            clinicType: 'medical_office',
            address: '456 Avenue des Médecins, 69000 Lyon, France',
            isActive: true,
            stripeCustomerId: 'cus_test_client_123'
        });
        await client.save();
        console.log('✅ Client created:', client.name);

        // Create products with the supplier ID
        console.log('📦 Creating products...');
        const products = [];
        for (const productData of productsData) {
            const product = new Product({
                ...productData,
                supplier: supplier._id,
                images: productData.images || []
            });
            await product.save();
            products.push(product);
            console.log(`✅ Product created: ${product.name}`);
        }

        // Create client inventory
        console.log('📋 Creating client inventory...');
        for (const product of products.slice(0, 3)) { // Add first 3 products to inventory
            const inventory = new ClientInventory({
                client: client._id,
                product: product._id,
                currentStock: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
                reorderPoint: Math.floor(Math.random() * 20) + 5, // Random reorder point between 5-25
                reorderQty: Math.floor(Math.random() * 30) + 20, // Random reorder qty between 20-50
                autoOrder: {
                    enabled: true,
                    frequency: 'monthly'
                },
                lastUpdated: new Date()
            });
            await inventory.save();
            console.log(`✅ Inventory created for: ${product.name}`);
        }

        // Create sample payment methods
        console.log('💳 Creating sample payment methods...');
        const paymentMethods = [
            {
                client: client._id,
                stripePaymentMethodId: 'pm_test_visa_4242',
                cardType: 'visa',
                last4: '4242',
                expiryMonth: 4,
                expiryYear: 2029,
                cardholderName: 'Dr. Jean Dupont',
                cvv: '123',
                isDefault: true,
                isActive: true
            },
            {
                client: client._id,
                stripePaymentMethodId: 'pm_test_mastercard_5555',
                cardType: 'mastercard',
                last4: '5555',
                expiryMonth: 12,
                expiryYear: 2026,
                cardholderName: 'Dr. Jean Dupont',
                cvv: '456',
                isDefault: false,
                isActive: true
            }
        ];

        for (const pmData of paymentMethods) {
            const paymentMethod = new PaymentMethod(pmData);
            await paymentMethod.save();
            console.log(`✅ Payment method created: ${paymentMethod.getDisplayName()}`);
        }

        // Create sample orders
        console.log('📋 Creating sample orders...');
        const sampleOrders = [
            {
                orderNumber: 'ORD-' + Date.now(),
                client: client._id,
                items: [{
                    product: products[0]._id,
                    quantity: 5,
                    unitPrice: products[0].price,
                    totalPrice: products[0].price * 5
                }],
                totalAmount: products[0].price * 5,
                deliveryAddress: {
                    street: '456 Avenue des Médecins',
                    city: 'Lyon',
                    postalCode: '69000',
                    country: 'France'
                },
                status: 'pending',
                paymentStatus: 'Pending',
                notes: 'Sample order for testing'
            },
            {
                orderNumber: 'ORD-' + (Date.now() + 1),
                client: client._id,
                items: [{
                    product: products[1]._id,
                    quantity: 2,
                    unitPrice: products[1].price,
                    totalPrice: products[1].price * 2
                }],
                totalAmount: products[1].price * 2,
                deliveryAddress: {
                    street: '456 Avenue des Médecins',
                    city: 'Lyon',
                    postalCode: '69000',
                    country: 'France'
                },
                status: 'delivered',
                paymentStatus: 'Paid',
                notes: 'Completed sample order'
            }
        ];

        for (const orderData of sampleOrders) {
            const order = new Order(orderData);
            await order.save();
            console.log(`✅ Order created: ${order.orderNumber}`);
        }

        // Create sample coupons
        console.log('🎫 Creating sample coupons...');
        const sampleCoupons = [
            {
                code: 'WELCOME10',
                description: 'Welcome discount for new clients',
                type: 'percentage',
                value: 10,
                minOrderAmount: 50,
                usageLimit: 100,
                usedCount: 0,
                isActive: true,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            },
            {
                code: 'SAVE20',
                description: 'Fixed discount for bulk orders',
                type: 'fixed',
                value: 20,
                minOrderAmount: 200,
                usageLimit: 50,
                usedCount: 0,
                isActive: true,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
            }
        ];

        for (const couponData of sampleCoupons) {
            const coupon = new Coupon(couponData);
            await coupon.save();
            console.log(`✅ Coupon created: ${coupon.code}`);
        }

        console.log('\n🎉 Database restoration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Suppliers: 1`);
        console.log(`- Clients: 1`);
        console.log(`- Products: ${products.length}`);
        console.log(`- Inventory items: 3`);
        console.log(`- Payment methods: ${paymentMethods.length}`);
        console.log(`- Orders: ${sampleOrders.length}`);
        console.log(`- Coupons: ${sampleCoupons.length}`);

        console.log('\n🔐 Login credentials:');
        console.log('Client: essayedneder0798@gmail.com / client123');
        console.log('Supplier: contact@medisupply.fr / supplier123');

    } catch (error) {
        console.error('❌ Error restoring database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the restoration
restoreDatabase();
