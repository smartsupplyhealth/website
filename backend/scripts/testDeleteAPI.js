const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
const Client = require('../models/Client');
require('dotenv').config();

async function testDeleteAPI() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get a client and payment method
        const client = await Client.findOne({ email: 'essayedneder0798@gmail.com' });
        const paymentMethod = await PaymentMethod.findOne({
            client: client._id,
            isActive: true
        });

        if (!client || !paymentMethod) {
            console.log('❌ No client or payment method found');
            return;
        }

        console.log('✅ Found client:', client.name);
        console.log('✅ Found payment method:', paymentMethod.cardType, paymentMethod.last4);
        console.log('  ID:', paymentMethod._id.toString());

        // Test the deletion logic from the controller
        console.log('\n🧪 Testing deletion logic...');

        const foundPM = await PaymentMethod.findOne({
            _id: paymentMethod._id,
            client: client._id,
            isActive: true
        });

        if (foundPM) {
            console.log('✅ Payment method found for deletion');

            // Simulate the deletion
            foundPM.isActive = false;
            await foundPM.save();

            console.log('✅ Payment method marked as inactive');

            // Verify it's no longer active
            const inactivePM = await PaymentMethod.findOne({
                _id: paymentMethod._id,
                isActive: false
            });

            if (inactivePM) {
                console.log('✅ Payment method successfully deactivated');
            } else {
                console.log('❌ Payment method still active');
            }
        } else {
            console.log('❌ Payment method not found for deletion');
        }

    } catch (error) {
        console.error('❌ Error testing delete API:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testDeleteAPI();




















