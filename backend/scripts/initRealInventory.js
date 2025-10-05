require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');
const Product = require('../models/Product');
const ClientInventory = require('../models/ClientInventory');

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB déjà connectée.');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('MongoDB connectée avec succès.');
    } catch (err) {
        console.error('Erreur de connexion à MongoDB:', err.message);
        process.exit(1);
    }
};

const initRealInventory = async () => {
    await connectDB();
    console.log('🔧 Initialisation de l\'inventaire client avec les vraies données...');

    try {
        // Trouver le client
        const client = await Client.findOne({});
        if (!client) {
            console.log('❌ Aucun client trouvé');
            return;
        }
        console.log(`👤 Client trouvé: ${client.name} (${client.email})`);

        // Trouver les produits mentionnés
        const products = await Product.find({
            name: {
                $in: [
                    'Tensiomètre électronique bras',
                    'Masques chirurgicaux type IIR (boîte de 50)',
                    'Gants nitrile non poudrés (boîte de 100)'
                ]
            }
        });

        console.log(`📦 Produits trouvés: ${products.length}`);

        // Données réelles basées sur ce que vous voyez dans l'interface
        const realInventoryData = [
            { name: 'Tensiomètre électronique bras', stock: 8, consumption: 4, minThreshold: 4, autoQty: 20 },
            { name: 'Masques chirurgicaux type IIR (boîte de 50)', stock: 4, consumption: 3, minThreshold: 1, autoQty: 10 },
            { name: 'Gants nitrile non poudrés (boîte de 100)', stock: 3, consumption: 1, minThreshold: 1, autoQty: 5 }
        ];

        let totalCreated = 0;

        for (const data of realInventoryData) {
            const product = products.find(p => p.name === data.name);
            if (!product) {
                console.log(`⚠️  Produit non trouvé: ${data.name}`);
                continue;
            }

            // Vérifier si l'inventaire existe déjà
            let inventoryItem = await ClientInventory.findOne({
                client: client._id,
                product: product._id
            });

            if (inventoryItem) {
                // Mettre à jour les données existantes
                inventoryItem.currentStock = data.stock;
                inventoryItem.dailyUsage = data.consumption;
                inventoryItem.reorderPoint = data.minThreshold;
                inventoryItem.reorderQty = data.autoQty;
                inventoryItem.autoOrder = { enabled: true };
                await inventoryItem.save();
                console.log(`🔄 Mis à jour: ${data.name} - Stock: ${data.stock}`);
            } else {
                // Créer un nouvel inventaire
                inventoryItem = new ClientInventory({
                    client: client._id,
                    product: product._id,
                    currentStock: data.stock,
                    dailyUsage: data.consumption,
                    reorderPoint: data.minThreshold,
                    reorderQty: data.autoQty,
                    autoOrder: { enabled: true }
                });
                await inventoryItem.save();
                console.log(`➕ Créé: ${data.name} - Stock: ${data.stock}`);
            }
            totalCreated++;
        }

        console.log('\n🎉 Initialisation terminée !');
        console.log(`📊 Total d'articles d'inventaire: ${totalCreated}`);

    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connexion fermée.');
    }
};

initRealInventory();
