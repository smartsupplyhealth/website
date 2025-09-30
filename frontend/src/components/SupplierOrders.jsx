// src/components/SupplierOrders.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import '../style/Orders.css';
import SupplierNavbar from './dashboard/SupplierNavbar';
import NotificationButton from './NotificationButton';
import NotificationPanel from './NotificationPanel';
import { API_URL } from '../config/environment';

/* ===== Helpers d'affichage ===== */
const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (price) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
    .format(Number(price ?? 0));

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: 'En attente', class: 'status-pending' },
    confirmed: { label: 'Confirmée', class: 'status-confirmed' },
    processing: { label: 'En traitement', class: 'status-processing' },
    delivered: { label: 'Livrée', class: 'status-delivered' },
    cancelled: { label: 'Annulée', class: 'status-cancelled' },
  };
  const cfg = statusConfig[status] || { label: status || '—', class: 'status-unknown' };
  return <span className={`status-badge ${cfg.class}`}>{cfg.label}</span>;
};

/* ===== Normalisation serveur -> UI ===== */
const normalizeOrder = (o, idx = 0) => {
  if (!o || typeof o !== 'object') return null;
  const client = o.client ?? o.customer ?? {};
  const address = o.deliveryAddress ?? o.address ?? null;

  const items = Array.isArray(o.items)
    ? o.items.filter(Boolean).map((it, i) => {
      const prod = it?.product ?? {};
      const qty = Number(it?.quantity ?? it?.qty ?? 0);
      const unit = Number(it?.unitPrice ?? it?.price ?? 0);
      return {
        _id: it?._id ?? `itm_${idx}_${i}`,
        quantity: qty,
        unitPrice: unit,
        totalPrice: Number(it?.totalPrice ?? qty * unit),
        product: {
          name: prod?.name ?? 'Produit inconnu',
          sku: prod?.sku ?? '—',
        },
      };
    })
    : [];

  return {
    _id: o._id ?? `ord_${idx}`,
    orderNumber: o.orderNumber ?? o.number ?? '—',
    createdAt: o.createdAt ?? o.date ?? null,
    status: o.status ?? 'confirmed',
    notes: o.notes ?? '',
    totalAmount: Number(o.totalAmount ?? o.total ?? 0),
    client: {
      name: client?.name ?? 'Client inconnu',
      clinicName: client?.clinicName ?? client?.company ?? '—',
      email: client?.email ?? '—',
    },
    deliveryAddress: address
      ? {
        street: address?.street ?? '—',
        city: address?.city ?? '—',
        postalCode: address?.postalCode ?? '—',
        country: address?.country ?? '—',
      }
      : null,
    items,
  };
};

export default function SupplierOrders() {
  const { token } = useAuth();
  const { showNotification } = useNotifications();
  const [orders, setOrders] = useState([]);        // jamais null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [confirmationModal, setConfirmationModal] = useState({ show: false, orderId: null, newStatus: null });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const url =
        filter === 'all'
          ? `${API_URL}/api/supplier/orders`
          : `${API_URL}/api/supplier/orders?status=${encodeURIComponent(filter)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let payload;
      try {
        payload = await response.json();
      } catch {
        setError(`Erreur serveur: réponse non-JSON (statut ${response.status})`);
        setOrders([]);
        return;
      }

      const raw = Array.isArray(payload) ? payload : (payload?.data ?? payload?.orders ?? []);
      const normalized = (Array.isArray(raw) ? raw : [])
        .filter(Boolean)
        .map((o, i) => normalizeOrder(o, i))
        .filter(Boolean);

      if (!response.ok && !payload?.success) {
        setError(payload?.message || `Erreur HTTP ${response.status}`);
        setOrders(normalized); // montrer ce qu’on peut
        return;
      }

      setOrders(normalized);
    } catch (e) {
      setError('Erreur de connexion au serveur');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.client?.name?.toLowerCase().includes(searchLower) ||
      order.client?.clinicName?.toLowerCase().includes(searchLower) ||
      order.client?.email?.toLowerCase().includes(searchLower) ||
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

  const updateOrderStatus = async (orderId, newStatus) => {
    setConfirmationModal({ show: true, orderId, newStatus });
  };

  const confirmStatusUpdate = async () => {
    const { orderId, newStatus } = confirmationModal;
    setConfirmationModal({ show: false, orderId: null, newStatus: null });

    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      let payload;
      try {
        payload = await res.json();
      } catch {
        showNotification(`Erreur serveur: réponse non-JSON (statut ${res.status})`, 'error');
        return;
      }

      if (!res.ok || payload?.success === false) {
        showNotification(payload?.message || `Erreur HTTP ${res.status}`, 'error');
        return;
      }

      showNotification('Statut de la commande mis à jour avec succès', 'success');
      fetchOrders();
    } catch {
      showNotification('Erreur de connexion au serveur', 'error');
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <div className="orders-container">
        <SupplierNavbar />
        <NotificationButton />
        <NotificationPanel />
        <div className="loading-spinner">
          <div className="spinner" />
          <p>Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <SupplierNavbar />
      <NotificationButton />
      <NotificationPanel />

      <div className="orders-header">
        <h1>Commandes</h1>
        <div className="header-divider"></div>
      </div>

      <div className="main-content">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher par numéro de commande, client, produit, adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="search-icon">🔍</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="orders-filters">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'pending', label: 'En attente' },
            { key: 'confirmed', label: 'Confirmées' },
            { key: 'processing', label: 'En traitement' },
            { key: 'delivered', label: 'Livrées' },
            { key: 'cancelled', label: 'Annulées' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Erreur */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchOrders}>Réessayer</button>
          </div>
        )}

        {/* Liste des commandes */}
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h3>Aucune commande trouvée</h3>
            <p>
              {searchTerm.trim()
                ? `Aucune commande ne correspond à votre recherche "${searchTerm}"`
                : `Aucune commande ne contient vos produits${filter !== 'all' ? ` avec le statut "${filter}"` : ''}`
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
                    <th>Client</th>
                    <th>Date</th>
                    <th>Produits</th>
                    <th>Montant Total</th>
                    <th>Statut</th>
                    <th>Actions</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr key={order._id}>
                      <td><strong>{order.orderNumber || '—'}</strong></td>
                      <td>
                        {order.client?.name || 'Client inconnu'} ({order.client?.clinicName || '—'})
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <div className="order-items-summary">
                          {Array.isArray(order.items) ? order.items.length : 0} produit
                          {Array.isArray(order.items) && order.items.length > 1 ? 's' : ''}
                          <div className="items-preview">
                            {(order.items?.slice?.(0, 2) ?? []).map((item, index) => (
                              <span key={item?._id ?? index} className="item-name">
                                {item?.product?.name || 'Produit inconnu'}
                                {index < Math.min(order.items?.length ?? 0, 2) - 1 && ', '}
                              </span>
                            ))}
                            {(order.items?.length ?? 0) > 2 && (
                              <span className="more-items">
                                +{(order.items?.length ?? 0) - 2} autre
                                {(order.items?.length ?? 0) > 3 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><strong>{formatPrice(order.totalAmount)}</strong></td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>
                        <div className="order-actions">
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => {
                              updateOrderStatus(order._id, e.target.value);
                            }}
                            className="status-select"
                            disabled={['delivered', 'cancelled'].includes(order.status)}
                          >
                            <option value="pending">En attente</option>
                            <option value="confirmed">Confirmée</option>
                            <option value="processing">En traitement</option>
                            <option value="delivered">Livrée</option>
                            <option value="cancelled">Annulée</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-details"
                          onClick={() => openOrderDetails(order)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10,9 9,9 8,9" />
                          </svg>
                          Détails
                        </button>
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
                      <option value={4}>4</option>
                      <option value={8}>8</option>
                      <option value={12}>12</option>
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
      </div>

      {/* Modal détails de commande */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de la commande {selectedOrder.orderNumber || '—'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="order-info">
                <div className="info-row">
                  <span className="label">Client:</span>
                  <span className="value">
                    {selectedOrder.client?.name || 'Client inconnu'} ({selectedOrder.client?.clinicName || '—'})
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Date de commande:</span>
                  <span className="value">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Statut:</span>
                  <span className="value">{getStatusBadge(selectedOrder.status)}</span>
                </div>
                {selectedOrder.deliveryAddress && (
                  <div className="info-row">
                    <span className="label">Adresse de livraison:</span>
                    <span className="value">
                      {(() => {
                        const address = selectedOrder.deliveryAddress;
                        const addressParts = [
                          address?.street,
                          address?.city,
                          address?.postalCode,
                          address?.country
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
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length ? (
                  selectedOrder.items.map((item, index) => (
                    <div key={item?._id ?? index} className="order-item">
                      <div className="item-info">
                        <div className="item-name">{item?.product?.name || 'Produit inconnu'}</div>
                        <div className="item-details">
                          Quantité: {item?.quantity ?? 0} × {formatPrice(item?.unitPrice)}
                        </div>
                      </div>
                      <div className="item-total">
                        {formatPrice(item?.totalPrice)}
                      </div>
                    </div>
                  ))
                ) : (
                  <em>Aucun article</em>
                )}

                <div className="order-total">
                  <strong>Total: {formatPrice(selectedOrder.totalAmount)}</strong>
                </div>
              </div>

              {!!selectedOrder.notes && (
                <div className="order-notes">
                  <h3>Notes</h3>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <select
                value={selectedOrder.status || 'pending'}
                onChange={(e) => {
                  updateOrderStatus(selectedOrder._id, e.target.value);
                  closeModal();
                }}
                className="status-select"
                disabled={['delivered', 'cancelled'].includes(selectedOrder.status)}
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="processing">En traitement</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
              <button className="btn-close" onClick={closeModal}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.show && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <div className="modal-header">
              <h3 className="modal-title">Confirmer le changement de statut</h3>
            </div>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir changer le statut à <strong>« {confirmationModal.newStatus} »</strong> ?</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setConfirmationModal({ show: false, orderId: null, newStatus: null })}
              >
                Annuler
              </button>
              <button
                className="btn-confirm"
                onClick={confirmStatusUpdate}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
