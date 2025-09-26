// src/components/SupplierOrders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../style/Orders.css';
import SupplierNavbar from './dashboard/SupplierNavbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
    confirmed:  { label: 'Confirmée',     class: 'status-confirmed'  },
    processing: { label: 'En traitement', class: 'status-processing' },
    delivered:  { label: 'Livrée',        class: 'status-delivered'  },
    cancelled:  { label: 'Annulée',       class: 'status-cancelled'  },
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
            sku:  prod?.sku  ?? '—',
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
  const [orders, setOrders] = useState([]);        // jamais null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const url =
        filter === 'all'
          ? `${API_URL}/api/orders`
          : `${API_URL}/api/orders?status=${encodeURIComponent(filter)}`;

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

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir changer le statut à « ${newStatus} » ?`)) return;

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
        alert(`Erreur serveur: réponse non-JSON (statut ${res.status})`);
        return;
      }

      if (!res.ok || payload?.success === false) {
        alert(payload?.message || `Erreur HTTP ${res.status}`);
        return;
      }

      alert('Statut de la commande mis à jour avec succès');
      fetchOrders();
    } catch {
      alert('Erreur de connexion au serveur');
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

      <div className="orders-header">
        <h1>Commandes</h1>
        <p>Gérez les commandes</p>
      </div>

      {/* Filtres */}
      <div className="orders-filters">
        {[
          { key: 'all', label: 'Toutes' },
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
      {orders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h3>Aucune commande trouvée</h3>
          <p>
            Aucune commande ne contient vos produits
            {filter !== 'all' ? ` avec le statut "${filter}"` : ''}.
          </p>
        </div>
      ) : (
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
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
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
                      <button
                        className="btn-details"
                        onClick={() => openOrderDetails(order)}
                      >
                        Détails
                      </button>
                      <select
                        value={order.status || 'confirmed'}
                        onChange={(e) => {
                          updateOrderStatus(order._id, e.target.value);
                        }}
                        className="status-select"
                        disabled={['delivered', 'cancelled'].includes(order.status)}
                      >
                        <option value="confirmed">Confirmée</option>
                        <option value="processing">En traitement</option>
                        <option value="delivered">Livrée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                      {[
                        selectedOrder.deliveryAddress?.street,
                        selectedOrder.deliveryAddress?.city,
                        selectedOrder.deliveryAddress?.postalCode,
                        selectedOrder.deliveryAddress?.country,
                      ].filter(Boolean).join(', ') || '—'}
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
                value={selectedOrder.status || 'confirmed'}
                onChange={(e) => {
                  updateOrderStatus(selectedOrder._id, e.target.value);
                  closeModal();
                }}
                className="status-select"
                disabled={['delivered', 'cancelled'].includes(selectedOrder.status)}
              >
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
    </div>
  );
}
