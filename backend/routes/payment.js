const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
    createPaymentIntent,
    updateOrderAfterPayment,
    createAutomaticOrderAndPay,
    createSetupIntent,
    getPaymentMethods,
    detachPaymentMethod, 
} = require('../controllers/paymentController');

// --- Routes for Order Payments ---
router.post('/create-payment-intent/:orderId', auth, authorize('client'), createPaymentIntent);
router.post('/update-order-payment-status/:orderId', auth, authorize('client'), updateOrderAfterPayment);
router.post('/automatic-order', auth, authorize('client'), createAutomaticOrderAndPay);

// --- Routes for Managing Payment Methods ---
router.get('/payment-methods', auth, authorize('client'), getPaymentMethods);
router.post('/create-setup-intent', auth, authorize('client'), createSetupIntent);
// Ajout de la route pour supprimer une carte
router.delete('/payment-methods/:paymentMethodId', auth, authorize('client'), detachPaymentMethod);

module.exports = router;