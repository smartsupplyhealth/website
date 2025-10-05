// backend/scripts/testChatbot.js
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const chatbotService = require('../services/chatbotService');

const MONGO_URI = process.env.MONGO_URI;

async function testChatbot() {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connecté.');

        // Test 1: Vérifier si le produit existe
        console.log('\n🔍 Test 1: Recherche du produit dans la base de données...');
        const products = await Product.find({
            name: { $regex: 'Collecteurs DASRI', $options: 'i' }
        });
        console.log(`Produits trouvés: ${products.length}`);
        if (products.length > 0) {
            console.log('Premier produit trouvé:', products[0].name);
            console.log('Description:', products[0].description);
        }

        // Test 2: Tester la fonction searchInProductDescriptions
        console.log('\n🔍 Test 2: Test de la fonction searchInProductDescriptions...');
        const searchResult = await chatbotService.searchInProductDescriptions('Collecteurs DASRI 5 L (carton de 20)');
        console.log('Résultat de la recherche:', searchResult);

        // Test 3: Tester la fonction isProductRelated
        console.log('\n🔍 Test 3: Test de isProductRelated...');
        const isProductRelated = chatbotService.isProductRelated('Collecteurs DASRI 5 L (carton de 20)');
        console.log('Est-ce lié aux produits?', isProductRelated);

        // Test 4: Test complet du chatbot
        console.log('\n🔍 Test 4: Test complet du chatbot...');
        const response = await chatbotService.getChatbotResponse('Collecteurs DASRI 5 L (carton de 20)');
        console.log('Réponse du chatbot:', response);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDéconnecté de MongoDB.');
    }
}

testChatbot();