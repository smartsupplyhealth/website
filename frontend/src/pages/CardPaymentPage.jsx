import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../style/CardPaymentPage.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CardPaymentPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadOrder = useCallback(async () => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            if (response.data.success) {
                setOrder(response.data.order);
            } else {
                alert('Order not found');
                navigate('/client-dashboard/orders');
            }
        } catch (error) {
            console.error('Error loading order:', error);
            alert('Error loading order');
            navigate('/client-dashboard/orders');
        } finally {
            setLoading(false);
        }
    }, [orderId, navigate]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">⏳</div>
                <p>Loading order details...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="error-container">
                <h2>Order not found</h2>
                <button onClick={() => navigate('/client-dashboard/orders')}>
                    Back to Orders
                </button>
            </div>
        );
    }

    return (
        <div className="card-payment-page">
            <div className="payment-container">
                <div className="payment-header">
                    <h1>💳 Card Payment</h1>
                    <p>Order #{order.orderNumber}</p>
                </div>

                <div className="order-summary">
                    <h3>Order Summary</h3>
                    <div className="order-details">
                        <p><strong>Total Amount:</strong> €{order.totalAmount}</p>
                        <p><strong>Delivery Address:</strong> {order.deliveryAddress?.street}</p>
                        {order.notes && (
                            <p><strong>Notes:</strong> {order.notes}</p>
                        )}
                    </div>
                </div>

                <Elements stripe={stripePromise}>
                    <CardPaymentForm
                        order={order}
                        onSuccess={() => navigate('/client-dashboard/orders')}
                        onCancel={() => navigate('/client-dashboard/orders')}
                    />
                </Elements>
            </div>
        </div>
    );
};

const CardPaymentForm = ({ order, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [savedCards, setSavedCards] = useState([]);
    const [isCardFormVisible, setIsCardFormVisible] = useState(false);

    useEffect(() => {
        loadSavedCards();
    }, []);

    const loadSavedCards = async () => {
        try {
            const response = await api.get('/api/payment-methods');
            if (response.data.success) {
                setSavedCards(response.data.paymentMethods || []);
            }
        } catch (error) {
            console.error('Error loading saved cards:', error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(`/payments/create-payment-intent/${order._id}`, {
                amount: order.totalAmount * 100,
                paymentMethod: 'card'
            });

            const { clientSecret } = response.data;

            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                },
                return_url: window.location.origin + '/client-dashboard/orders'
            });

            if (error) {
                console.error('Payment failed:', error);
                alert('❌ Payment failed: ' + error.message + '\n\nPlease check your card details and try again.');
            } else if (paymentIntent.status === 'succeeded') {
                // Update order status after successful payment
                try {
                    await api.post(`/payments/update-order-payment-status/${order._id}`, {
                        paymentIntentId: paymentIntent.id
                    });
                    console.log('Order status updated successfully');
                } catch (updateError) {
                    console.error('Error updating order status:', updateError);
                    // Still show success to user even if order update fails
                }

                alert('🎉 Payment completed successfully! Your order is now confirmed and being processed.');
                onSuccess();
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('❌ Payment error: ' + error.message + '\n\nPlease try again or contact support if the problem persists.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-form-container">
            <h3>Payment Details</h3>

            {savedCards.length > 0 && !isCardFormVisible && (
                <div className="saved-cards-section">
                    <h4>Pay with a saved card</h4>
                    {savedCards.map((card) => (
                        <div key={card._id} className="saved-card">
                            <div className="card-info">
                                <span className="card-brand">{card.brand}</span>
                                <span className="card-last4">**** **** **** {card.last4}</span>
                                <span className="card-expiry">{card.expMonth}/{card.expYear}</span>
                            </div>
                            <button className="use-card-btn">Use This Card</button>
                        </div>
                    ))}
                    <button
                        className="new-card-btn"
                        onClick={() => setIsCardFormVisible(true)}
                    >
                        Use a new card
                    </button>
                </div>
            )}

            {(isCardFormVisible || savedCards.length === 0) && (
                <form onSubmit={handleSubmit} className="card-form">
                    <div className="card-holder-container">
                        <label>Card Holder Name</label>
                        <input
                            type="text"
                            placeholder="Enter card holder name"
                            required
                        />
                    </div>
                    <div className="card-element-container">
                        <label>Card Details</label>
                        <CardElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#424770',
                                        '::placeholder': {
                                            color: '#aab7c4',
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!stripe || loading}
                            className="submit-payment-btn"
                        >
                            {loading ? 'Processing...' : `Pay €${order.totalAmount}`}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CardPaymentPage;