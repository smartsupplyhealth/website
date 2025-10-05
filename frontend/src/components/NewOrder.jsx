import React, { useState, useMemo, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/environment';
import '../style/NewOrder.css';
import ClientNavbar from './dashboard/ClientNavbar';
import PaymentModal from './PaymentModal';
import Notification from './common/Notification';
import NotificationButton from './NotificationButton';
import NotificationPanel from './NotificationPanel';
import { CartContext } from '../contexts/CartContext';

export default function NewOrder() {
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useContext(CartContext);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isCheckoutVisible, setCheckoutVisible] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderToPay, setOrderToPay] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState('');
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem('token'), []);
  const axiosAuth = useMemo(() => {
    return axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  useEffect(() => {
    const fetchClientAddress = async () => {
      try {
        const response = await axiosAuth.get('/api/auth/me');
        const user = response.data.data.user;
        if (user && user.address) setDeliveryAddress(user.address);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'adresse:", error);
      }
    };
    fetchClientAddress();
  }, [axiosAuth]);

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  // ---------- Notifications ----------
  const notify = (message, type = 'info') => setNotification({ message, type });

  // ---------- Handlers quantité/suppression ----------
  const handleInc = (item) => {
    const next = item.quantity + 1;
    if (item.maxStock && next > item.maxStock) {
      notify(`Stock max atteint pour « ${item.name} ».`, 'error');
      return;
    }
    updateCartQuantity(item.productId, next);
    notify(`Quantité augmentée: « ${item.name} » (${next}).`, 'success');
  };

  const handleDec = (item) => {
    const next = Math.max(1, item.quantity - 1);
    updateCartQuantity(item.productId, next);
    notify(`Quantité diminuée: « ${item.name} » (${next}).`, 'info');
  };

  const handleRemove = (item) => {
    removeFromCart(item.productId);
    // ⚠️ type passé à "error" pour un contraste fort (rouge) et meilleure lisibilité
    notify(`Produit supprimé du panier: « ${item.name} ».`, 'error');
  };

  const handleConfirmOrder = async () => {
    if (!deliveryAddress.trim()) {
      notify("Veuillez indiquer une adresse de livraison.", "error");
      return;
    }
    try {
      setLoading(true);
      const orderData = {
        products: cart.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: {
          street: deliveryAddress,
          city: 'N/A', postalCode: 'N/A', country: 'N/A',
        },
        notes: orderNotes,
        totalAmount,
        paymentMethod: 'card', // Default payment method
      };
      const { data: newOrder } = await axiosAuth.post('/api/orders', orderData);

      // Only set order to pay if payment status is Pending
      if (newOrder.paymentStatus === 'Pending') {
        setOrderToPay(newOrder);
        setCheckoutVisible(false);
      } else {
        // If order is already paid (shouldn't happen), show success message
        notify("Commande créée avec succès!", "success");
        clearCart();
        setTimeout(() => navigate('/client-dashboard/orders'), 1500);
      }
    } catch (e) {
      console.error(e);
      notify("Erreur lors de la création de la commande.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    console.log('handlePaymentSuccess called in NewOrder component');
    setLoading(false); // Set loading to false since payment is complete

    // Get order number for the success message
    const orderNumber = orderToPay ? orderToPay.orderNumber : 'N/A';

    setOrderToPay(null);
    clearCart();

    // Show success message and manual continue option
    setSuccessOrderNumber(orderNumber);
    setShowSuccessMessage(true);
    notify(`🚀 Commande #${orderNumber} créée et payée avec succès ! Votre commande est confirmée. 🎉`, "success");
  };

  const handleContinueToOrders = () => {
    console.log('Continuing to orders page...');
    setShowSuccessMessage(false);
    navigate('/client-dashboard/orders');

    // Check if this manual order unlocks auto orders (after navigation)
    setTimeout(() => {
      notify("✅ Commande manuelle confirmée! Vous pouvez maintenant passer des commandes automatiques (max 2/jour).", "info");
    }, 1000);
  };

  const handlePaymentCancel = () => {
    setOrderToPay(null);
    notify("Paiement annulé. Votre commande est en attente de paiement.", "info");
    setTimeout(() => navigate('/client-dashboard/orders'), 1500);
  };

  const handleAddProducts = () => {
    notify("Vous pouvez ajouter d'autres produits depuis le catalogue.", "info");
    setTimeout(() => navigate('/client-dashboard/catalog'), 600);
  };

  // Fonctions pour le curseur rotatif
  const handleDialStart = (e, item) => {
    e.preventDefault();
    const startX = e.clientX || e.touches[0].clientX;
    const startY = e.clientY || e.touches[0].clientY;
    const startQuantity = item.quantity;

    const handleMouseMove = (moveEvent) => {
      const currentX = moveEvent.clientX || moveEvent.touches[0].clientX;
      const currentY = moveEvent.clientY || moveEvent.touches[0].clientY;

      const deltaX = currentX - startX;
      const deltaY = startY - currentY; // Inversé pour que vers le haut = +

      // Sensibilité du curseur
      const sensitivity = 0.1;
      const delta = Math.round((deltaX + deltaY) * sensitivity);
      const newQuantity = Math.max(1, Math.min(item.maxStock, startQuantity + delta));

      if (newQuantity !== item.quantity) {
        updateCartQuantity(item.productId, newQuantity);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);
  };

  return (
    <>
      <ClientNavbar />
      <NotificationButton />
      <NotificationPanel />
      <div className="orders-container">
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: '', type: '' })}
        />
        <div className="orders-header">
          <h1>Mon Panier</h1>
          <p>Vérifiez vos articles puis finalisez votre commande en toute simplicité.</p>
        </div>
        <div className="main-content">
          <div className="profile-card">
            <h2 className="card-header">Votre Commande</h2>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Votre panier est vide.</p>
                <p>Ajoutez des produits depuis le <a href="/client-dashboard/catalog">catalogue</a>.</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.productId} className="cart-item">
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <p>{item.price.toFixed(2)} €</p>
                      </div>
                      <div className="item-controls">
                        <div className="quantity-section">
                          <div className="quantity-controls">
                            <div
                              className="quantity-dial"
                              onMouseDown={(e) => handleDialStart(e, item)}
                              onTouchStart={(e) => handleDialStart(e, item)}
                            >
                              <div className="dial-circle">
                                <div className="dial-value">{item.quantity}</div>
                                <div className="dial-indicator"></div>
                              </div>
                            </div>
                          </div>
                          <div className="stock-info">
                            <span className="max-stock">Max: {item.maxStock}</span>
                          </div>
                        </div>
                        <div className="price-section">
                          <span className="item-total">
                            {(item.price * item.quantity).toFixed(2)} €
                          </span>
                          <button className="remove-btn" onClick={() => handleRemove(item)}>×</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-header">
                    <button
                      className="clear-cart-btn"
                      onClick={() => setShowClearConfirm(true)}
                      disabled={cart.length === 0}
                    >
                      🗑️ Supprimer tout
                    </button>
                    <div className="total-amount">Total: {totalAmount.toFixed(2)} €</div>
                  </div>
                  <div className="cart-actions">
                    <button className="add-products-btn" onClick={handleAddProducts}>
                      + Ajouter des Produits
                    </button>
                    <button
                      className="checkout-btn"
                      onClick={() => setCheckoutVisible(true)}
                      disabled={cart.length === 0}
                    >
                      Valider la Commande
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation pour vider le panier */}
      {showClearConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className="confirm-icon">🗑️</div>
              <h3>Vider le panier</h3>
            </div>
            <div className="confirm-modal-body">
              <p>Êtes-vous sûr de vouloir supprimer tous les articles de votre panier ?</p>
              <p className="confirm-warning">Cette action est irréversible.</p>
            </div>
            <div className="confirm-modal-actions">
              <button
                className="confirm-cancel-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Annuler
              </button>
              <button
                className="confirm-delete-btn"
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                  notify("Panier vidé avec succès", "success");
                }}
              >
                Oui, vider le panier
              </button>
            </div>
          </div>
        </div>
      )}

      {isCheckoutVisible && (
        <div className="checkout-modal">
          <div className="checkout-content">
            <div className="checkout-header">
              <h2>Finaliser la Commande</h2>
              <button className="close-btn" onClick={() => setCheckoutVisible(false)}>×</button>
            </div>

            <div className="delivery-section">
              <h3>Adresse de Livraison</h3>
              <form className="address-form">
                <input
                  type="text"
                  placeholder="Adresse complète"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                />
              </form>
            </div>

            <div className="notes-section">
              <h3>Notes de Commande (optionnel)</h3>
              <textarea
                placeholder="Instructions spéciales pour la livraison..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              ></textarea>
            </div>


            <div className="checkout-summary">
              <div className="checkout-total">
                <span className="checkout-total-label">Total à Payer</span>
                <span className="checkout-total-amount">{totalAmount.toFixed(2)} €</span>
              </div>
              <div className="checkout-actions">
                <button className="cancel-btn" onClick={() => setCheckoutVisible(false)}>Annuler</button>
                <button className="confirm-order-btn" onClick={handleConfirmOrder} disabled={loading}>
                  {loading ? "Confirmation..." : "Confirmer et Payer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {orderToPay && (
        <PaymentModal
          isOpen={!!orderToPay}
          order={orderToPay}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={handlePaymentCancel}
        />
      )}

      {/* Success Message Modal */}
      {showSuccessMessage && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-modal-header">
              <h2>🎉 Commande Confirmée!</h2>
            </div>
            <div className="success-modal-body">
              <div className="success-icon">✅</div>
              <h3>Commande #{successOrderNumber} créée avec succès!</h3>
              <p>Votre commande a été payée et confirmée. Vous recevrez un email de confirmation sous peu.</p>
              <div className="success-details">
                <p><strong>Statut:</strong> Payé et confirmé</p>
                <p><strong>Prochaines étapes:</strong> Préparation et livraison</p>
              </div>
            </div>
            <div className="success-modal-footer">
              <button
                className="continue-btn"
                onClick={handleContinueToOrders}
              >
                🚀 Voir mes commandes
              </button>
              <p className="success-note">
                Cliquez sur le bouton ci-dessus pour voir le détail de vos commandes
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
