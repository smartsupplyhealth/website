const mongoose = require('mongoose');
require('dotenv').config();

const Client = require('../models/Client');
const PaymentMethod = require('../models/PaymentMethod');

async function testSavedCards() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a client
        const client = await Client.findOne({
            stripeCustomerId: { $exists: true, $ne: null }
        });

        if (!client) {
            console.log('❌ No client found with Stripe customer ID');
            return;
        }

        console.log(`✅ Found client: ${client.name} (${client.email})`);

        // Get payment methods for this client
        const paymentMethods = await PaymentMethod.find({
            client: client._id,
            isActive: true
        }).sort({ isDefault: -1, createdAt: -1 });

        console.log(`✅ Found ${paymentMethods.length} payment methods:`);

        paymentMethods.forEach((pm, index) => {
            console.log(`  ${index + 1}. ${pm.cardType.toUpperCase()} ending in ${pm.last4}`);
            console.log(`     ID: ${pm._id}`);
            console.log(`     Stripe Payment Method ID: ${pm.stripePaymentMethodId}`);
            console.log(`     Is Default: ${pm.isDefault}`);
            console.log(`     Cardholder: ${pm.cardholderName}`);
            console.log('');
        });

        // Test the API response format
        const apiResponse = paymentMethods.map(pm => ({
            id: pm._id,
            stripePaymentMethodId: pm.stripePaymentMethodId,
            brand: pm.cardType,
            last4: pm.last4,
            exp_month: pm.expiryMonth,
            exp_year: pm.expiryYear,
            isDefault: pm.isDefault,
            cardholderName: pm.cardholderName
        }));

        console.log('✅ API Response format:');
        console.log(JSON.stringify(apiResponse, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testSavedCards();
