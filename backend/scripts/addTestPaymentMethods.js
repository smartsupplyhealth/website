const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
const Client = require('../models/Client');
require('dotenv').config();

async function addTestPaymentMethods() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a client to add payment methods for
        const client = await Client.findOne({ email: 'essayedneder0798@gmail.com' });

        if (!client) {
            console.log('❌ No client found. Please create a client first.');
            return;
        }

        console.log(`✅ Found client: ${client.name} (${client.email})`);

        // Create test payment methods
        const testPaymentMethods = [
            {
                client: client._id,
                stripePaymentMethodId: 'pm_test_visa_4242',
                cardType: 'visa',
                last4: '4242',
                expiryMonth: 4,
                expiryYear: 2029,
                cardholderName: 'Test User',
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
                cardholderName: 'Test User',
                cvv: '456',
                isDefault: false,
                isActive: true
            },
            {
                client: client._id,
                stripePaymentMethodId: 'pm_test_amex_0005',
                cardType: 'amex',
                last4: '0005',
                expiryMonth: 8,
                expiryYear: 2027,
                cardholderName: 'Test User',
                cvv: '789',
                isDefault: false,
                isActive: true
            }
        ];

        // Clear existing test payment methods for this client
        await PaymentMethod.deleteMany({
            client: client._id,
            stripePaymentMethodId: { $regex: /^pm_test_/ }
        });

        // Add new test payment methods
        for (const pmData of testPaymentMethods) {
            const paymentMethod = new PaymentMethod(pmData);
            await paymentMethod.save();
            console.log(`✅ Created payment method: ${paymentMethod.getDisplayName()}`);
        }

        // List all payment methods for this client
        const allPaymentMethods = await PaymentMethod.find({
            client: client._id,
            isActive: true
        });

        console.log(`\n📋 Total payment methods for ${client.name}: ${allPaymentMethods.length}`);

        allPaymentMethods.forEach((pm, index) => {
            console.log(`\n${index + 1}. ${pm.getDisplayName()}`);
            console.log(`   Card Type: ${pm.cardType.toUpperCase()}`);
            console.log(`   Last 4: ${pm.last4}`);
            console.log(`   Expiry: ${pm.getFormattedExpiry()}`);
            console.log(`   CVV: ${pm.cvv}`);
            console.log(`   Default: ${pm.isDefault ? 'Yes' : 'No'}`);
            console.log(`   Active: ${pm.isActive ? 'Yes' : 'No'}`);
        });

        console.log('\n🎯 Test Payment Methods Created Successfully!');
        console.log('\nYou can now test CVV validation:');
        console.log('- VISA ending in 4242: CVV = 123');
        console.log('- MASTERCARD ending in 5555: CVV = 456');
        console.log('- AMEX ending in 0005: CVV = 789');

    } catch (error) {
        console.error('❌ Error creating test payment methods:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

addTestPaymentMethods();




















