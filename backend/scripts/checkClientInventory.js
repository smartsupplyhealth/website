const mongoose = require('mongoose');
const ClientInventory = require('../models/ClientInventory');
const Product = require('../models/Product');
const Client = require('../models/Client');
require('dotenv').config();

async function checkClientInventory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsupply');
        console.log('✅ Connected to MongoDB');

        const clientEmail = 'essayedneder0798@gmail.com';

        console.log(`\n🔍 Checking inventory for client ${clientEmail}...\n`);

        // Find the client
        const client = await Client.findOne({ email: clientEmail });
        if (!client) {
            console.log(`❌ Client ${clientEmail} not found`);
            return;
        }
        console.log(`👤 Client found: ${client.name} (${client.email})`);

        // Find client inventory items
        const inventoryItems = await ClientInventory.find({ client: client._id }).populate('product');

        if (inventoryItems.length === 0) {
            console.log(`❌ No inventory items found for client ${clientEmail}`);
            return;
        }

        console.log(`\n📦 Client Inventory Items:`);
        for (const item of inventoryItems) {
            if (item.product) {
                console.log(`\n   Product: ${item.product.name}`);
                console.log(`   - Current Stock: ${item.currentStock}`);
                console.log(`   - Daily Usage: ${item.dailyUsage}`);
                console.log(`   - Reorder Point: ${item.reorderPoint}`);
                console.log(`   - Reorder Quantity: ${item.reorderQty}`);
                console.log(`   - Auto Order Enabled: ${item.autoOrder?.enabled || false}`);
                console.log(`   - Last Decrement: ${item.lastDecrementAt || 'Never'}`);

                // Check if auto order should trigger
                const shouldTrigger = item.autoOrder?.enabled &&
                    item.currentStock <= item.reorderPoint &&
                    item.reorderQty > 0;
                console.log(`   - Should Trigger Auto Order: ${shouldTrigger ? 'YES' : 'NO'}`);

                // Check global product stock
                const globalProduct = await Product.findById(item.product._id);
                console.log(`   - Global Product Stock: ${globalProduct.stock}`);
            }
        }

        // Check for gants nitrile specifically
        const gantsProduct = await Product.findOne({
            name: { $regex: /gants.*nitrile/i }
        });

        if (gantsProduct) {
            console.log(`\n🧤 Gants Nitrile Product Found:`);
            console.log(`   - Product ID: ${gantsProduct._id}`);
            console.log(`   - Name: ${gantsProduct.name}`);
            console.log(`   - Global Stock: ${gantsProduct.stock}`);
            console.log(`   - Price: €${gantsProduct.price}`);

            // Check if this product is in client inventory
            const gantsInventory = inventoryItems.find(item =>
                item.product && item.product._id.toString() === gantsProduct._id.toString()
            );

            if (gantsInventory) {
                console.log(`   - In Client Inventory: YES`);
                console.log(`   - Client Stock: ${gantsInventory.currentStock}`);
                console.log(`   - Auto Order Enabled: ${gantsInventory.autoOrder?.enabled || false}`);
                console.log(`   - Reorder Point: ${gantsInventory.reorderPoint}`);
                console.log(`   - Should Trigger: ${gantsInventory.autoOrder?.enabled && gantsInventory.currentStock <= gantsInventory.reorderPoint ? 'YES' : 'NO'}`);
            } else {
                console.log(`   - In Client Inventory: NO`);
            }
        }

        console.log(`\n✅ Inventory check completed`);

    } catch (error) {
        console.error('❌ Error checking inventory:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkClientInventory();
















