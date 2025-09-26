// controllers/statisticsController.js
const statisticsService = require('../services/StatisticsService');

class StatisticsController {
  // ===== DASHBOARD OVERVIEW =====
  async getDashboardOverview(req, res) {
    try {
      const overview = await statisticsService.getDashboardOverview();
      res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== REVENUE ENDPOINTS =====
  async getRevenueChart(req, res) {
    try {
      const { period = '12months' } = req.query;
      const revenueData = await statisticsService.getRevenueChart(period);
      
      res.status(200).json({
        success: true,
        data: revenueData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTotalRevenue(req, res) {
    try {
      const totalRevenue = await statisticsService.getTotalRevenue();
      res.status(200).json({
        success: true,
        data: { totalRevenue }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getMonthlyRevenue(req, res) {
    try {
      const monthlyRevenue = await statisticsService.getMonthlyRevenue();
      res.status(200).json({
        success: true,
        data: { monthlyRevenue }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== ORDER ENDPOINTS =====
  async getOrdersChart(req, res) {
    try {
      const { period = '12months' } = req.query;
      const ordersData = await statisticsService.getOrdersChart(period);
      
      res.status(200).json({
        success: true,
        data: ordersData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getOrderStatusDistribution(req, res) {
    try {
      const distribution = await statisticsService.getOrderStatusDistribution();
      res.status(200).json({
        success: true,
        data: distribution
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== PRODUCT ENDPOINTS =====
  async getTopSellingProducts(req, res) {
    try {
      const { limit = 10 } = req.query;
      const topProducts = await statisticsService.getTopSellingProducts(parseInt(limit));
      
      res.status(200).json({
        success: true,
        data: topProducts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProductCategoryDistribution(req, res) {
    try {
      const distribution = await statisticsService.getProductCategoryDistribution();
      res.status(200).json({
        success: true,
        data: distribution
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getLowStockProducts(req, res) {
    try {
      const { threshold = 10 } = req.query;
      const lowStockProducts = await statisticsService.getLowStockProducts(parseInt(threshold));
      
      res.status(200).json({
        success: true,
        data: lowStockProducts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== CLIENT ENDPOINTS =====
  async getClientRegistrationChart(req, res) {
    try {
      const { period = '12months' } = req.query;
      const clientData = await statisticsService.getClientRegistrationChart(period);
      
      res.status(200).json({
        success: true,
        data: clientData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTopClients(req, res) {
    try {
      const { limit = 10 } = req.query;
      const topClients = await statisticsService.getTopClientsbyOrders(parseInt(limit));
      
      res.status(200).json({
        success: true,
        data: topClients
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getClinicTypeDistribution(req, res) {
    try {
      const distribution = await statisticsService.getClinicTypeDistribution();
      res.status(200).json({
        success: true,
        data: distribution
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== SUPPLIER ENDPOINTS =====
  async getSupplierPerformance(req, res) {
    try {
      const supplierData = await statisticsService.getSupplierPerformance();
      res.status(200).json({
        success: true,
        data: supplierData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== COMPREHENSIVE ANALYTICS =====
  async getAnalyticsSummary(req, res) {
    try {
      const { period = '30days' } = req.query;
      const summary = await statisticsService.getAnalyticsSummary(period);
      
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== EXPORT DATA =====
  async exportAnalytics(req, res) {
    try {
      const { format = 'json', period = '30days' } = req.query;
      const summary = await statisticsService.getAnalyticsSummary(period);
      
      if (format === 'csv') {
        // Convert to CSV format (basic implementation)
        const csv = this.convertToCSV(summary);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
      } else {
        // Return JSON with download headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${new Date().toISOString().split('T')[0]}.json`);
        res.status(200).json(summary);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Helper method to convert data to CSV (basic implementation)
  convertToCSV(data) {
    // This is a simplified CSV conversion - you might want to use a proper CSV library
    const overview = data.overview;
    let csv = 'Metric,Value\n';
    csv += `Total Clients,${overview.totalClients}\n`;
    csv += `Total Suppliers,${overview.totalSuppliers}\n`;
    csv += `Total Products,${overview.totalProducts}\n`;
    csv += `Total Orders,${overview.totalOrders}\n`;
    csv += `Total Revenue,${overview.totalRevenue}\n`;
    csv += `Monthly Revenue,${overview.monthlyRevenue}\n`;
    
    return csv;
  }
}

module.exports = new StatisticsController();