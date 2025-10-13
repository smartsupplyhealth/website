const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
const Client = require('../models/Client');
require('dotenv').config();

async function checkPaymentMethods() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const clientEmail = 'essayedneder0798@gmail.com'; // Replace with your email
        const client = await Client.findOne({ email: clientEmail });

        if (!client) {
            console.error(`❌ Client with email ${clientEmail} not found.`);
            await mongoose.disconnect();
            return;
        }
        console.log(`✅ Found client: ${client.name}\n`);

        const paymentMethods = await PaymentMethod.find({ client: client._id, isActive: true });

        console.log(`📋 Found ${paymentMethods.length} payment methods:\n`);

        for (const pm of paymentMethods) {
            console.log(`Card: ${pm.cardType.toUpperCase()} ending in ${pm.last4}`);
            console.log(`  Expiry: ${pm.expiryMonth}/${pm.expiryYear}`);
            console.log(`  Cardholder: ${pm.cardholderName || 'N/A'}`);
            console.log(`  Stripe Payment Method ID: ${pm.stripePaymentMethodId || '❌ MISSING'}`);
            console.log(`  Default: ${pm.isDefault ? 'Yes' : 'No'}`);
            console.log(`  Active: ${pm.isActive ? 'Yes' : 'No'}`);
            console.log(`  Created: ${pm.createdAt}`);
            console.log('\n');
        }

    } catch (error) {
        console.error('❌ Error checking payment methods:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkPaymentMethods();









































