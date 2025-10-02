const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Supplier = require('../models/Supplier');
const Client = require('../models/Client');

async function cleanupTestData() {
    try {
        console.log('🧹 Cleaning up test data...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Remove test supplier
        const testSupplier = await Supplier.findOneAndDelete({ email: 'contact@medisupply.fr' });
        if (testSupplier) {
            console.log(`✅ Removed test supplier: ${testSupplier.name}`);
        }

        // Remove test client (keep if you want to use it for testing)
        const testClient = await Client.findOneAndDelete({ email: 'essayedneder0798@gmail.com' });
        if (testClient) {
            console.log(`✅ Removed test client: ${testClient.name}`);
        }

        console.log('\n🎉 Test data cleanup completed!');

    } catch (error) {
        console.error('❌ Error cleaning up test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

cleanupTestData();

