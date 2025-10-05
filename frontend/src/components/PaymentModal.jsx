import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CardPaymentModal from './CardPaymentModal';
import CryptoPaymentModal from './CryptoPaymentModal';
import '../style/PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, order, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Initialize finalAmount when order changes
  useEffect(() => {
    if (order?.totalAmount) {
      setFinalAmount(order.totalAmount);
    }
  }, [order]);

  // Log coupon state changes
  useEffect(() => {
    console.log('PaymentModal coupon state changed:', {
      appliedCoupon,
      discountAmount,
      finalAmount
    });
  }, [appliedCoupon, discountAmount, finalAmount]);

  if (!isOpen || !order) return null;

  const handleClose = () => {
    // Reset coupon state when closing
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setFinalAmount(order?.totalAmount || 0);
    setCouponCode('');
    setCouponError('');
    onClose();
  };


  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      console.log('Applying coupon - Full order object:', order);
      console.log('Applying coupon - Order items:', order?.items);
      console.log('Applying coupon - Product IDs:', order.items?.map(item => item.product) || []);
      console.log('Applying coupon - Order amount:', order?.totalAmount || 0);

      const response = await api.post('/coupons/validate', {
        code: couponCode,
        orderAmount: order?.totalAmount || 0,
        productIds: order.items?.map(item => item.product) || []
      });

      console.log('Coupon response - Full data:', response.data);
      console.log('Coupon response - Success:', response.data.success);
      console.log('Coupon response - Coupon object:', response.data.coupon);
      console.log('Coupon response - Discount amount from coupon:', response.data.coupon?.discountAmount, 'Type:', typeof response.data.coupon?.discountAmount);
      console.log('Coupon response - Final amount from coupon:', response.data.coupon?.finalAmount, 'Type:', typeof response.data.coupon?.finalAmount);

      if (response.data.success) {
        console.log('Setting coupon data:', {
          coupon: response.data.coupon,
          discountAmount: response.data.coupon?.discountAmount,
          finalAmount: response.data.coupon?.finalAmount
        });

        // Ensure we have valid numbers and proper validation
        const discount = parseFloat(response.data.coupon?.discountAmount || 0);
        const final = parseFloat(response.data.coupon?.finalAmount || 0);
        const originalAmount = order?.totalAmount || 0;

        console.log('Parsed values:', {
          discount,
          final,
          originalAmount,
          isValidDiscount: !isNaN(discount) && discount > 0,
          isValidFinal: !isNaN(final) && final > 0
        });

        // Validate the coupon data
        if (isNaN(discount) || discount < 0) {
          setCouponError('Invalid discount amount received from server');
          return;
        }

        if (isNaN(final) || final < 0) {
          setCouponError('Invalid final amount received from server');
          return;
        }

        if (final > originalAmount) {
          setCouponError('Final amount cannot be greater than original amount');
          return;
        }

        // Additional validation: ensure discount makes sense
        if (discount > originalAmount) {
          setCouponError('Discount cannot be greater than original amount');
          return;
        }

        setAppliedCoupon(response.data.coupon);
        setDiscountAmount(discount);
        setFinalAmount(final);
        setCouponError('');
        console.log('State updated - discountAmount:', discount, 'finalAmount:', final);
      } else {
        setCouponError(response.data.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Coupon error:', error);
      console.error('Error response:', error.response?.data);
      setCouponError(error.response?.data?.message || 'Error applying coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setFinalAmount(order?.totalAmount || 0);
    setCouponCode('');
    setCouponError('');
  };

  return (
    <div className="modal-overlay">
      <div className="payment-modal">
        {/* 1. HEADER SECTION */}
        <div className="payment-modal-header">
          <h2>Payment for Order #{order?.orderNumber || 'Unknown'}</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {/* 2. COUPON SECTION */}
        <div className="coupon-section">
          <h4>🎟️ DO YOU HAVE A COUPON?</h4>
          <p>Enter a coupon code to get a discount on your order</p>
          <div className="coupon-input-group">
            <input
              type="text"
              placeholder="ENTER COUPON CODE"
              className="coupon-input"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />
            <button
              className="apply-coupon-btn"
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
            >
              {couponLoading ? 'Applying...' : 'Apply Coupon'}
            </button>
            <button
              className="no-coupon-btn"
              onClick={handleRemoveCoupon}
            >
              No Coupon
            </button>
          </div>
          {couponError && (
            <div className="coupon-error" style={{ color: '#e53e3e', fontSize: '0.9rem', marginTop: '8px' }}>
              {couponError}
            </div>
          )}
          {appliedCoupon && (
            <div className="coupon-details">
              <div className="coupon-info">
                <span className="coupon-code">✅ {appliedCoupon.code}</span>
                <span className="coupon-description">{appliedCoupon.description}</span>
              </div>
              <div className="discount-info">
                <span className="discount-amount">-€{discountAmount.toFixed(2)}</span>
                <span className="final-amount">Final: €{finalAmount.toFixed(2)}</span>
                {/* Debug info */}
                <div style={{ fontSize: '10px', color: '#666' }}>
                  Debug: discountAmount={discountAmount}, finalAmount={finalAmount}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. PAYMENT METHOD SELECTION */}
        <div className="payment-method-section">
          <h3>Choisir le mode de paiement</h3>
          <div className="payment-method-options">
            <div
              className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="payment-icon">💳</div>
              <div className="payment-info">
                <h4>Carte bancaire</h4>
                <p>Payer avec Visa, Mastercard ou autres cartes</p>
              </div>
            </div>

            <div
              className={`payment-option ${paymentMethod === 'crypto' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('crypto')}
            >
              <div className="payment-icon">₿</div>
              <div className="payment-info">
                <h4>Cryptomonnaie</h4>
                <p>Payer avec Bitcoin, Ethereum et autres crypto</p>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT METHOD SELECTION ONLY - NO CONTENT BELOW */}

        {/* FOOTER BUTTONS */}
        <div className="payment-modal-footer">
          <button className="cancel-btn" onClick={handleClose}>
            Annuler
          </button>
          <button
            className="pay-btn"
            onClick={() => {
              if (paymentMethod === 'card') {
                setShowCardModal(true);
              } else if (paymentMethod === 'crypto') {
                setShowCryptoModal(true);
              }
            }}
          >
            Continuer
          </button>
        </div>
      </div>

      {/* Payment Modals */}
      <CardPaymentModal
        isOpen={showCardModal}
        onClose={() => {
          setShowCardModal(false);
          // Don't reset coupon data when closing card modal
        }}
        order={order}
        appliedCoupon={appliedCoupon}
        discountAmount={discountAmount}
        finalAmount={finalAmount}
        onSuccess={() => {
          setShowCardModal(false);
          onPaymentSuccess();
        }}
      />

      {showCryptoModal && (
        <CryptoPaymentModal
          isOpen={showCryptoModal}
          order={order}
          onPaySuccess={() => {
            setShowCryptoModal(false);
            onPaymentSuccess();
          }}
          onCancel={() => setShowCryptoModal(false)}
        />
      )}
    </div>
  );
};

export default PaymentModal;