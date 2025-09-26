// services/statisticsService.js
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

class StatisticsService {
  // ===== DASHBOARD OVERVIEW STATS =====
  async getDashboardOverview() {
    try {
      const [
        totalClients,
        totalSuppliers,
        totalProducts,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        monthlyRevenue
      ] = await Promise.all([
        Client.countDocuments({ isActive: true }),
        Supplier.countDocuments({ isActive: true }),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ status: 'confirmed' }),
        Order.countDocuments({ status: 'confirmed' }),
        Order.countDocuments({ status: 'processing' }),
        Order.countDocuments({ status: 'delivered' }),
        Order.countDocuments({ status: 'cancelled' }),
        this.getTotalRevenue(),
        this.getMonthlyRevenue()
      ]);

      return {
        overview: {
          totalClients,
          totalSuppliers,
          totalProducts,
          totalOrders,
          totalRevenue,
          monthlyRevenue
        },
        orderStatus: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        }
      };
    } catch (error) {
      throw new Error(`Error fetching dashboard overview: ${error.message}`);
    }
  }

  // ===== REVENUE STATISTICS =====
  async getTotalRevenue() {
    try {
      const result = await Order.aggregate([
        { $match: { paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      return result[0]?.total || 0;
    } catch (error) {
      throw new Error(`Error calculating total revenue: ${error.message}`);
    }
  }

  async getMonthlyRevenue() {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const result = await Order.aggregate([
        { 
          $match: { 
            paymentStatus: 'Paid',
            createdAt: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      return result[0]?.total || 0;
    } catch (error) {
      throw new Error(`Error calculating monthly revenue: ${error.message}`);
    }
  }

  async getRevenueChart(period = '12months') {
    try {
      let matchCondition = { paymentStatus: 'Paid' };
      let groupBy, dateFormat;

      const currentDate = new Date();

      switch (period) {
        case '7days':
          matchCondition.createdAt = { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          };
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '30days':
          matchCondition.createdAt = { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          };
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '12months':
        default:
          matchCondition.createdAt = { 
            $gte: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1) 
          };
          groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
      }

      const result = await Order.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: groupBy,
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        period,
        data: result.map(item => ({
          date: item._id,
          revenue: item.revenue,
          orders: item.orders
        }))
      };
    } catch (error) {
      throw new Error(`Error generating revenue chart: ${error.message}`);
    }
  }

  // ===== ORDER STATISTICS =====
  async getOrdersChart(period = '12months') {
    try {
      let matchCondition = {};
      let groupBy;

      const currentDate = new Date();

      switch (period) {
        case '7days':
          matchCondition.createdAt = { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          };
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '30days':
          matchCondition.createdAt = { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          };
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '12months':
        default:
          matchCondition.createdAt = { 
            $gte: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1) 
          };
          groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
      }

      const result = await Order.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: {
              date: groupBy,
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      // Format data for frontend
      const chartData = {};
      result.forEach(item => {
        const date = item._id.date;
        const status = item._id.status;
        
        if (!chartData[date]) {
          chartData[date] = { date, confirmed: 0, processing: 0, delivered: 0, cancelled: 0 };
        }
        chartData[date][status] = item.count;
      });

      return {
        period,
        data: Object.values(chartData)
      };
    } catch (error) {
      throw new Error(`Error generating orders chart: ${error.message}`);
    }
  }

  async getOrderStatusDistribution() {
    try {
      const result = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);

      return result.map(item => ({
        status: item._id,
        count: item.count,
        totalAmount: item.totalAmount
      }));
    } catch (error) {
      throw new Error(`Error getting order status distribution: ${error.message}`);
    }
  }

  // ===== PRODUCT STATISTICS =====
  async getTopSellingProducts(limit = 10) {
    try {
      const result = await Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.totalPrice' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' }
      ]);

      return result.map(item => ({
        productId: item._id,
        productName: item.product.name,
        category: item.product.category,
        totalQuantity: item.totalQuantity,
        totalRevenue: item.totalRevenue,
        orderCount: item.orderCount,
        averageOrderValue: item.totalRevenue / item.orderCount
      }));
    } catch (error) {
      throw new Error(`Error getting top selling products: ${error.message}`);
    }
  }

  async getProductCategoryDistribution() {
    try {
      const result = await Product.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$stock' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return result.map(item => ({
        category: item._id,
        productCount: item.count,
        totalStock: item.totalStock
      }));
    } catch (error) {
      throw new Error(`Error getting product category distribution: ${error.message}`);
    }
  }

  async getLowStockProducts(threshold = 10) {
    try {
      const result = await Product.find({ stock: { $lte: threshold } })
        .populate('supplier', 'name companyName')
        .select('name category stock price supplier')
        .sort({ stock: 1 });

      return result.map(product => ({
        productId: product._id,
        name: product.name,
        category: product.category,
        stock: product.stock,
        price: product.price,
        supplier: {
          name: product.supplier.name,
          company: product.supplier.companyName
        }
      }));
    } catch (error) {
      throw new Error(`Error getting low stock products: ${error.message}`);
    }
  }

  // ===== CLIENT STATISTICS =====
  async getClientRegistrationChart(period = '12months') {
    try {
      let matchCondition = { isActive: true };
      let groupBy;

      const currentDate = new Date();

      switch (period) {
        case '30days':
          matchCondition.createdAt = { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          };
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '12months':
        default:
          matchCondition.createdAt = { 
            $gte: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1) 
          };
          groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
      }

      const result = await Client.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: groupBy,
            newClients: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        period,
        data: result.map(item => ({
          date: item._id,
          newClients: item.newClients
        }))
      };
    } catch (error) {
      throw new Error(`Error generating client registration chart: ${error.message}`);
    }
  }

  async getTopClientsbyOrders(limit = 10) {
    try {
      const result = await Order.aggregate([
        {
          $group: {
            _id: '$client',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: '_id',
            as: 'client'
          }
        },
        { $unwind: '$client' }
      ]);

      return result.map(item => ({
        clientId: item._id,
        clientName: item.client.name,
        clinicName: item.client.clinicName,
        clinicType: item.client.clinicType,
        orderCount: item.orderCount,
        totalSpent: item.totalSpent,
        avgOrderValue: Math.round(item.avgOrderValue * 100) / 100
      }));
    } catch (error) {
      throw new Error(`Error getting top clients: ${error.message}`);
    }
  }

  async getClinicTypeDistribution() {
    try {
      const result = await Client.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$clinicType',
            count: { $sum: 1 }
          }
        }
      ]);

      return result.map(item => ({
        clinicType: item._id,
        count: item.count
      }));
    } catch (error) {
      throw new Error(`Error getting clinic type distribution: ${error.message}`);
    }
  }

  // ===== SUPPLIER STATISTICS =====
  async getSupplierPerformance() {
    try {
      const result = await Product.aggregate([
        {
          $lookup: {
            from: 'suppliers',
            localField: 'supplier',
            foreignField: '_id',
            as: 'supplier'
          }
        },
        { $unwind: '$supplier' },
        {
          $group: {
            _id: '$supplier._id',
            supplierName: { $first: '$supplier.name' },
            companyName: { $first: '$supplier.companyName' },
            productCount: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            categories: { $addToSet: '$category' }
          }
        },
        { $sort: { productCount: -1 } }
      ]);

      return result.map(item => ({
        supplierId: item._id,
        supplierName: item.supplierName,
        companyName: item.companyName,
        productCount: item.productCount,
        totalStock: item.totalStock,
        categoriesCount: item.categories.length,
        categories: item.categories
      }));
    } catch (error) {
      throw new Error(`Error getting supplier performance: ${error.message}`);
    }
  }

  // ===== COMBINED ANALYTICS =====
  async getAnalyticsSummary(period = '30days') {
    try {
      const [
        overview,
        revenueChart,
        ordersChart,
        topProducts,
        categoryDistribution,
        topClients,
        lowStock
      ] = await Promise.all([
        this.getDashboardOverview(),
        this.getRevenueChart(period),
        this.getOrdersChart(period),
        this.getTopSellingProducts(5),
        this.getProductCategoryDistribution(),
        this.getTopClientsbyOrders(5),
        this.getLowStockProducts(5)
      ]);

      return {
        overview,
        charts: {
          revenue: revenueChart,
          orders: ordersChart
        },
        insights: {
          topProducts,
          categoryDistribution,
          topClients,
          lowStock
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error generating analytics summary: ${error.message}`);
    }
  }
}

module.exports = new StatisticsService();