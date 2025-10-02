const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { auth } = require('../middleware/auth');

// @route   GET api/supplier/stats
// @desc    Get supplier statistics for dashboard
// @access  Private
router.get('/stats', auth, supplierController.getSupplierStats);

// @route   GET api/supplier/orders
// @desc    Get orders for supplier's products
// @access  Private
router.get('/orders', auth, supplierController.getSupplierOrders);

module.exports = router;
