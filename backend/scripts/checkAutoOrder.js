const mongoose = require('mongoose');
const ClientInventory = require('../models/ClientInventory');

async function checkAutoOrder() {
    try {
        await mongoose.connect('mongodb://admin:password123@localhost:27017/smartsupply?authSource=admin');
        console.log('✅ Connected to MongoDB');

        // Trouver l'inventaire avec auto activé
        const inventory = await ClientInventory.findOne({
            'autoOrder.enabled': true
        });

        if (inventory) {
            console.log('📊 Inventory avec auto activé:');
            console.log('Client:', inventory.client);
            console.log('Product:', inventory.product);
            console.log('Current Stock:', inventory.currentStock);
            console.log('Daily Usage:', inventory.dailyUsage);
            console.log('Auto Order complet:', JSON.stringify(inventory.autoOrder, null, 2));
            console.log('Auto Order quantity:', inventory.autoOrder?.quantity);
            console.log('Auto Order minThreshold:', inventory.autoOrder?.minThreshold);
        } else {
            console.log('❌ Aucun inventaire avec auto activé trouvé');
        }

        // Vérifier tous les inventaires
        const allInventories = await ClientInventory.find({});
        console.log(`\n📊 Total inventaires: ${allInventories.length}`);

        for (const inv of allInventories) {
            console.log(`\n📦 Inventory:`);
            console.log('Client:', inv.client);
            console.log('Product:', inv.product);
            console.log('Current Stock:', inv.currentStock);
            console.log('Daily Usage:', inv.dailyUsage);
            console.log('Auto Order:', JSON.stringify(inv.autoOrder, null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkAutoOrder();















