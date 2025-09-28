import React, { useState, useMemo, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/environment';
import '../style/NewOrder.css';
import ClientNavbar from './dashboard/ClientNavbar';
import PaymentModal from './PaymentModal';
import Notification from './common/Notification';
import { CartContext } from '../contexts/CartContext';

export default function NewOrder() {
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useContext(CartContext);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isCheckoutVisible, setCheckoutVisible] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderToPay, setOrderToPay] = useState(null);
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
    setOrderToPay(null);
    clearCart();
    notify("Commande et paiement réussis 🎉", "success");

    // Navigate immediately to avoid showing intermediate states
    console.log('Navigating to orders page...');
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
    notify("Vous pouvez ajouter d’autres produits depuis le catalogue.", "info");
    setTimeout(() => navigate('/client-dashboard/catalog'), 600);
  };

  return (
    <>
      <ClientNavbar />
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
                        <div className="quantity-controls">
                          <button
                            className="qty-btn"
                            onClick={() => handleDec(item)}
                            disabled={item.quantity <= 1}
                          >-</button>
                          <span className="quantity">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => handleInc(item)}>+</button>
                        </div>
                        <span className="item-total">
                          {(item.price * item.quantity).toFixed(2)} €
                        </span>
                        <button className="remove-btn" onClick={() => handleRemove(item)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="total-amount">Total: {totalAmount.toFixed(2)} €</div>
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
          order={orderToPay}
          onPaySuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </>
  );
}
