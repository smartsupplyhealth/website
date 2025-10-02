const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
const Client = require('../models/Client');
require('dotenv').config();

async function checkCardCVV() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get a client
        const client = await Client.findOne({ email: 'essayedneder0798@gmail.com' });

        if (!client) {
            console.log('❌ No client found');
            return;
        }

        console.log('✅ Found client:', client.name);

        // Get all payment methods for this client
        const paymentMethods = await PaymentMethod.find({
            client: client._id,
            isActive: true
        });

        console.log(`\n📋 Found ${paymentMethods.length} payment methods:\n`);

        for (const pm of paymentMethods) {
            console.log(`Card: ${pm.cardType.toUpperCase()} ending in ${pm.last4}`);
            console.log(`  Expiry: ${pm.expiryMonth}/${pm.expiryYear}`);
            console.log(`  Stored CVV (hashed): ${pm.cvv}`);
            console.log(`  Cardholder: ${pm.cardholderName || 'Not set'}`);
            console.log(`  Default: ${pm.isDefault ? 'Yes' : 'No'}`);
            console.log(`  Active: ${pm.isActive ? 'Yes' : 'No'}`);

            // Test CVV validation with different values
            console.log(`  Testing CVV validation:`);
            console.log(`    CVV "123": ${await pm.validateCVV('123')}`);
            console.log(`    CVV "456": ${await pm.validateCVV('456')}`);
            console.log(`    CVV "789": ${await pm.validateCVV('789')}`);
            console.log(`    CVV "000": ${await pm.validateCVV('000')}`);
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error checking card CVV:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkCardCVV();






