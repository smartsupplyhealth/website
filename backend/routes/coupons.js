const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { auth } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/validate', couponController.validateCoupon);

// Protected routes (require authentication)
router.get('/', auth, couponController.getAllCoupons);
router.post('/create', auth, couponController.createCoupon);
router.post('/use/:couponId', auth, couponController.useCoupon);
router.get('/stats', auth, couponController.getCouponStats);

module.exports = router;
