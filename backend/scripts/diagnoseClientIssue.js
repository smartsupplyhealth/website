/**
 * Script de diagnostic pour le problème d'affichage des clients
 * Vérifie pourquoi essayedneder0711@gmail.com n'apparaît pas comme client
 * pour le fournisseur essayedneder0798@gmail.com
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
require('dotenv').config();

async function diagnoseClientIssue() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsupply');
        console.log('✅ Connected to MongoDB\n');

        const clientEmail = 'essayedneder0711@gmail.com';
        const supplierEmail = 'essayedneder0798@gmail.com';

        console.log(`🔍 DIAGNOSTIC: Pourquoi ${clientEmail} n'apparaît pas comme client de ${supplierEmail}\n`);

        // 1. Vérifier si le client existe
        console.log('1️⃣ Vérification du client...');
        const client = await Client.findOne({ email: clientEmail });
        if (!client) {
            console.log(`❌ Client ${clientEmail} non trouvé`);
            return;
        }
        console.log(`✅ Client trouvé: ${client.name} (ID: ${client._id})`);

        // 2. Vérifier si le fournisseur existe
        console.log('\n2️⃣ Vérification du fournisseur...');
        const supplier = await Supplier.findOne({ email: supplierEmail });
        if (!supplier) {
            console.log(`❌ Fournisseur ${supplierEmail} non trouvé`);
            return;
        }
        console.log(`✅ Fournisseur trouvé: ${supplier.name} (ID: ${supplier._id})`);

        // 3. Vérifier les commandes du client
        console.log('\n3️⃣ Vérification des commandes du client...');
        const clientOrders = await Order.find({ client: client._id })
            .populate('items.product', 'name price stock supplier')
            .sort({ createdAt: -1 });

        console.log(`📋 Nombre total de commandes du client: ${clientOrders.length}`);

        if (clientOrders.length === 0) {
            console.log('❌ Aucune commande trouvée pour ce client');
            return;
        }

        // 4. Analyser les produits dans les commandes
        console.log('\n4️⃣ Analyse des produits dans les commandes...');
        const productSuppliers = new Set();
        const supplierProducts = [];

        clientOrders.forEach((order, orderIndex) => {
            console.log(`\n📦 Commande ${orderIndex + 1} (${order.status}):`);
            order.items.forEach((item, itemIndex) => {
                if (item.product) {
                    const product = item.product;
                    console.log(`  - Produit ${itemIndex + 1}: ${product.name}`);
                    console.log(`    Prix: ${product.price}€, Stock: ${product.stock}, Fournisseur: ${product.supplier}`);

                    productSuppliers.add(product.supplier.toString());

                    if (product.supplier.toString() === supplier._id.toString()) {
                        supplierProducts.push({
                            orderId: order._id,
                            productName: product.name,
                            quantity: item.quantity,
                            price: product.price,
                            stock: product.stock
                        });
                    }
                } else {
                    console.log(`  - Produit ${itemIndex + 1}: PRODUIT SUPPRIMÉ (${item.product})`);
                }
            });
        });

        console.log(`\n📊 Fournisseurs des produits commandés: ${Array.from(productSuppliers).join(', ')}`);
        console.log(`🎯 Fournisseur cible: ${supplier._id}`);

        // 5. Vérifier si le fournisseur a des produits
        console.log('\n5️⃣ Vérification des produits du fournisseur...');
        const supplierProductsList = await Product.find({ supplier: supplier._id })
            .select('name price stock');

        console.log(`📦 Nombre de produits du fournisseur: ${supplierProductsList.length}`);
        if (supplierProductsList.length > 0) {
            console.log('📋 Produits du fournisseur:');
            supplierProductsList.forEach((product, index) => {
                console.log(`  ${index + 1}. ${product.name} - ${product.price}€ (Stock: ${product.stock})`);
            });
        }

        // 6. Vérifier les commandes contenant des produits du fournisseur
        console.log('\n6️⃣ Vérification des commandes avec produits du fournisseur...');
        const supplierProductIds = supplierProductsList.map(p => p._id);

        if (supplierProductIds.length > 0) {
            const ordersWithSupplierProducts = await Order.find({
                'items.product': { $in: supplierProductIds }
            }).populate('client', 'name email');

            console.log(`📋 Nombre de commandes contenant des produits du fournisseur: ${ordersWithSupplierProducts.length}`);

            if (ordersWithSupplierProducts.length > 0) {
                console.log('📦 Commandes avec produits du fournisseur:');
                ordersWithSupplierProducts.forEach((order, index) => {
                    console.log(`  ${index + 1}. Client: ${order.client?.name} (${order.client?.email}) - Status: ${order.status}`);
                });
            }
        }

        // 7. Test de la logique de récupération des clients
        console.log('\n7️⃣ Test de la logique de récupération des clients...');
        if (supplierProductIds.length > 0) {
            const testOrders = await Order.find({ 'items.product': { $in: supplierProductIds } })
                .populate('client', 'name email phone clinicName');

            const testClients = testOrders.reduce((acc, order) => {
                const client = order.client;
                if (client && !acc.some(c => c._id.equals(client._id))) {
                    acc.push(client);
                }
                return acc;
            }, []);

            console.log(`👥 Clients trouvés par la logique actuelle: ${testClients.length}`);
            testClients.forEach((client, index) => {
                console.log(`  ${index + 1}. ${client.name} (${client.email})`);
            });

            const targetClientInList = testClients.find(c => c.email === clientEmail);
            if (targetClientInList) {
                console.log(`✅ ${clientEmail} EST dans la liste des clients du fournisseur`);
            } else {
                console.log(`❌ ${clientEmail} N'EST PAS dans la liste des clients du fournisseur`);
            }
        }

        // 8. Résumé et recommandations
        console.log('\n8️⃣ RÉSUMÉ ET RECOMMANDATIONS:');
        console.log('='.repeat(50));

        if (supplierProducts.length > 0) {
            console.log(`✅ Le client ${clientEmail} a commandé des produits du fournisseur ${supplierEmail}`);
            console.log('📋 Produits commandés:');
            supplierProducts.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.productName} (Qty: ${item.quantity}, Stock: ${item.stock})`);
            });
            console.log('\n🔧 SOLUTION: Le problème pourrait être dans la logique frontend ou dans la récupération des données.');
        } else {
            console.log(`❌ Le client ${clientEmail} n'a PAS commandé de produits du fournisseur ${supplierEmail}`);
            console.log('🔧 SOLUTION: Le client doit commander des produits de ce fournisseur pour apparaître dans sa liste.');
        }

    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le diagnostic
diagnoseClientIssue();


