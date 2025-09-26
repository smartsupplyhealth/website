// routes/statisticsRoutes.js
const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/StatisticsController');

const { auth } = require('../middleware/auth');

// ===== DASHBOARD ROUTES =====
router.get('/dashboard/overview', statisticsController.getDashboardOverview);
router.get('/analytics/summary', statisticsController.getAnalyticsSummary);

// ===== REVENUE ROUTES =====
router.get('/revenue/chart', statisticsController.getRevenueChart);
router.get('/revenue/total', statisticsController.getTotalRevenue);
router.get('/revenue/monthly', statisticsController.getMonthlyRevenue);

// ===== ORDER ROUTES =====
router.get('/orders/chart', statisticsController.getOrdersChart);
router.get('/orders/status-distribution', statisticsController.getOrderStatusDistribution);

// ===== PRODUCT ROUTES =====
router.get('/products/top-selling', statisticsController.getTopSellingProducts);
router.get('/products/category-distribution', statisticsController.getProductCategoryDistribution);
router.get('/products/low-stock', statisticsController.getLowStockProducts);

// ===== CLIENT ROUTES =====
router.get('/clients/registration-chart', statisticsController.getClientRegistrationChart);
router.get('/clients/top-clients', statisticsController.getTopClients);
router.get('/clients/clinic-distribution', statisticsController.getClinicTypeDistribution);

// ===== SUPPLIER ROUTES =====
router.get('/suppliers/performance', statisticsController.getSupplierPerformance);

// ===== EXPORT ROUTES =====
router.get('/export', statisticsController.exportAnalytics);

module.exports = router;