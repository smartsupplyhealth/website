import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import ClientNavbar from './dashboard/ClientNavbar';
import '../style/ManagePaymentMethods.css';
import '../style/ProductForm.css'; // styles du container + carte

// --- AddCardForm Sub-component ---
const AddCardForm = ({ clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    onError('');

    if (!stripe || !elements) {
      onError('Stripe is not ready. Please wait a moment.');
      setIsProcessing(false);
      return;
    }

    try {
      const cardElement = elements.getElement(CardElement);
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        onError(error.message);
        setIsProcessing(false);
        return;
      }

      // Save the payment method to our local database
      const response = await api.post('/payments/save-payment-method', {
        stripePaymentMethodId: setupIntent.payment_method,
        cardholderName: cardholderName || 'Card Holder'
      });

      if (response.data.success) {
        onSuccess();
      } else {
        onError(response.data.message || 'Failed to save payment method');
      }
    } catch (err) {
      console.error('Error saving payment method:', err);
      onError(err.response?.data?.message || 'Failed to save payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: { color: '#32325d', fontFamily: '"Helvetica Neue", Helvetica, sans-serif', fontSize: '16px' },
      invalid: { color: '#fa755a' },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="form-group">
        <label htmlFor="cardholderName">Nom du titulaire</label>
        <input
          type="text"
          id="cardholderName"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Nom comme sur la carte"
          required
          disabled={isProcessing}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="card-element">Détails de la carte</label>
        <CardElement id="card-element" options={CARD_ELEMENT_OPTIONS} />
      </div>

      <button type="submit" disabled={!stripe || isProcessing} className="auth-button" style={{ marginTop: 20 }}>
        {isProcessing ? 'Enregistrement...' : 'Enregistrer la carte'}
      </button>
    </form>
  );
};

// --- Main Component ---
const ManagePaymentMethods = () => {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const setup = useCallback(async () => {
    setLoading(true);
    try {
      const cardsRes = await api.get('/payments/payment-methods');
      setSavedCards(cardsRes.data);

      const intentRes = await api.post('/payments/create-setup-intent');
      setClientSecret(intentRes.data.clientSecret);
      if (!stripePromise) {
        setStripePromise(loadStripe(intentRes.data.publishableKey));
      }
    } catch (err) {
      console.error('Setup error:', err);

      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        // Redirect to login or clear token
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (err.response?.status === 403) {
        setError('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      } else {
        setError('Impossible de charger les détails de paiement. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }, [stripePromise]);

  useEffect(() => {
    setup();
  }, [setup]);

  const refreshCards = async () => {
    try {
      const cardsRes = await api.get('/payments/payment-methods');
      setSavedCards(cardsRes.data);
    } catch (err) {
      console.error('Impossible de rafraîchir la liste des cartes', err);
    }
  };

  const handleDeleteCard = async (paymentMethodId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;

    // Add loading state
    setLoading(true);
    setError('');
    setNotification('');

    try {
      console.log('🗑️ Deleting payment method with ID:', paymentMethodId);

      // Check if we have a valid token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('🔑 Token found, making delete request...');
      const response = await api.delete(`/payments/payment-methods/${paymentMethodId}`);
      console.log('✅ Delete response:', response.data);

      setNotification('Carte supprimée avec succès !');
      refreshCards();
    } catch (err) {
      console.error('❌ Delete card error:', err);

      let errorMessage = 'La suppression de la carte a échoué. Veuillez réessayer.';

      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const message = err.response.data?.message || err.response.data?.error;

        if (status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (status === 403) {
          errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
        } else if (status === 404) {
          errorMessage = 'Carte non trouvée. Elle a peut-être déjà été supprimée.';
        } else if (message) {
          errorMessage = message;
        }

        console.error(`❌ Server error ${status}:`, message);
      } else if (err.request) {
        // Network error
        errorMessage = 'Erreur de connexion. Vérifiez que le serveur est démarré et votre connexion internet.';
        console.error('❌ Network error:', err.request);
      } else {
        // Other error
        errorMessage = err.message || errorMessage;
        console.error('❌ Unexpected error:', err.message);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setShowEditModal(true);
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      setLoading(true);
      setError('');
      setNotification('');

      const response = await api.put(`/payments/payment-methods/${paymentMethodId}/set-default`);

      if (response.data.success) {
        setNotification('Carte par défaut mise à jour avec succès !');
        refreshCards();
      } else {
        setError(response.data.message || 'Erreur lors de la mise à jour de la carte par défaut.');
      }
    } catch (err) {
      console.error('❌ Set default card error:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour de la carte par défaut.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCard(null);
  };

  const handleSaveCard = async (updatedCardData) => {
    try {
      setLoading(true);
      setError('');
      setNotification('');

      const response = await api.put(`/payments/payment-methods/${editingCard.id}`, updatedCardData);

      if (response.data.success) {
        setNotification('Carte mise à jour avec succès !');
        refreshCards();
        handleCloseEditModal();
      } else {
        setError(response.data.message || 'Erreur lors de la mise à jour de la carte.');
      }
    } catch (err) {
      console.error('❌ Update card error:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour de la carte.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ClientNavbar />
      <div className="orders-container">
        <div className="orders-header">
          <h1>Gérer les moyens de paiement</h1>
          <p>Ajoutez, modifiez et gérez vos cartes de paiement en toute sécurité.</p>
        </div>
        <div className="main-content">
          <div className="profile-card">

            {error && <div className="auth-error">{error}</div>}
            {notification && <div className="auth-success">{notification}</div>}

            <div className="saved-cards-section">
              <h3>Vos cartes enregistrées</h3>
              {loading && <p>Chargement...</p>}
              {!loading && savedCards.length === 0 && <p>Vous n'avez aucun moyen de paiement enregistré.</p>}
              {!loading && savedCards.length > 0 && (
                <ul className="saved-cards-list">
                  {savedCards.map((card) => (
                    <li key={card.id} className="saved-card-item">
                      <div className="payment-method-info">
                        <div className="card-details">
                          <span className="brand">
                            {card.brand.charAt(0).toUpperCase() + card.brand.slice(1).toLowerCase()} se terminant par {card.last4}
                            {card.isDefault && <span className="default-badge">Par défaut</span>}
                          </span>
                        </div>
                      </div>
                      <div className="card-actions">
                        {!card.isDefault && (
                          <button
                            onClick={() => handleSetDefault(card.id)}
                            className="btn btn-primary"
                            disabled={loading}
                            title="Définir comme carte par défaut"
                          >
                            ⭐ Par défaut
                          </button>
                        )}
                        <button
                          onClick={() => handleEditCard(card)}
                          className="btn btn-secondary"
                          disabled={loading}
                          title="Modifier la carte"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="btn btn-danger"
                          disabled={loading}
                          title="Supprimer la carte"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <hr className="form-divider" />

            <div className="add-card-section">
              <h3>Ajouter une nouvelle carte</h3>
              <p>Votre carte sera enregistrée de manière sécurisée pour les futurs paiements.</p>

              {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise}>
                  <AddCardForm
                    clientSecret={clientSecret}
                    onSuccess={() => {
                      setNotification('Carte enregistrée avec succès !');
                      refreshCards();
                    }}
                    onError={setError}
                  />
                </Elements>
              ) : (
                <p>Chargement du formulaire...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Card Modal */}
      {showEditModal && editingCard && (
        <EditCardModal
          card={editingCard}
          onSave={handleSaveCard}
          onCancel={handleCloseEditModal}
          loading={loading}
        />
      )}
    </>
  );
};

// Edit Card Modal Component
const EditCardModal = ({ card, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    cardholderName: card.cardholderName || '',
    expiryMonth: card.exp_month || '',
    expiryYear: card.exp_year || '',
    cvv: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Modifier la carte</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-card-form">
          <div className="form-group">
            <label htmlFor="cardholderName">Nom du titulaire</label>
            <input
              type="text"
              id="cardholderName"
              name="cardholderName"
              value={formData.cardholderName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryMonth">Mois d'expiration</label>
              <select
                id="expiryMonth"
                name="expiryMonth"
                value={formData.expiryMonth}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Sélectionner</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {String(i + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="expiryYear">Année d'expiration</label>
              <select
                id="expiryYear"
                name="expiryYear"
                value={formData.expiryYear}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Sélectionner</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cvv">CVV (pour vérification)</label>
            <input
              type="text"
              id="cvv"
              name="cvv"
              value={formData.cvv}
              onChange={handleChange}
              placeholder="123"
              maxLength="4"
              required
              disabled={loading}
            />
            <small>Entrez le CVV pour confirmer les modifications</small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagePaymentMethods;
