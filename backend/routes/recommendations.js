const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { auth, authorize } = require('../middleware/auth');

// GET /api/recommendations - Get recommendations for logged-in client
router.get('/', auth, authorize('client'), recommendationController.getRecommendationsForClient);

// GET /api/recommendations/:clientId - Get recommendations for specific client (admin/supplier use)
router.get('/:clientId', auth, recommendationController.getRecommendationsForClient);

module.exports = router;


