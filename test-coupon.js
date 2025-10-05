const axios = require('axios');

// Test script pour vérifier le système de coupon
async function testCouponSystem() {
    console.log('🧪 Test du système de coupon...\n');

    try {
        // Test 1: Validation d'un coupon valide
        console.log('1️⃣ Test avec coupon SAVE10...');
        const response1 = await axios.post('http://localhost:5000/api/coupons/validate', {
            code: 'SAVE10',
            orderAmount: 63.34,
            productIds: []
        });

        console.log('✅ Réponse API:', {
            success: response1.data.success,
            discountAmount: response1.data.discountAmount,
            finalAmount: response1.data.finalAmount,
            coupon: response1.data.coupon?.code
        });

        // Test 2: Validation d'un coupon invalide
        console.log('\n2️⃣ Test avec coupon invalide...');
        try {
            const response2 = await axios.post('http://localhost:5000/api/coupons/validate', {
                code: 'INVALID',
                orderAmount: 63.34,
                productIds: []
            });
            console.log('❌ Coupon invalide accepté:', response2.data);
        } catch (error) {
            console.log('✅ Coupon invalide correctement rejeté:', error.response?.data?.message);
        }

        // Test 3: Test avec montant trop faible
        console.log('\n3️⃣ Test avec montant trop faible...');
        try {
            const response3 = await axios.post('http://localhost:5000/api/coupons/validate', {
                code: 'SAVE10',
                orderAmount: 30, // Trop faible pour SAVE10 (min 50)
                productIds: []
            });
            console.log('❌ Montant trop faible accepté:', response3.data);
        } catch (error) {
            console.log('✅ Montant trop faible correctement rejeté:', error.response?.data?.message);
        }

        // Test 4: Test de parsing des données
        console.log('\n4️⃣ Test de parsing des données...');
        const discount = parseFloat(response1.data.discountAmount);
        const final = parseFloat(response1.data.finalAmount);
        const originalAmount = 63.34;

        console.log('📊 Données parsées:', {
            discount,
            final,
            originalAmount,
            isValidDiscount: !isNaN(discount) && discount >= 0,
            isValidFinal: !isNaN(final) && final > 0,
            discountType: typeof response1.data.discountAmount,
            finalType: typeof response1.data.finalAmount
        });

        // Test 5: Validation des calculs
        console.log('\n5️⃣ Test des calculs...');
        const expectedFinal = originalAmount - discount;
        console.log('🧮 Calculs:', {
            originalAmount,
            discount,
            expectedFinal,
            actualFinal: final,
            calculationCorrect: Math.abs(expectedFinal - final) < 0.01
        });

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        if (error.response) {
            console.error('📄 Réponse d\'erreur:', error.response.data);
        }
    }
}

// Exécuter le test
testCouponSystem();

