const mongoose = require('mongoose');
const ClientInventory = require('../models/ClientInventory');

async function checkInventory() {
    try {
        await mongoose.connect('mongodb://admin:password123@localhost:27017/smartsupply?authSource=admin');
        console.log('✅ Connected to MongoDB');

        // Check all inventories
        const allInventories = await ClientInventory.find({});
        console.log(`📊 Found ${allInventories.length} total inventories`);

        for (const inv of allInventories) {
            console.log(`\n📦 Inventory:`);
            console.log('Client:', inv.client);
            console.log('Product:', inv.product);
            console.log('Current Stock:', inv.currentStock);
            console.log('Daily Usage:', inv.dailyUsage);
            console.log('Auto Order:', inv.autoOrder);
            console.log('Full document:', JSON.stringify(inv, null, 2));
        }

        // Check all inventories with auto enabled
        const autoInventories = await ClientInventory.find({
            'autoOrder.enabled': true
        });
        console.log(`\n🔍 Found ${autoInventories.length} inventories with auto enabled`);

        for (const inv of autoInventories) {
            console.log(`- Client: ${inv.client}, Product: ${inv.product}, Stock: ${inv.currentStock}, Min: ${inv.autoOrder?.minThreshold}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkInventory();
