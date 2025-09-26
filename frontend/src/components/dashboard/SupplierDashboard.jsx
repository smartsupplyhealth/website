import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import SupplierNavbar from './SupplierNavbar';
import { fetchAnalyticsSummary } from '../../services/api';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#22d3ee', '#f472b6'];

const SupplierDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeClients: 0,
    totalOrders: 0,
    productsInStock: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Supplier stats for top cards
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/supplier/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
        // Analytics summary for charts
        const { data } = await fetchAnalyticsSummary('12months');
        const payload = data?.data || data;
        setAnalytics(payload);
      } catch (error) {
        console.error('Error fetching stats/analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const revenueData = analytics?.charts?.revenue?.data || [];
  const ordersData = analytics?.charts?.orders?.data || [];
  const categoryData = analytics?.insights?.categoryDistribution || [];
  const topProducts = analytics?.insights?.topProducts || [];

  return (
    <div className="dashboard-container">
      <SupplierNavbar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-welcome-section">
            <h2 className="dashboard-welcome-title">
              Bienvenue, {user?.name} !
            </h2>
            <p className="dashboard-welcome-subtitle">
              Tableau de bord de {user?.companyName}
            </p>

            {/* Stats Cards */}
            <div className="stats-grid stats-grid-4">
              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">Clients actifs</p>
                    <p className="stat-card-value">{loading ? '...' : stats.activeClients}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon green">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">Commandes totales</p>
                    <p className="stat-card-value">{loading ? '...' : stats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon yellow">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">Produits en stock</p>
                    <p className="stat-card-value">{loading ? '...' : stats.productsInStock}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon secondary-blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">CA ce mois</p>
                    <p className="stat-card-value">{loading ? '...' : `${Number(stats.monthlyRevenue || 0).toFixed(2)} €`}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            {analytics && (
              <div className="stats-grid">
                {/* Revenue Area */}
                <div className="stat-card">
                  <div className="stat-card-content" style={{ display: 'block', width: '100%' }}>
                    <p className="stat-card-label">Chiffre d'affaires (12 mois)</p>
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <AreaChart data={revenueData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v) => [`${Number(v).toFixed(2)} €`, 'Revenu']} />
                          <Legend />
                          <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#revGradient)" strokeWidth={2} name="Revenu" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Orders Grouped Vertical Bars */}
                <div className="stat-card">
                  <div className="stat-card-content" style={{ display: 'block', width: '100%' }}>
                    <p className="stat-card-label">Commandes par statut (12 mois)</p>
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer>
                        <BarChart data={ordersData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                          <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="confirmed" fill="#3b82f6" name="Confirmées" />
                          <Bar dataKey="processing" fill="#f59e0b" name="En traitement" />
                          <Bar dataKey="delivered" fill="#10b981" name="Livrées" />
                          <Bar dataKey="cancelled" fill="#ef4444" name="Annulées" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Donut: Product Categories */}
                <div className="stat-card">
                  <div className="stat-card-content" style={{ display: 'block', width: '100%' }}>
                    <p className="stat-card-label">Répartition par catégorie</p>
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="productCount"
                            nameKey="category"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={2}
                            startAngle={90}
                            endAngle={-270}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip formatter={(v, n, p) => [v, p?.payload?.category || 'Catégorie']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Top Products by Quantity - horizontal bars */}
                <div className="stat-card">
                  <div className="stat-card-content" style={{ display: 'block', width: '100%' }}>
                    <p className="stat-card-label">Top produits (quantité vendue)</p>
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer>
                        <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 16, left: 60, bottom: 5 }}>
                          <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis dataKey="productName" type="category" tick={{ fontSize: 12 }} width={180} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="totalQuantity" fill="#22c55e" name="Quantité" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Quick Actions */}
            <div className="actions-grid">
              <button
                className="action-button blue"
                onClick={() => navigate('/supplier-dashboard/catalogue')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Gérer Catalogue
              </button>

              <button
                className="action-button green"
                onClick={() => navigate('/supplier/orders')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Commandes Reçues
              </button>

              <button
                className="action-button secondary-blue"
                onClick={() => navigate('/supplier/client')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Mes Clients
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplierDashboard;

