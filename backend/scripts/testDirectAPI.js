const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
const Client = require('../models/Client');
require('dotenv').config();

async function testDirectAPI() {
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

        // Test the deletion logic directly
        console.log('\n🧪 Testing deletion logic directly...');

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
                console.log('  Brand:', inactivePM.cardType);
                console.log('  Last 4:', inactivePM.last4);
                console.log('  Active:', inactivePM.isActive);
            } else {
                console.log('❌ Payment method still active');
            }
        } else {
            console.log('❌ Payment method not found for deletion');
        }

        // Test getting payment methods (should not include inactive ones)
        console.log('\n🧪 Testing get payment methods...');
        const activePaymentMethods = await PaymentMethod.find({
            client: client._id,
            isActive: true
        });

        console.log(`✅ Found ${activePaymentMethods.length} active payment methods`);
        activePaymentMethods.forEach((pm, index) => {
            console.log(`  ${index + 1}. ${pm.cardType.toUpperCase()} ending in ${pm.last4} (expires ${pm.getFormattedExpiry()})`);
        });

    } catch (error) {
        console.error('❌ Error testing direct API:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testDirectAPI();




















