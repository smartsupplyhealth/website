const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');

require('dotenv').config({ path: './.env' });

async function updateSuppliers() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    try {
        // Find suppliers without companyType or address
        const suppliersToUpdate = await Supplier.find({
            $or: [
                { companyType: { $exists: false } },
                { address: { $exists: false } }
            ]
        });

        console.log(`Found ${suppliersToUpdate.length} suppliers to update`);

        for (const supplier of suppliersToUpdate) {
            console.log(`Updating supplier: ${supplier.name} (${supplier.email})`);

            const updateData = {};

            if (!supplier.companyType) {
                updateData.companyType = 'other'; // Default value
                console.log(`  - Adding companyType: other`);
            }

            if (!supplier.address) {
                updateData.address = 'Non spécifiée'; // Default value
                console.log(`  - Adding address: Non spécifiée`);
            }

            await Supplier.findByIdAndUpdate(supplier._id, updateData);
            console.log(`  ✅ Updated successfully`);
        }

        console.log('✅ Finished updating all suppliers');

    } catch (error) {
        console.error('❌ Error in updateSuppliers script:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateSuppliers();
