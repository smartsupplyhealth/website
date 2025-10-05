const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
    createPaymentIntent,
    updateOrderAfterPayment,
    createAutomaticOrderAndPay,
    createSetupIntent,
    getPaymentMethods,
    savePaymentMethod,
    detachPaymentMethod,
    updatePaymentMethod,
    setDefaultPaymentMethod,
    applyCoupon,
    processCouponPayment,
    processSavedCardPayment,
} = require('../controllers/paymentController');

// --- Routes for Order Payments ---
router.post('/create-payment-intent/:orderId', auth, authorize('client'), createPaymentIntent);
router.post('/update-order-payment-status/:orderId', auth, authorize('client'), updateOrderAfterPayment);
router.post('/process-saved-card-payment/:orderId', auth, authorize('client'), processSavedCardPayment);
router.post('/automatic-order', auth, authorize('client'), createAutomaticOrderAndPay);
router.post('/apply-coupon/:orderId', auth, authorize('client'), applyCoupon);
router.post('/coupon-payment/:orderId', auth, authorize('client'), processCouponPayment);

// --- Routes for Managing Payment Methods ---
router.get('/methods', auth, authorize('client'), getPaymentMethods);
router.get('/payment-methods', auth, authorize('client'), getPaymentMethods);
router.post('/create-setup-intent', auth, authorize('client'), createSetupIntent);
router.post('/save-payment-method', auth, authorize('client'), savePaymentMethod);
// CVV validation route removed - Stripe handles all validation
router.put('/payment-methods/:paymentMethodId', auth, authorize('client'), updatePaymentMethod);
router.put('/payment-methods/:paymentMethodId/set-default', auth, authorize('client'), setDefaultPaymentMethod);
// Ajout de la route pour supprimer une carte
router.delete('/payment-methods/:paymentMethodId', auth, authorize('client'), detachPaymentMethod);

module.exports = router;