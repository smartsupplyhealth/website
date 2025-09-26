import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import ClientNavbar from './dashboard/ClientNavbar';
import '../style/ProductForm.css'; // styles du container + carte

// --- AddCardForm Sub-component ---
const AddCardForm = ({ clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    onError('');

    if (!stripe || !elements) {
      onError('Stripe is not ready. Please wait a moment.');
      setIsProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const { error } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) onError(error.message);
    else onSuccess();

    setIsProcessing(false);
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: { color: '#32325d', fontFamily: '"Helvetica Neue", Helvetica, sans-serif', fontSize: '16px' },
      invalid: { color: '#fa755a' },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <CardElement options={CARD_ELEMENT_OPTIONS} />
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
      setError('Impossible de charger les détails de paiement. Veuillez réessayer.');
      console.error(err);
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
    try {
      await api.delete(`/payments/payment-methods/${paymentMethodId}`);
      setNotification('Carte supprimée avec succès !');
      refreshCards();
    } catch (err) {
      setError('La suppression de la carte a échoué. Veuillez réessayer.');
      console.error('Delete card error:', err);
    }
  };

  return (
    <>
      {/* Navbar en haut, hors du container */}
      <ClientNavbar />

      {/* Container plein écran sous la navbar */}
      <div className="product-form-container">
        <div className="product-form-card">
          <h2 className="product-form-title">Gérer les moyens de paiement</h2>

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
                      <span className="brand">
                        {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} se terminant par {card.last4}
                      </span>
                      <span className="expiry">Expire le {card.exp_month}/{card.exp_year}</span>
                    </div>
                    <button onClick={() => handleDeleteCard(card.id)} className="btn btn-danger">Supprimer</button>
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
    </>
  );
};

export default ManagePaymentMethods;
