// src/components/Orders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import '../style/Orders.css';
import ClientNavbar from './dashboard/ClientNavbar';
import PaymentModal from './PaymentModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [orderToPay, setOrderToPay] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const url = filter === 'all'
        ? '/orders/my-orders'
        : `/orders/my-orders?status=${filter}`;
      const response = await api.get(url);

      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        setError(response.data.message || 'Erreur lors du chargement des commandes');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Impossible de se connecter au serveur';
      setError(errorMessage);
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- Payment functions ---
  const handlePayClick = (order) => {
    setOrderToPay(order);
    setShowDetailModal(false); // Close details modal when opening payment
  };

  const handlePaymentSuccess = () => {
    setOrderToPay(null);
    alert('Paiement réussi !');
    fetchOrders(); // Refresh orders list
  };

  const handlePaymentCancel = () => {
    setOrderToPay(null);
  };

  // --- UI helpers ---
  const getStatusBadge = (status, order) => {
    // Check if this is an auto order limit rejection
    if (order && order.notes && order.notes.includes('Limite auto order')) {
      return <span className="status-badge status-limit">Limite auto order</span>;
    }
    if (order && order.notes && order.notes.includes('Commande manuelle requise')) {
      return <span className="status-badge status-limit">Commande manuelle requise</span>;
    }
    
    const statusConfig = {
      cancelled:  { label: 'Annulée',       class: 'status-cancelled'  },
      confirmed:  { label: 'Confirmée',     class: 'status-confirmed'  },
      processing: { label: 'En traitement', class: 'status-processing' },
      delivered:  { label: 'Livrée',        class: 'status-delivered'  }
    };
    const config = statusConfig[status] || { label: status, class: 'status-unknown' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      Pending: { label: 'En attente', class: 'status-pending'   },
      Paid:    { label: 'Payée',      class: 'status-confirmed' },
      Failed:  { label: 'Échoué',     class: 'status-cancelled' },
    };
    const config = statusConfig[status] || { label: status, class: 'status-unknown' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const formatPrice = (price) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };
  const closeDetailModal = () => { setShowDetailModal(false); setSelectedOrder(null); };

  return (
    <>
      {/* Navbar en haut (hors conteneur) */}
      <ClientNavbar />

      {/* Page plein écran sous la navbar */}
      <div className="orders-page">
        <div className="orders-header">
          <h1 className="title">Mes Commandes</h1>
          <p className="orders-subtitle">
            Suivez vos commandes, leurs statuts et effectuez le paiement si nécessaire.
          </p>
        </div>

        {/* Filtres */}
        <div className="orders-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >Toutes</button>
          <button
            className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >Confirmées</button>
          <button
            className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
            onClick={() => setFilter('processing')}
          >En traitement</button>
          <button
            className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
            onClick={() => setFilter('delivered')}
          >Livrées</button>
            <button
              className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setFilter('cancelled')}
            >Annulées</button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchOrders}>Réessayer</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement des commandes...</p>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <>
            {orders.length === 0 ? (
              <div className="no-orders">
                <div className="no-orders-icon">📦</div>
                <h3>Aucune commande trouvée</h3>
                <p>
                  Vous n&apos;avez pas encore passé de commande
                  {filter !== 'all' ? ` avec le statut "${filter}"` : ''}.
                </p>
              </div>
            ) : (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>N° Commande</th>
                      <th>Date</th>
                      <th>Montant Total</th>
                      <th>Statut Commande</th>
                      <th>Statut Paiement</th>
                      <th>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td><strong>{order.orderNumber}</strong></td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td><strong>{formatPrice(order.totalAmount)}</strong></td>
                        <td>{getStatusBadge(order.status, order)}</td>
                        <td>{getPaymentStatusBadge(order.paymentStatus)}</td>
                        <td>
                          <button className="btn-details" onClick={() => openOrderDetails(order)}>Détails</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Modale Détails */}
        {showDetailModal && selectedOrder && (
          <div className="modal-overlay" onClick={closeDetailModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Détails de la commande {selectedOrder.orderNumber}</h2>
                <button className="modal-close" onClick={closeDetailModal}>×</button>
              </div>

              <div className="modal-body">
                <div className="order-info">
                  <div className="info-row">
                    <span className="label">Date de commande :</span>
                    <span className="value">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Statut :</span>
                    <span className="value">{getStatusBadge(selectedOrder.status, selectedOrder)}</span>
                  </div>
                  {selectedOrder.deliveryAddress && (
                    <div className="info-row">
                      <span className="label">Adresse de livraison :</span>
                      <span className="value">
                        {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city} {selectedOrder.deliveryAddress.postalCode}, {selectedOrder.deliveryAddress.country}
                      </span>
                    </div>
                  )}
                </div>

                <div className="order-items">
                  <h3>Produits commandés</h3>
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-info">
                        <div className="item-name">{item.product?.name || 'Produit non disponible'}</div>
                        <div className="item-details">
                          Quantité : {item.quantity} × {formatPrice(item.unitPrice)}
                        </div>
                      </div>
                      <div className="item-total">
                        {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  ))}

                  <div className="order-total">
                    <strong>Total : {formatPrice(selectedOrder.totalAmount)}</strong>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="order-notes">
                    <h3>Notes</h3>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Special section for rejected orders */}
                {selectedOrder.notes && (selectedOrder.notes.includes('Limite auto order') || selectedOrder.notes.includes('Commande manuelle requise')) && (
                  <div className="rejection-info">
                    <h3>⚠️ Commande Rejetée</h3>
                    <div className="rejection-reason">
                      <p><strong>Raison :</strong> {selectedOrder.notes}</p>
                      <p><strong>Statut Commande :</strong> {getStatusBadge(selectedOrder.status, selectedOrder)}</p>
                      <p><strong>Statut Paiement :</strong> {getPaymentStatusBadge(selectedOrder.paymentStatus)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {selectedOrder.paymentStatus === 'Pending' && (
                  <button 
                    className="btn-pay" 
                    onClick={() => handlePayClick(selectedOrder)}
                    title="Cliquez pour réessayer le paiement de cette commande"
                  >
                    💳 Réessayer le paiement
                  </button>
                )}
                <button className="btn-close" onClick={closeDetailModal}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment modal */}
        {orderToPay && (
          <PaymentModal
            order={orderToPay}
            onPay={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        )}

      </div>
    </>
  );
};

export default Orders;
