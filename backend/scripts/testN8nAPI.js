/**
 * Script de test pour l'API n8n/create
 * Teste les différents formats d'entrée
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/n8n';

// Données de test (remplacez par de vrais IDs de votre DB)
const TEST_CLIENT_ID = '64a1b2c3d4e5f6789abcdef0'; // Remplacez par un vrai clientId
const TEST_PRODUCT_ID_1 = '64a1b2c3d4e5f6789abcdef1'; // Remplacez par un vrai productId
const TEST_PRODUCT_ID_2 = '64a1b2c3d4e5f6789abcdef2'; // Remplacez par un vrai productId

async function testAPI() {
    console.log('🧪 Test de l\'API n8n/create\n');

    // Test 1: Format ancien (compatibilité)
    console.log('📝 Test 1: Format ancien (compatibilité)');
    try {
        const response1 = await axios.post(`${BASE_URL}/create`, {
            clientId: TEST_CLIENT_ID,
            productId: TEST_PRODUCT_ID_1,
            quantity: 2
        });
        console.log('✅ Succès:', response1.data.message);
    } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
    }

    // Test 2: Format produit unique (objet)
    console.log('\n📝 Test 2: Format produit unique (objet)');
    try {
        const response2 = await axios.post(`${BASE_URL}/create`, {
            clientId: TEST_CLIENT_ID,
            products: {
                productId: TEST_PRODUCT_ID_1,
                quantity: 3
            }
        });
        console.log('✅ Succès:', response2.data.message);
    } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
    }

    // Test 3: Format produits multiples (tableau)
    console.log('\n📝 Test 3: Format produits multiples (tableau)');
    try {
        const response3 = await axios.post(`${BASE_URL}/create`, {
            clientId: TEST_CLIENT_ID,
            products: [
                { productId: TEST_PRODUCT_ID_1, quantity: 2 },
                { productId: TEST_PRODUCT_ID_2, quantity: 1 }
            ]
        });
        console.log('✅ Succès:', response3.data.message);
    } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
    }

    // Test 4: Validation d'erreur (clientId manquant)
    console.log('\n📝 Test 4: Validation d\'erreur (clientId manquant)');
    try {
        const response4 = await axios.post(`${BASE_URL}/create`, {
            productId: TEST_PRODUCT_ID_1,
            quantity: 2
        });
        console.log('❌ Devrait échouer mais a réussi:', response4.data);
    } catch (error) {
        console.log('✅ Erreur attendue:', error.response?.data?.message);
    }

    // Test 5: Validation d'erreur (productId manquant)
    console.log('\n📝 Test 5: Validation d\'erreur (productId manquant)');
    try {
        const response5 = await axios.post(`${BASE_URL}/create`, {
            clientId: TEST_CLIENT_ID,
            products: [{ quantity: 2 }] // Pas de productId
        });
        console.log('❌ Devrait échouer mais a réussi:', response5.data);
    } catch (error) {
        console.log('✅ Erreur attendue:', error.response?.data?.message);
    }

    console.log('\n🎉 Tests terminés !');
}

// Exécuter les tests
if (require.main === module) {
    testAPI().catch(console.error);
}

module.exports = { testAPI };









