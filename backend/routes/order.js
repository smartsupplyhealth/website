const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Client routes
router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getOrders); // This is likely for suppliers/admins
router.get('/my-orders', auth, orderController.getMyOrders);
router.get('/budget-analytics', auth, orderController.getBudgetAnalytics);
router.get('/my-products', auth, orderController.getMyOrderedProducts);
router.get('/:id', auth, orderController.getOrderById);
router.delete('/:id', auth, orderController.cancelOrder);

// Supplier routes
router.put('/:id/status', auth, orderController.updateOrderStatus);
router.get('/supplier/clients', auth, orderController.getSupplierClients);

module.exports = router;
