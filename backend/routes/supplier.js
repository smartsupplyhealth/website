const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { auth } = require('../middleware/auth');

// @route   GET api/supplier/stats
// @desc    Get supplier statistics for dashboard
// @access  Private
router.get('/stats', auth, supplierController.getSupplierStats);

module.exports = router;
