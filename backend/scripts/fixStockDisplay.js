const mongoose = require('mongoose');
const ClientInventory = require('../models/ClientInventory');
const Product = require('../models/Product');
const Client = require('../models/Client');

// Connexion à MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('MongoDB connectée avec succès.');
    } catch (err) {
        console.error('Erreur de connexion à MongoDB:', err.message);
        process.exit(1);
    }
};

// Fonction pour corriger l'affichage du stock
const fixStockDisplay = async () => {
    try {
        console.log('🔧 Correction de l\'affichage du stock...');

        // Trouver tous les clients
        const clients = await Client.find({});
        console.log(`📋 Trouvé ${clients.length} clients`);

        // Trouver tous les produits
        const products = await Product.find({});
        console.log(`📦 Trouvé ${products.length} produits`);

        // Pour chaque client, créer un inventaire avec des stocks réalistes
        for (const client of clients) {
            console.log(`\n👤 Traitement du client: ${client.name} (${client.email})`);

            for (const product of products) {
                // Vérifier si l'inventaire existe déjà
                let inventory = await ClientInventory.findOne({
                    client: client._id,
                    product: product._id
                });

                if (!inventory) {
                    // Créer un nouvel inventaire avec des valeurs réalistes
                    inventory = new ClientInventory({
                        client: client._id,
                        product: product._id,
                        currentStock: Math.floor(Math.random() * 100) + 10, // Stock entre 10-110
                        dailyUsage: Math.floor(Math.random() * 5) + 1,      // Consommation 1-5/jour
                        reorderPoint: Math.floor(Math.random() * 20) + 5,   // Seuil 5-25
                        reorderQty: Math.floor(Math.random() * 50) + 20,    // Quantité commande 20-70
                        autoOrder: { enabled: true }
                    });

                    await inventory.save();
                    console.log(`  ✅ Créé inventaire pour: ${product.name} - Stock: ${inventory.currentStock}`);
                } else {
                    // Mettre à jour le stock existant s'il est à 0
                    if (inventory.currentStock === 0) {
                        inventory.currentStock = Math.floor(Math.random() * 100) + 10;
                        inventory.dailyUsage = Math.floor(Math.random() * 5) + 1;
                        inventory.reorderPoint = Math.floor(Math.random() * 20) + 5;
                        inventory.reorderQty = Math.floor(Math.random() * 50) + 20;
                        await inventory.save();
                        console.log(`  🔄 Mis à jour: ${product.name} - Nouveau stock: ${inventory.currentStock}`);
                    } else {
                        console.log(`  ℹ️  Déjà configuré: ${product.name} - Stock: ${inventory.currentStock}`);
                    }
                }
            }
        }

        console.log('\n🎉 Correction du stock terminée !');

        // Afficher un résumé
        const totalInventory = await ClientInventory.countDocuments();
        const lowStockItems = await ClientInventory.countDocuments({ currentStock: { $lte: 10 } });

        console.log(`\n📊 Résumé:`);
        console.log(`   - Total d'articles en inventaire: ${totalInventory}`);
        console.log(`   - Articles en stock faible (≤10): ${lowStockItems}`);

    } catch (error) {
        console.error('❌ Erreur lors de la correction du stock:', error);
    }
};

// Exécution du script
const run = async () => {
    await connectDB();
    await fixStockDisplay();
    await mongoose.connection.close();
    console.log('👋 Connexion fermée.');
};

run();
