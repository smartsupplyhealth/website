import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import { STRIPE_PUBLISHABLE_KEY } from '../config/environment';
import '../style/PaymentModal.css';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

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

const CheckoutForm = ({ order, onPaySuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('');
  const [isCardFormVisible, setCardFormVisible] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(order.totalAmount);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!stripe) return;
      setLoading(true);
      setErrorMessage('');
      try {
        const { data } = await api.get('/payments/payment-methods');
        setSavedCards(data);
        if (data.length > 0) {
          setSelectedCard(data[0].id);
          setCardFormVisible(false);
        } else {
          setCardFormVisible(true);
        }
      } catch (error) {
        console.error("Failed to fetch saved cards:", error);
        setCardFormVisible(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentMethods();
  }, [stripe]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await api.post(`/payments/apply-coupon/${order._id}`, {
        couponCode: couponCode.trim().toUpperCase()
      });

      if (response.data.success) {
        setAppliedCoupon(response.data.coupon);
        setDiscountAmount(response.data.discountAmount);
        setFinalAmount(response.data.finalAmount);
        setCouponError('');
      } else {
        setCouponError(response.data.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Coupon application error:', error);
      setCouponError(error.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setFinalAmount(order.totalAmount);
    setCouponCode('');
    setCouponError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (!stripe || !elements) {
      setErrorMessage('Stripe has not loaded yet. Please wait a moment.');
      setLoading(false);
      return;
    }

    try {
      // Get client secret for card payment with final amount
      const res = await api.post(`/payments/create-payment-intent/${order._id}`, {
        amount: finalAmount
      });
      const { clientSecret } = res.data;

      let paymentMethodPayload;

      if (selectedCard && !isCardFormVisible) {
        // Use saved card
        paymentMethodPayload = selectedCard;
      } else {
        // Use new card
        const cardElement = elements.getElement(CardElement);
        paymentMethodPayload = {
          card: cardElement,
          billing_details: {
            name: document.getElementById('cardholder-name')?.value?.trim() || 'Card Holder',
          },
        };
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodPayload,
      });

      if (error) {
        console.error('Stripe payment error:', error);
        setErrorMessage(`Payment failed: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`);
      } else if (paymentIntent.status === 'succeeded') {
        // Update order status in backend after successful payment
        try {
          console.log('Updating order status with paymentIntentId:', paymentIntent.id);
          const updateData = {
            paymentIntentId: paymentIntent.id
          };

          // Include coupon information if a coupon was applied
          if (appliedCoupon && discountAmount > 0) {
            updateData.coupon = appliedCoupon;
            updateData.discountAmount = discountAmount;
            updateData.finalAmount = finalAmount;
          }

          const updateResponse = await api.post(`/payments/update-order-payment-status/${order._id}`, updateData);
          console.log('Order update response:', updateResponse.data);
          setLoading(false); // Reset loading state before calling success callback
          console.log('Calling onPaySuccess callback...');

          // Safety check before calling callback
          if (typeof onPaySuccess === 'function') {
            // Close modal immediately before calling success callback
            onCancel();
            onPaySuccess();
          } else {
            console.error('onPaySuccess is not a function:', typeof onPaySuccess);
          }
        } catch (updateError) {
          console.error('Error updating order after payment:', updateError);
          console.error('Update error details:', updateError.response?.data);
          setLoading(false); // Reset loading state on error

          if (updateError.response?.status === 404) {
            setErrorMessage('Order not found. Please refresh and try again.');
          } else if (updateError.response?.status === 403) {
            setErrorMessage('Unauthorized. Please log in again.');
          } else if (updateError.response?.status === 500) {
            setErrorMessage(`Server error: ${updateError.response?.data?.message || 'Failed to update order status.'}`);
          } else {
            setErrorMessage(`Payment succeeded but failed to update order status: ${updateError.response?.data?.message || updateError.message}`);
          }
        }
      } else {
        setErrorMessage('Payment could not be completed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Full error details:', error.response?.data);

      if (error.response?.status === 500) {
        setErrorMessage(`Server error: ${error.response?.data?.message || 'Internal server error. Please try again.'}`);
      } else if (error.response?.status === 400) {
        setErrorMessage(`Payment error: ${error.response?.data?.message || error.message}`);
      } else if (error.response?.status === 404) {
        setErrorMessage(`Order not found. Please refresh and try again.`);
      } else if (error.response?.status === 403) {
        setErrorMessage(`Unauthorized. Please log in again.`);
      } else {
        setErrorMessage(`Payment failed: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-payment-form">
      <div className="payment-modal-body">
        <div className="payment-section">
          <h3>Card Payment</h3>
          <p>Complete your payment with a credit or debit card</p>

          {loading && savedCards.length === 0 && <p>Loading saved cards...</p>}

          {!loading && savedCards.length > 0 && !isCardFormVisible && (
            <div className="saved-card-section">
              <label htmlFor="saved-card-select">Pay with a saved card</label>
              <select
                id="saved-card-select"
                value={selectedCard}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="saved-card-select"
              >
                {savedCards.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.brand.toUpperCase()} ending in {card.last4}
                  </option>
                ))}
              </select>

              <button type="button" className="link-button" onClick={() => { setCardFormVisible(true); setSelectedCard(''); }}>
                Pay with a new card
              </button>
            </div>
          )}

          {isCardFormVisible && (
            <div className="new-card-section">
              <div className="card-element-container">
                <label htmlFor="card-element">Card Details</label>
                <CardElement
                  id="card-element"
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={(event) => {
                    if (event.error) {
                      setErrorMessage(event.error.message);
                    } else {
                      setErrorMessage('');
                    }
                  }}
                />
              </div>

              <div className="cardholder-name-field">
                <label htmlFor="cardholder-name">Cardholder Name *</label>
                <input
                  id="cardholder-name"
                  type="text"
                  placeholder="Name as on card"
                  className="cardholder-input"
                  required
                />
              </div>

              {savedCards.length > 0 && (
                <button type="button" className="link-button" onClick={() => { setCardFormVisible(false); setSelectedCard(savedCards[0]?.id || ''); }}>
                  Use a saved card
                </button>
              )}
            </div>
          )}

          {/* Coupon Section */}
          <div className="coupon-section">
            <h4>🎟️ Coupon Code</h4>
            <div className="coupon-input-group">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="coupon-input"
                disabled={couponLoading || appliedCoupon}
              />
              {couponLoading && (
                <div className="loading-spinner">⏳</div>
              )}
            </div>

            {couponError && (
              <div className="coupon-error" style={{ color: '#e53e3e', fontSize: '0.9rem', marginTop: '8px' }}>
                {couponError}
              </div>
            )}

            {appliedCoupon && (
              <div className="coupon-details">
                <div className="coupon-info">
                  <h4>✅ Coupon Applied: {appliedCoupon.code}</h4>
                  <div className="discount-breakdown">
                    <div className="price-line">
                      <span>Original Amount:</span>
                      <span>€{order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="price-line discount">
                      <span>Discount ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `€${appliedCoupon.value}`}):</span>
                      <span>-€{discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="price-line total">
                      <span>Final Amount:</span>
                      <span>€{finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{
                    background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginTop: '12px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Remove Coupon
                </button>
              </div>
            )}

            {!appliedCoupon && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="coupon-apply-btn"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: (!couponCode.trim() || couponLoading) ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    flex: 1
                  }}
                >
                  {couponLoading ? 'Applying...' : 'Apply Coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCouponCode('');
                    setCouponError('');
                    setAppliedCoupon(null);
                    setDiscountAmount(0);
                    setFinalAmount(order.totalAmount);
                  }}
                  className="no-coupon-btn"
                  style={{
                    background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                    color: '#4a5568',
                    border: '1px solid #e2e8f0',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    flex: 1,
                    fontWeight: '500'
                  }}
                >
                  No Coupon
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="pay-btn" disabled={loading}>
          {loading ? 'Processing...' : `Pay €${finalAmount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

const PaymentModal = ({ order, onPaySuccess, onCancel }) => {
  if (!order) return null;

  return (
    <div className="modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>Payment for Order #{order.orderNumber}</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            order={order}
            onPaySuccess={onPaySuccess}
            onCancel={onCancel}
          />
        </Elements>
      </div>
    </div>
  );
};

export default PaymentModal;