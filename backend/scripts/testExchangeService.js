/**
 * Script de test direct du service de taux de change
 * Teste la conversion sans passer par l'API
 */

const exchangeRateService = require('../services/exchangeRateService');

async function testExchangeService() {
    console.log('🧪 Test direct du service de taux de change\n');

    try {
        // Test 1: Obtenir le taux de change BTC/EUR
        console.log('1️⃣ Récupération du taux de change BTC/EUR...');
        const btcRate = await exchangeRateService.getExchangeRate('BTC', 'EUR');
        console.log(`✅ Taux de change BTC/EUR: ${btcRate} EUR`);
        console.log(`📊 1 BTC = ${btcRate} EUR`);

        // Test 2: Conversion de 5000 EUR vers BTC
        console.log('\n2️⃣ Conversion de 5000 EUR vers BTC...');
        const btcAmount = await exchangeRateService.convertEurToCrypto(5000, 'BTC');
        console.log(`✅ Conversion: 5000 EUR = ${btcAmount} BTC`);

        // Comparaison avec les anciens taux
        const oldRate = 50000;
        const oldAmount = (5000 / oldRate).toFixed(8);
        console.log(`\n📊 Comparaison:`);
        console.log(`   Nouveau taux: ${btcRate} EUR → ${btcAmount} BTC`);
        console.log(`   Ancien taux: ${oldRate} EUR → ${oldAmount} BTC`);
        console.log(`   Différence: ${(btcAmount - parseFloat(oldAmount)).toFixed(8)} BTC`);

        // Test 3: Test avec d'autres montants
        console.log('\n3️⃣ Test avec différents montants...');
        const testAmounts = [100, 1000, 10000];

        for (const amount of testAmounts) {
            try {
                const cryptoAmount = await exchangeRateService.convertEurToCrypto(amount, 'BTC');
                console.log(`   ${amount} EUR = ${cryptoAmount} BTC`);
            } catch (error) {
                console.log(`   ❌ Erreur pour ${amount} EUR:`, error.message);
            }
        }

        // Test 4: Test avec d'autres crypto-monnaies
        console.log('\n4️⃣ Test avec d\'autres crypto-monnaies...');
        const cryptos = ['ETH', 'SOL'];

        for (const crypto of cryptos) {
            try {
                const rate = await exchangeRateService.getExchangeRate(crypto, 'EUR');
                const amount = await exchangeRateService.convertEurToCrypto(5000, crypto);
                console.log(`   ${crypto}: 1 ${crypto} = ${rate} EUR`);
                console.log(`   5000 EUR = ${amount} ${crypto}`);
            } catch (error) {
                console.log(`   ❌ Erreur pour ${crypto}:`, error.message);
            }
        }

        // Test 5: Statistiques du cache
        console.log('\n5️⃣ Statistiques du cache...');
        const cacheStats = exchangeRateService.getCacheStats();
        console.log(`   Taille du cache: ${cacheStats.size}`);
        console.log(`   Entrées:`, cacheStats.entries.map(e => `${e.key}: ${e.rate} (âge: ${Math.round(e.age / 1000)}s)`));

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        console.error('   Stack:', error.stack);
    }
}

// Exécuter le test
testExchangeService();


