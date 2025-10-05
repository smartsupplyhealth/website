const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
require('dotenv').config();

async function testCardDeletion() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get a payment method
        const paymentMethod = await PaymentMethod.findOne({ isActive: true });

        if (!paymentMethod) {
            console.log('❌ No active payment methods found');
            return;
        }

        console.log('✅ Found payment method:');
        console.log('  ID:', paymentMethod._id);
        console.log('  ID as string:', paymentMethod._id.toString());
        console.log('  Brand:', paymentMethod.cardType);
        console.log('  Last 4:', paymentMethod.last4);
        console.log('  Active:', paymentMethod.isActive);

        // Test the deletion logic
        console.log('\n🧪 Testing deletion logic...');

        const testId = paymentMethod._id.toString();
        console.log('Testing with ID:', testId);

        const foundPM = await PaymentMethod.findOne({
            _id: testId,
            isActive: true
        });

        if (foundPM) {
            console.log('✅ Payment method found for deletion');
            console.log('  Brand:', foundPM.cardType);
            console.log('  Last 4:', foundPM.last4);
        } else {
            console.log('❌ Payment method not found for deletion');
        }

    } catch (error) {
        console.error('❌ Error testing card deletion:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testCardDeletion();



















