import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import './../style/PaymentModal.css';

// 1. CheckoutForm Component - The actual payment form
const CheckoutForm = ({ order, onPaySuccess, onCancel, setErrorMessage }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(''); // Store payment method ID
  const [isCardFormVisible, setCardFormVisible] = useState(false);
  const [cvv, setCvv] = useState(''); // CVV for saved cards

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!stripe) return; // Wait for stripe to be available
      setLoading(true);
      try {
        const { data } = await api.get('/payments/payment-methods');
        setSavedCards(data);
        if (data.length > 0) {
          setSelectedCard(data[0].id); // Select the first card by default
          setCardFormVisible(false);
        } else {
          setCardFormVisible(true); // No cards, force show form
        }
      } catch (error) {
        console.error("Failed to fetch saved cards:", error);
        setErrorMessage("Could not load your saved payment methods.");
        setCardFormVisible(true); // Show form as a fallback
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentMethods();
  }, [stripe, setErrorMessage]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (!stripe || !elements) {
      setErrorMessage('Stripe has not loaded yet. Please wait a moment.');
      setLoading(false);
      return;
    }

    // Validate CVV for saved cards
    if (selectedCard && !isCardFormVisible) {
      if (!cvv || cvv.length < 3) {
        setErrorMessage('Please enter a valid CVV (3-4 digits).');
        setLoading(false);
        return;
      }
    }

    try {
      // Get client secret from your backend
      const res = await api.post(`/payments/create-payment-intent/${order._id}`, {
        paymentMethodId: selectedCard && !isCardFormVisible ? selectedCard : null
      });
      const { clientSecret } = res.data;

      let paymentMethodPayload;
      if (selectedCard && !isCardFormVisible) {
        // Use a saved payment method
        paymentMethodPayload = selectedCard;
      } else {
        // Use the new card from CardElement
        const cardElement = elements.getElement(CardElement);
        paymentMethodPayload = {
          card: cardElement,
          billing_details: {
            // TODO: Get customer name from context or props
            name: 'Customer Name', 
          },
        };
      }

      // Confirm the card payment
      let confirmOptions = {
        payment_method: paymentMethodPayload,
      };

      // For saved cards, we need to include CVV in the confirmation
      if (selectedCard && !isCardFormVisible) {
        confirmOptions.payment_method = {
          payment_method: selectedCard,
          cvc: cvv
        };
      } else if (typeof paymentMethodPayload === 'object' && paymentMethodPayload.card) {
        // For new cards, save for future use
        confirmOptions.setup_future_usage = 'off_session';
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, confirmOptions);

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment succeeded, now update the order status on your backend
        await api.post(`/payments/update-order-payment-status/${order._id}`, {
          paymentIntentId: paymentIntent.id,
        });
        onPaySuccess(); // Notify parent component of success
      } else if (paymentIntent.status === 'requires_action') {
        // Handle additional authentication if required (like CVV verification)
        const { error: confirmError, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(clientSecret);
        if (confirmError) {
          setErrorMessage(confirmError.message);
          setLoading(false);
        } else if (confirmedPaymentIntent.status === 'succeeded') {
          // Payment succeeded after additional authentication
          await api.post(`/payments/update-order-payment-status/${order._id}`, {
            paymentIntentId: confirmedPaymentIntent.id,
          });
          onPaySuccess();
        } else {
          setErrorMessage('Payment could not be completed. Please try again.');
          setLoading(false);
        }
      } else {
        setErrorMessage('Payment could not be completed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      const message = err.response?.data?.message || 'An unexpected error occurred.';
      setErrorMessage(message);
      setLoading(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="payment-modal-body">
        {loading && savedCards.length === 0 && <p>Loading saved cards...</p>}

        {!loading && savedCards.length > 0 && !isCardFormVisible && (
          <div className="saved-card-section">
            <label htmlFor="saved-card-select">Pay with a saved card</label>
            <select
              id="saved-card-select"
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="saved-card-select" // Add some styling for this
            >
              {savedCards.map(card => (
                <option key={card.id} value={card.id}>
                  {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} ending in {card.last4}
                </option>
              ))}
            </select>
            
            <div className="cvv-section">
              <label htmlFor="cvv-input">CVV *</label>
              <input
                id="cvv-input"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="Enter the 3 or 4 digit code on your card"
                className="cvv-input"
                maxLength="4"
                required
              />
              <small className="cvv-help">Enter the 3 or 4 digit code on your card</small>
            </div>
            
            <button type="button" className="link-button" onClick={() => { setCardFormVisible(true); setSelectedCard(''); }}>
              Pay with a new card
            </button>
          </div>
        )}

        {isCardFormVisible && (
          <div className="new-card-section">
            <label htmlFor="card-element">Card Details</label>
            <CardElement id="card-element" options={CARD_ELEMENT_OPTIONS} />
            {savedCards.length > 0 && (
              <button type="button" className="link-button" onClick={() => { setCardFormVisible(false); setSelectedCard(savedCards[0].id); }}>
                Use a saved card
              </button>
            )}
          </div>
        )}
      </div>
      <div className="payment-modal-footer">
        <button type="button" className="cancel-btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="pay-btn" disabled={!stripe || loading}>
          {loading ? 'Processing...' : `Pay ${order.totalAmount.toFixed(2)} €`}
        </button>
      </div>
    </form>
  );
};

// 2. StripePaymentModal Wrapper Component - Loads Stripe and handles state
const StripePaymentModal = ({ order, onPay, onCancel }) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchPublishableKey = async () => {
      try {
        // We need a temporary API call to get the publishable key.
        // NOTE: In a real app, you might fetch this once when the app loads.
        // We create a payment intent just to get the key, but we don't use the clientSecret here.
        const res = await api.post(`/payments/create-payment-intent/${order._id}`);
        const { publishableKey } = res.data;
        setStripePromise(loadStripe(publishableKey));
      } catch (error) {
        console.error("Failed to fetch Stripe publishable key:", error);
        setErrorMessage("Failed to connect to the payment service.");
      }
    };
    fetchPublishableKey();
  }, [order._id]);

  const handlePaySuccess = () => {
    // This function is called from the CheckoutForm on successful payment
    // It then calls the original onPay prop passed to StripePaymentModal
    onPay(order._id); 
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h3>Pay for Order</h3>
          <p>Total Amount: <strong>{order.totalAmount.toFixed(2)} €</strong></p>
        </div>
        {errorMessage && <div className="payment-error">{errorMessage}</div>}
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              order={order} 
              onPaySuccess={handlePaySuccess} 
              onCancel={onCancel}
              setErrorMessage={setErrorMessage}
            />
          </Elements>
        ) : (
          <div className="payment-modal-body">
            <p>Loading Payment Gateway...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripePaymentModal;
