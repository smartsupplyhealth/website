const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

async function reassignProducts() {
    try {
        console.log('🔄 Reassigning products to correct supplier...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find your supplier account
        const yourSupplier = await Supplier.findOne({ email: 'essayedneder0711@gmail.com' });
        if (!yourSupplier) {
            console.log('❌ Your supplier account not found');
            return;
        }

        console.log(`✅ Found your supplier: ${yourSupplier.name} (${yourSupplier.companyName})`);

        // Find all products currently assigned to test supplier
        const products = await Product.find({});
        console.log(`📦 Found ${products.length} products to reassign`);

        // Reassign all products to your supplier
        const updateResult = await Product.updateMany(
            {}, // Update all products
            { supplier: yourSupplier._id }
        );

        console.log(`✅ Updated ${updateResult.modifiedCount} products`);

        // Verify the reassignment
        const updatedProducts = await Product.find({ supplier: yourSupplier._id }).populate('supplier', 'name companyName');
        console.log(`\n📋 Products now assigned to ${yourSupplier.name}:`);
        updatedProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - €${product.price}`);
        });

        console.log('\n🎉 Products successfully reassigned to your supplier account!');

    } catch (error) {
        console.error('❌ Error reassigning products:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

reassignProducts();

