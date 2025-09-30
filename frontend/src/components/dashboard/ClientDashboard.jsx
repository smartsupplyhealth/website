import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ClientNavbar from "./ClientNavbar";
import NotificationButton from "../NotificationButton";
import NotificationPanel from "../NotificationPanel";
import { API_URL } from "../../config/environment";
import "./Dashboard.css";

export default function ClientDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const clinicLabel = user?.clinicName || "Votre établissement";

  // State for dashboard data
  const [recentOrders, setRecentOrders] = useState([]);
  const [budgetData, setBudgetData] = useState({
    monthlySpending: [],
    categorySpending: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch recent orders
        const ordersResponse = await fetch(`${API_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const ordersData = await ordersResponse.json();

        if (ordersData.success) {
          console.log('All orders:', ordersData.data);

          // Filter orders to show only those with specific status combinations
          const filteredOrders = ordersData.data.filter(order => {
            const orderStatus = order.status;
            const paymentStatus = order.paymentStatus;

            // Check if order status matches the required statuses
            const isOrderStatusMatch = orderStatus === 'cancelled' || // Annulée
              orderStatus === 'processing' || // En traitement
              orderStatus === 'pending' || // En attente
              (order.notes && order.notes.includes('Limite auto order')); // Limite auto order

            // Check if payment status is "Failed" (Échoué), "pending" (En attente), or "processing" (En traitement)
            const isPaymentFailedOrPending = paymentStatus === 'Failed' ||
              paymentStatus === 'failed' ||
              paymentStatus === 'Échoué' ||
              paymentStatus === 'pending' ||
              paymentStatus === 'failed_auto_order' ||
              paymentStatus === 'processing';

            const shouldInclude = isOrderStatusMatch && isPaymentFailedOrPending;

            console.log(`Order ${order.orderNumber}:`, {
              orderStatus,
              paymentStatus,
              notes: order.notes,
              isOrderStatusMatch,
              isPaymentFailedOrPending,
              shouldInclude
            });

            return shouldInclude;
          });

          console.log('Filtered orders:', filteredOrders);

          // Get last 3 filtered orders
          const recent = filteredOrders.slice(0, 3);
          setRecentOrders(recent);
        }

        // Fetch budget analytics
        const budgetResponse = await fetch(`${API_URL}/api/orders/budget-analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const budgetAnalytics = await budgetResponse.json();

        console.log('Budget analytics response:', budgetAnalytics);

        if (budgetAnalytics.success) {
          setBudgetData(budgetAnalytics.data);
        } else {
          console.error('Failed to fetch budget analytics:', budgetAnalytics);
          setBudgetData({ monthlySpending: [], categorySpending: [] });
        }


      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusText = (status, notes) => {
    // Check if it's a "Limite auto order" case
    if (notes && notes.includes('Limite auto order')) {
      return 'Limite auto order';
    }

    switch (status) {
      case 'delivered': return 'Livré';
      case 'shipped': return 'Expédié';
      case 'processing': return 'En traitement';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulée';
      case 'confirmed': return 'Confirmé';
      default: return status;
    }
  };

  const getStatusClass = (status, notes) => {
    // Check if it's a "Limite auto order" case
    if (notes && notes.includes('Limite auto order')) {
      return 'cancelled';
    }

    switch (status) {
      case 'delivered': return 'confirmed';
      case 'shipped': return 'confirmed';
      case 'processing': return 'processing';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      case 'confirmed': return 'confirmed';
      default: return 'pending';
    }
  };

  const getPaymentStatusText = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'processing': return 'En traitement';
      case 'failed': return 'Échoué';
      case 'Failed': return 'Échoué';
      case 'Paid': return 'Payé';
      case 'Échoué': return 'Échoué';
      case 'failed_auto_order': return 'Échoué (Auto)';
      case 'refunded': return 'Remboursé';
      case 'cancelled': return 'Annulé';
      default: return paymentStatus || 'Non payé';
    }
  };

  const getPaymentStatusClass = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
      case 'Paid': return 'confirmed';
      case 'pending': return 'pending';
      case 'processing': return 'processing';
      case 'failed':
      case 'Failed':
      case 'Échoué':
      case 'failed_auto_order': return 'cancelled';
      case 'refunded': return 'processing';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  };



  if (loading) {
    return (
      <div className="orders-container">
        <ClientNavbar />
        <NotificationButton />
        <NotificationPanel />
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <ClientNavbar />
      <NotificationButton />
      <NotificationPanel />

      {/* Header */}
      <div className="orders-header">
        <h1>Tableau de bord</h1>
        <p>Bienvenue {user?.name ? `, ${user.name}` : ""} — {clinicLabel}</p>
      </div>

      <div className="main-content">
        {/* Vue générale Section */}
        <section className="dashboard-card overview-section">
          <div className="card-header">
            <h2>📊 Vue générale</h2>
            <div className="overview-badge">Données en temps réel</div>
          </div>
          <div className="card-content">
            {/* Recent Orders Summary */}
            <div className="recent-orders-summary">
              <h3>Commandes nécessitant une action</h3>
              <p className="section-description">Commandes avec statut "En traitement", "Annulée", "En attente" ou "Limite auto order" et paiement "Échoué" ou "En attente" ou "En traitement"</p>

              {recentOrders.length > 0 ? (
                <div className="orders-list">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="order-summary-item">
                      <div className="order-info">
                        <div className="order-header">
                          <span className="order-id">Commande #{order.orderNumber}</span>
                          <span className="order-date">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="order-details">
                          <span className="order-amount">{formatCurrency(order.totalAmount)}</span>
                          <div className="status-columns">
                            <div className="status-item">
                              <span className="status-label">Statut Commande :</span>
                              <span
                                className={`order-status ${getStatusClass(order.status, order.notes)}`}
                              >
                                {getStatusText(order.status, order.notes)}
                              </span>
                            </div>
                            <div className="status-item">
                              <span className="status-label">Statut Paiement :</span>
                              <span
                                className={`order-status ${getPaymentStatusClass(order.paymentStatus)}`}
                              >
                                {getPaymentStatusText(order.paymentStatus)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="order-actions">
                        <button
                          className="view-order-btn"
                          onClick={() => navigate('/client-dashboard/orders')}
                        >
                          Voir détails
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-orders-message">
                  <p>Aucune commande nécessitant une action</p>
                  <p className="no-orders-subtitle">Toutes vos commandes sont correctement traitées</p>
                  <button
                    className="new-order-btn"
                    onClick={() => navigate('/client-dashboard/new-order')}
                  >
                    Passer une commande
                  </button>
                </div>
              )}
            </div>

            {/* Budget & Analytics */}
            <div className="budget-analytics">
              <h3>💰 Budget & Analytics</h3>
              <p className="section-description">Graphiques de dépenses par catégorie de produit</p>

              <div className="analytics-grid">
                {/* Category Spending Chart */}
                <div className="chart-container">
                  <h4>Dépenses par catégorie</h4>
                  <div className="chart-placeholder">
                    {budgetData.categorySpending.length > 0 ? (
                      <div className="chart-data">
                        {budgetData.categorySpending.map((category, index) => (
                          <div key={index} className="chart-bar">
                            <div className="bar-label">{category.category}</div>
                            <div className="bar-container">
                              <div
                                className="bar-fill"
                                style={{
                                  width: `${Math.min((category.amount / Math.max(...budgetData.categorySpending.map(c => c.amount))) * 100, 100)}%`,
                                  backgroundColor: '#10b981'
                                }}
                              ></div>
                            </div>
                            <div className="bar-value">{formatCurrency(category.amount)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data-message">
                        <p>Aucune donnée de catégorie disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}