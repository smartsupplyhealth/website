import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ClientNavbar from "./ClientNavbar";
import NotificationButton from "../NotificationButton";
import NotificationPanel from "../NotificationPanel";
import { API_URL } from "../../config/environment";
import "./Dashboard.css";

export default function ClientDashboard() {
  const { user, token } = useAuth();
  const clinicLabel = user?.clinicName || "Votre établissement";

  // State for dashboard data
  const [recentOrders, setRecentOrders] = useState([]);
  const [budgetData, setBudgetData] = useState({
    monthlySpending: [],
    categorySpending: []
  });
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    confirmed: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);



  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch recent orders
        const ordersResponse = await fetch(`${API_URL}/api/orders/my-orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const ordersData = await ordersResponse.json();


        if (ordersData.success) {
          console.log('All orders:', ordersData.data);

          // Filter orders to show only those requiring action
          const filteredOrders = ordersData.data.filter(order => {
            const orderStatus = order.status;
            const paymentStatus = order.paymentStatus;

            // Check if order status requires action
            const isOrderStatusRequiringAction = orderStatus === 'cancelled' || // Annulée
              orderStatus === 'processing' || // En traitement
              orderStatus === 'pending' || // En attente
              (order.notes && order.notes.includes('Limite auto order')); // Limite auto order

            // Check if payment status requires action
            const isPaymentStatusRequiringAction = paymentStatus === 'Failed' ||
              paymentStatus === 'failed' ||
              paymentStatus === 'Échoué' ||
              paymentStatus === 'pending' ||
              paymentStatus === 'failed_auto_order' ||
              paymentStatus === 'processing';

            // Show orders that need action for EITHER order status OR payment status
            const shouldInclude = isOrderStatusRequiringAction || isPaymentStatusRequiringAction;

            console.log(`Order ${order.orderNumber}:`, {
              orderStatus,
              paymentStatus,
              notes: order.notes,
              isOrderStatusRequiringAction,
              isPaymentStatusRequiringAction,
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

        // Calculate order status statistics
        const statusCounts = {
          pending: 0,
          confirmed: 0,
          processing: 0,
          delivered: 0,
          cancelled: 0
        };

        // Count orders by status
        ordersData.data.forEach(order => {
          switch (order.status) {
            case 'pending':
              statusCounts.pending++;
              break;
            case 'confirmed':
              statusCounts.confirmed++;
              break;
            case 'processing':
              statusCounts.processing++;
              break;
            case 'delivered':
              statusCounts.delivered++;
              break;
            case 'cancelled':
              statusCounts.cancelled++;
              break;
            default:
              // Handle other statuses if needed
              break;
          }
        });

        setOrderStats(statusCounts);
        console.log('Order status statistics:', statusCounts);




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




  if (loading) {
    return (
      <div className="orders-container">
        <ClientNavbar />
        <NotificationButton />
        <NotificationPanel />
        <div className="dashboard-loading">
          <div className="logo-loading">
            <img
              src="/logo.jpg"
              alt="SmartSupply Health"
              className="loading-logo"
            />
            <div className="loading-pulse"></div>
          </div>
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
        {/* Order Status Statistics Section */}
        <div className="order-stats-section">
          <h3>📈 États des commandes</h3>
          <div className="stats-grid">
            <div className="chart-container">
              <h4>Répartition par statut</h4>
              <div className="chart-data">
                {(() => {
                  const statusData = [
                    { label: 'En attente', value: orderStats.pending, color: '#f59e0b' },
                    { label: 'Confirmées', value: orderStats.confirmed, color: '#3b82f6' },
                    { label: 'En traitement', value: orderStats.processing, color: '#10b981' },
                    { label: 'Livrées', value: orderStats.delivered, color: '#059669' },
                    { label: 'Annulées', value: orderStats.cancelled, color: '#ef4444' }
                  ];

                  const maxValue = Math.max(...statusData.map(item => item.value));
                  const totalOrders = statusData.reduce((sum, item) => sum + item.value, 0);

                  return (
                    <>
                      {statusData.map((item, index) => (
                        <div key={index} className="chart-bar">
                          <div className="bar-label">{item.label}</div>
                          <div className="bar-container">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${maxValue > 0 ? Math.max((item.value / maxValue) * 100, 5) : 5}%`,
                                backgroundColor: item.color
                              }}
                            ></div>
                          </div>
                          <div className="bar-value">{item.value}</div>
                        </div>
                      ))}

                      {/* Total orders */}
                      <div className="chart-total">
                        <div className="total-label">Total des commandes :</div>
                        <div className="total-value">{totalOrders}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Budget & Analytics Section */}
        <div className="budget-analytics">
          <h3>📊 Dépenses par catégorie</h3>
          <div className="analytics-grid">
            <div className="chart-container">
              <h4>Répartition des dépenses</h4>
              <div className="chart-data">
                {budgetData.categorySpending && budgetData.categorySpending.length > 0 ? (
                  budgetData.categorySpending.map((category, index) => (
                    <div key={index} className="chart-bar">
                      <div className="bar-label">{category.category}</div>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${Math.max((category.amount / Math.max(...budgetData.categorySpending.map(c => c.amount))) * 100, 5)}%`,
                            backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : index === 2 ? '#f59e0b' : '#8b5cf6'
                          }}
                        ></div>
                      </div>
                      <div className="bar-value">€{category.amount.toFixed(2)}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">Aucune donnée disponible</div>
                )}

                {/* Total amount */}
                {budgetData.categorySpending && budgetData.categorySpending.length > 0 && (
                  <div className="chart-total">
                    <div className="total-label">Total des dépenses :</div>
                    <div className="total-value">
                      €{budgetData.categorySpending.reduce((sum, category) => sum + category.amount, 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}