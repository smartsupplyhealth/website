const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { auth, authorize } = require('../middleware/auth');

router.get('/:clientId', auth, authorize('client'), recommendationController.getRecommendationsForClient);

module.exports = router;