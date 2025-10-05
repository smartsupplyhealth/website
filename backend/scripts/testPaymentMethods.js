const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
const Client = require('../models/Client');
require('dotenv').config();

async function testPaymentMethods() {
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

        // Test fetching payment methods
        const paymentMethods = await PaymentMethod.find({
            client: client._id,
            isActive: true
        }).sort({ isDefault: -1, createdAt: -1 });

        console.log(`✅ Found ${paymentMethods.length} payment methods`);

        // Test formatting
        const formattedMethods = paymentMethods.map(pm => ({
            id: pm._id,
            stripePaymentMethodId: pm.stripePaymentMethodId,
            brand: pm.cardType,
            last4: pm.last4,
            exp_month: pm.expiryMonth,
            exp_year: pm.expiryYear,
            displayName: pm.getDisplayName(),
            isDefault: pm.isDefault
        }));

        console.log('✅ Formatted methods:', JSON.stringify(formattedMethods, null, 2));

    } catch (error) {
        console.error('❌ Error testing payment methods:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testPaymentMethods();




















