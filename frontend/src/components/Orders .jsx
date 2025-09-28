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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [orderToPay, setOrderToPay] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      console.log('Fetching orders with filter:', filter);
      setLoading(true);
      setError('');

      let url = '/orders/my-orders';

      if (filter === 'all') {
        url = '/orders/my-orders';
      } else if (filter === 'payment-pending') {
        url = '/orders/my-orders?paymentStatus=Pending';
      } else {
        url = `/orders/my-orders?status=${filter}`;
      }

      console.log('Fetching orders from URL:', url);
      const response = await api.get(url);
      console.log('Orders response:', response.data);

      if (response.data.success) {
        setOrders(response.data.data);
        console.log('Orders loaded successfully:', response.data.data.length, 'orders');
      } else {
        setError(response.data.message || 'Erreur lors du chargement des commandes');
        console.error('Orders API returned error:', response.data.message);
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

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.status?.toLowerCase().includes(searchLower) ||
      order.paymentStatus?.toLowerCase().includes(searchLower) ||
      order.items?.some(item =>
        item.product?.name?.toLowerCase().includes(searchLower)
      ) ||
      order.deliveryAddress?.street?.toLowerCase().includes(searchLower) ||
      order.deliveryAddress?.city?.toLowerCase().includes(searchLower) ||
      order.notes?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when search term or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // --- Payment functions ---
  const handlePayClick = (order) => {
    setOrderToPay(order);
    setShowDetailModal(false); // Close details modal when opening payment
  };

  const handlePaymentSuccess = () => {
    console.log('handlePaymentSuccess called in Orders component');
    console.log('Payment success - refreshing orders...');
    setOrderToPay(null);
    // Show success notification instead of alert
    if (window.notify) {
      window.notify('Paiement réussi ! 🎉', 'success');
    } else {
      alert('Paiement réussi ! 🎉');
    }

    // Refresh orders immediately to show updated data
    console.log('Refreshing orders after payment success...');
    fetchOrders();
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
      pending: { label: 'En attente', class: 'status-pending' },
      cancelled: { label: 'Annulée', class: 'status-cancelled' },
      confirmed: { label: 'Confirmée', class: 'status-confirmed' },
      processing: { label: 'En traitement', class: 'status-processing' },
      delivered: { label: 'Livrée', class: 'status-delivered' }
    };
    const config = statusConfig[status] || { label: status, class: 'status-unknown' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      Pending: { label: 'En attente', class: 'status-pending' },
      Paid: { label: 'Payée', class: 'status-confirmed' },
      Failed: { label: 'Échoué', class: 'status-cancelled' },
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
    <div className="orders-container">
      <ClientNavbar />

      <div className="orders-header">
        <h1>Mes Commandes</h1>
      </div>

      <div className="main-content">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher par numéro de commande, statut, produit, adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="search-icon">🔍</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="orders-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >Toutes</button>
          <button
            className={`filter-btn ${filter === 'payment-pending' ? 'active' : ''}`}
            onClick={() => setFilter('payment-pending')}
          >En attente</button>
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
            {filteredOrders.length === 0 ? (
              <div className="no-orders">
                <div className="no-orders-icon">📦</div>
                <h3>Aucune commande trouvée</h3>
                <p>
                  {searchTerm.trim()
                    ? `Aucune commande ne correspond à votre recherche "${searchTerm}"`
                    : `Vous n'avez pas encore passé de commande${filter !== 'all' ? ` avec le statut "${filter}"` : ''}`
                  }
                </p>
              </div>
            ) : (
              <>
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
                      {paginatedOrders.map((order) => (
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

                {/* Pagination Controls */}
                {filteredOrders.length > 0 && (
                  <div className="pagination-container">
                    <div className="pagination-info">
                      <span>
                        Affichage de {startIndex + 1} à {Math.min(endIndex, filteredOrders.length)} sur {filteredOrders.length} commandes
                      </span>
                    </div>

                    <div className="pagination-controls">
                      <div className="items-per-page">
                        <label htmlFor="itemsPerPage">Par page:</label>
                        <select
                          id="itemsPerPage"
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          className="items-select"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                        </select>
                      </div>

                      <div className="page-navigation">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="pagination-btn first"
                        >
                          ««
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="pagination-btn prev"
                        >
                          ‹
                        </button>

                        <div className="page-numbers">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`pagination-btn page ${currentPage === pageNum ? 'active' : ''}`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="pagination-btn next"
                        >
                          ›
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="pagination-btn last"
                        >
                          »»
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
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
                        {(() => {
                          const address = selectedOrder.deliveryAddress;
                          const addressParts = [
                            address.street,
                            address.city,
                            address.postalCode,
                            address.country
                          ].filter(part => part && part !== 'N/A' && part.trim() !== '');

                          let displayText = addressParts.length > 0 ? addressParts.join(', ') : 'Adresse non spécifiée';

                          // Add notes after the address if they exist
                          if (selectedOrder.notes && selectedOrder.notes.trim()) {
                            displayText += ` - ${selectedOrder.notes}`;
                          }

                          return displayText;
                        })()}
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

                {/* Payment Breakdown */}
                {selectedOrder.paymentStatus === 'Paid' && (
                  <div className="payment-breakdown">
                    <h3>Détails du Paiement</h3>
                    <div className="breakdown-item">
                      <span className="label">Montant Original :</span>
                      <span className="value">{formatPrice(selectedOrder.originalAmount || selectedOrder.totalAmount)}</span>
                    </div>

                    {selectedOrder.coupon && (
                      <div className="breakdown-item coupon-discount">
                        <span className="label">Réduction Coupon ({selectedOrder.coupon.code}) :</span>
                        <span className="value">-{formatPrice(selectedOrder.coupon.discountAmount)}</span>
                      </div>
                    )}

                    {selectedOrder.paymentDetails && selectedOrder.paymentDetails.method === 'stripe' && (
                      <div className="breakdown-item card-payment">
                        <span className="label">Paiement par Carte :</span>
                        <span className="value">{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    )}

                    {selectedOrder.paymentDetails && selectedOrder.paymentDetails.method === 'coupon' && (
                      <div className="breakdown-item coupon-payment">
                        <span className="label">Paiement par Coupon :</span>
                        <span className="value">{formatPrice(selectedOrder.coupon?.discountAmount || 0)}</span>
                      </div>
                    )}

                    {selectedOrder.paymentDetails && selectedOrder.paymentDetails.method === 'coupon_partial' && (
                      <>
                        <div className="breakdown-item coupon-payment">
                          <span className="label">Paiement par Coupon :</span>
                          <span className="value">{formatPrice(selectedOrder.coupon?.discountAmount || 0)}</span>
                        </div>
                        <div className="breakdown-item card-payment">
                          <span className="label">Paiement par Carte :</span>
                          <span className="value">{formatPrice(selectedOrder.totalAmount - (selectedOrder.coupon?.discountAmount || 0))}</span>
                        </div>
                      </>
                    )}

                    <div className="breakdown-total">
                      <span className="label">Montant Total Payé :</span>
                      <span className="value">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>

                    {selectedOrder.paymentDetails && (
                      <div className="payment-method">
                        <span className="label">Méthode de Paiement :</span>
                        <span className="value">
                          {selectedOrder.paymentDetails.method === 'stripe' ? '💳 Carte Bancaire' :
                            selectedOrder.paymentDetails.method === 'coupon' ? '🎫 Coupon' :
                              selectedOrder.paymentDetails.method === 'coupon_partial' ? '🎫 Coupon + 💳 Carte' :
                                selectedOrder.paymentDetails.method}
                        </span>
                      </div>
                    )}
                  </div>
                )}

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
      </div>

      {/* Payment modal */}
      {orderToPay && (
        <PaymentModal
          order={orderToPay}
          onPaySuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};

export default Orders;
