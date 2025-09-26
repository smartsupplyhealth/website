import axios from 'axios';

// Crée une instance d'axios avec une configuration de base
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // L'URL de base de votre backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ou où que vous stockiez le token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===== Statistics API =====
export const fetchDashboardOverview = () => api.get('/statistics/dashboard/overview');
export const fetchAnalyticsSummary = (period = '30days') => api.get(`/statistics/analytics/summary`, { params: { period } });

export const fetchRevenueChart = (period = '12months') => api.get('/statistics/revenue/chart', { params: { period } });
export const fetchTotalRevenue = () => api.get('/statistics/revenue/total');
export const fetchMonthlyRevenue = () => api.get('/statistics/revenue/monthly');

export const fetchOrdersChart = (period = '12months') => api.get('/statistics/orders/chart', { params: { period } });
export const fetchOrderStatusDistribution = () => api.get('/statistics/orders/status-distribution');

export const fetchTopSellingProducts = (limit = 10) => api.get('/statistics/products/top-selling', { params: { limit } });
export const fetchProductCategoryDistribution = () => api.get('/statistics/products/category-distribution');
export const fetchLowStockProducts = (threshold = 10) => api.get('/statistics/products/low-stock', { params: { threshold } });

export const fetchClientRegistrationChart = (period = '12months') => api.get('/statistics/clients/registration-chart', { params: { period } });
export const fetchTopClients = (limit = 10) => api.get('/statistics/clients/top-clients', { params: { limit } });
export const fetchClinicTypeDistribution = () => api.get('/statistics/clients/clinic-distribution');

export const fetchSupplierPerformance = () => api.get('/statistics/suppliers/performance');

export default api;
