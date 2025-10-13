/**
 * Script de test pour les conversions crypto avec taux de change réels
 * Teste la conversion de 5000 EUR vers BTC avec les nouveaux taux
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/crypto-payments';

async function testCryptoConversion() {
    console.log('🧪 Test des conversions crypto avec taux de change réels\n');

    try {
        // Test 1: Obtenir le taux de change BTC/EUR
        console.log('1️⃣ Récupération du taux de change BTC/EUR...');
        const rateResponse = await axios.get(`${BASE_URL}/exchange-rates?cryptocurrency=BTC&fiat=EUR`);

        if (rateResponse.data.success) {
            const rate = rateResponse.data.data.rate;
            console.log(`✅ Taux de change BTC/EUR: ${rate} EUR`);
            console.log(`📊 1 BTC = ${rate} EUR`);
        } else {
            console.log('❌ Erreur lors de la récupération du taux de change');
            return;
        }

        // Test 2: Conversion de 5000 EUR vers BTC
        console.log('\n2️⃣ Conversion de 5000 EUR vers BTC...');
        const convertResponse = await axios.post(`${BASE_URL}/convert`, {
            amount: 5000,
            cryptocurrency: 'BTC'
        });

        if (convertResponse.data.success) {
            const data = convertResponse.data.data;
            console.log(`✅ Conversion réussie:`);
            console.log(`   Montant EUR: ${data.eurAmount} EUR`);
            console.log(`   Montant BTC: ${data.cryptoAmount} BTC`);
            console.log(`   Taux utilisé: ${data.exchangeRate} EUR`);
            console.log(`   Timestamp: ${data.timestamp}`);

            // Comparaison avec les anciens taux
            const oldRate = 50000;
            const oldAmount = (5000 / oldRate).toFixed(8);
            console.log(`\n📊 Comparaison:`);
            console.log(`   Nouveau taux: ${data.exchangeRate} EUR → ${data.cryptoAmount} BTC`);
            console.log(`   Ancien taux: ${oldRate} EUR → ${oldAmount} BTC`);
            console.log(`   Différence: ${(data.cryptoAmount - parseFloat(oldAmount)).toFixed(8)} BTC`);
        } else {
            console.log('❌ Erreur lors de la conversion:', convertResponse.data.message);
        }

        // Test 3: Test avec d'autres montants
        console.log('\n3️⃣ Test avec différents montants...');
        const testAmounts = [100, 1000, 10000];

        for (const amount of testAmounts) {
            try {
                const response = await axios.post(`${BASE_URL}/convert`, {
                    amount: amount,
                    cryptocurrency: 'BTC'
                });

                if (response.data.success) {
                    const data = response.data.data;
                    console.log(`   ${amount} EUR = ${data.cryptoAmount} BTC`);
                }
            } catch (error) {
                console.log(`   ❌ Erreur pour ${amount} EUR:`, error.message);
            }
        }

        // Test 4: Test avec d'autres crypto-monnaies
        console.log('\n4️⃣ Test avec d\'autres crypto-monnaies...');
        const cryptos = ['ETH', 'SOL'];

        for (const crypto of cryptos) {
            try {
                const response = await axios.post(`${BASE_URL}/convert`, {
                    amount: 5000,
                    cryptocurrency: crypto
                });

                if (response.data.success) {
                    const data = response.data.data;
                    console.log(`   ${data.eurAmount} EUR = ${data.cryptoAmount} ${crypto}`);
                }
            } catch (error) {
                console.log(`   ❌ Erreur pour ${crypto}:`, error.message);
            }
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        if (error.response) {
            console.error('   Détails:', error.response.data);
        }
    }
}

// Exécuter le test
testCryptoConversion();
