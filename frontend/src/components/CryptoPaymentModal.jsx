import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../style/CryptoPaymentModal.css';

const CryptoPaymentModal = ({ isOpen, order, onPaySuccess, onCancel }) => {
    // All hooks must be called before any conditional returns
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [cryptoPayment, setCryptoPayment] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('pending');
    const [supportedCrypto, setSupportedCrypto] = useState([]);
    const [selectedCrypto, setSelectedCrypto] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [finalAmount, setFinalAmount] = useState(order?.totalAmount || 0);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const qrCodeGenerated = useRef(false);
    const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('CryptoPaymentModal mounted');
        fetchSupportedCryptocurrencies();

        // Cleanup function
        return () => {
            console.log('CryptoPaymentModal unmounting');
            qrCodeGenerated.current = false;
        };
    }, []);

    // Generate QR code when cryptoPayment changes
    useEffect(() => {
        if (cryptoPayment && cryptoPayment.walletAddress && cryptoPayment.cryptoAmount && cryptoPayment.cryptocurrency && !qrCodeGenerated.current) {
            generateQRCode(
                cryptoPayment.walletAddress,
                cryptoPayment.cryptoAmount,
                cryptoPayment.cryptocurrency
            );
            qrCodeGenerated.current = true;
        }
    }, [cryptoPayment]);

    // Don't render if not open
    if (!isOpen) {
        return null;
    }

    // Safety check for order prop - moved after ALL hooks
    if (!order) {
        return (
            <div className="crypto-payment-modal">
                <div className="crypto-payment-content">
                    <div className="crypto-payment-header">
                        <h2>🪙 Paiement crypto</h2>
                        <button className="close-btn" onClick={onCancel}>×</button>
                    </div>
                    <div className="crypto-payment-body">
                        <p>Erreur : Informations de commande non disponibles.</p>
                        <button className="cancel-btn" onClick={onCancel}>Fermer</button>
                    </div>
                </div>
            </div>
        );
    }

    const fetchSupportedCryptocurrencies = async () => {
        try {
            const response = await api.get('/crypto-payments/supported-currencies');
            if (response.data.success) {
                setSupportedCrypto(response.data.cryptocurrencies);
                if (response.data.cryptocurrencies.length > 0) {
                    setSelectedCrypto(response.data.cryptocurrencies[0].symbol);
                }
            }
        } catch (error) {
            console.error('Error fetching supported cryptocurrencies:', error);
        }
    };

    const generateQRCode = async (walletAddress, cryptoAmount, cryptocurrency) => {
        try {
            console.log('Generating QR code for:', { walletAddress, cryptoAmount, cryptocurrency });

            // Validate inputs
            if (!walletAddress || !cryptoAmount || !cryptocurrency) {
                console.error('Missing required parameters for QR code generation');
                setQrCodeDataUrl('');
                return;
            }

            // Create QR code data based on cryptocurrency type
            let qrData;
            const cryptoType = cryptocurrency.toString().toUpperCase();

            if (cryptoType === 'BTC') {
                qrData = `bitcoin:${walletAddress}?amount=${cryptoAmount}&label=Order ${order?.orderNumber || 'Unknown'}`;
            } else if (cryptoType === 'ETH') {
                qrData = `ethereum:${walletAddress}?value=${cryptoAmount}&label=Order ${order?.orderNumber || 'Unknown'}`;
            } else if (cryptoType === 'SOL') {
                qrData = `solana:${walletAddress}?amount=${cryptoAmount}&label=Order ${order?.orderNumber || 'Unknown'}`;
            } else {
                qrData = `${walletAddress}`;
            }

            console.log('QR data generated:', qrData);

            const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            console.log('QR code generated successfully');
            setQrCodeDataUrl(qrCodeDataUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
            setQrCodeDataUrl('');
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError('');

        try {
            const response = await api.post('/coupons/validate', {
                code: couponCode.trim(),
                orderAmount: order.totalAmount,
                productIds: order.items?.map(item => item.product) || []
            });

            if (response.data.success) {
                setAppliedCoupon(response.data.coupon);
                setDiscountAmount(response.data.coupon?.discountAmount || 0);
                setFinalAmount(response.data.coupon?.finalAmount || order.totalAmount);
                setCouponError('');
            } else {
                setCouponError(response.data.message || 'Code de coupon invalide');
            }
        } catch (error) {
            console.error('Error applying coupon:', error);
            setCouponError(error.response?.data?.message || 'Erreur lors de l\'application du coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleCreateCryptoPayment = async () => {
        setLoading(true);
        setErrorMessage('');

        try {
            const response = await api.post(`/crypto-payments/create/${order?._id}`, {
                amount: finalAmount,
                cryptocurrency: selectedCrypto
            });

            if (response.data.success) {
                console.log('Crypto payment created successfully:', response.data);

                // Reset QR code generation flag for new payment
                qrCodeGenerated.current = false;
                setQrCodeDataUrl('');

                setCryptoPayment(response.data);
                setPaymentStatus('pending');

                // Start polling for payment status
                startPaymentStatusPolling(response.data.paymentReference);
            } else {
                console.log('Crypto payment creation failed:', response.data);
                setErrorMessage(response.data.message || 'Échec de la création du paiement crypto');
            }
        } catch (error) {
            console.error('Error creating crypto payment:', error);
            setErrorMessage(error.response?.data?.message || 'Erreur lors de la création du paiement crypto');
        } finally {
            setLoading(false);
        }
    };

    const startPaymentStatusPolling = (paymentId) => {
        console.log('Starting payment status polling for payment:', paymentId);

        const pollInterval = setInterval(async () => {
            try {
                console.log('Polling payment status...');
                const response = await api.get(`/crypto-payments/status/${order?._id}`);
                if (response.data.success) {
                    const status = response.data.status;
                    console.log('Payment status received:', status);

                    // Only update status if it has actually changed
                    setPaymentStatus(prevStatus => {
                        if (prevStatus !== status) {
                            console.log('Status changed from', prevStatus, 'to', status);
                            return status;
                        }
                        return prevStatus;
                    });

                    if (status === 'completed') {
                        console.log('Payment completed, closing modal');
                        clearInterval(pollInterval);
                        onPaySuccess();
                    } else if (status === 'expired' || status === 'cancelled') {
                        console.log('Payment expired or cancelled');
                        clearInterval(pollInterval);
                        setErrorMessage('Le paiement a expiré ou a été annulé');
                    }
                } else {
                    console.log('Payment status check failed:', response.data);
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        }, 30000); // Poll every 30 seconds

        // Clear interval after 30 minutes
        setTimeout(() => {
            console.log('Payment polling timeout after 30 minutes');
            clearInterval(pollInterval);
        }, 30 * 60 * 1000);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    if (cryptoPayment) {
        return (
            <div className="crypto-payment-modal">
                <div className="crypto-payment-content">
                    <div className="crypto-payment-header">
                        <h2>🪙 Paiement crypto</h2>
                        <button className="close-btn" onClick={onCancel}>×</button>
                    </div>

                    <div className="crypto-payment-body">
                        <div className="payment-info">
                            <h3>Commande : {order?.orderNumber || 'Inconnue'}</h3>
                            <p className="amount">Montant : {formatPrice(finalAmount)}</p>
                            <p className="status">Statut : <span className={`status-${paymentStatus?.toLowerCase() || 'pending'}`}>{paymentStatus || 'En attente'}</span></p>
                        </div>

                        {paymentStatus === 'pending' && (
                            <div className="crypto-payment-instructions">
                                <h4>Finaliser votre paiement</h4>
                                <div className="wallet-payment-info">
                                    <div className="crypto-amount">
                                        <strong>Envoyez exactement :</strong> {cryptoPayment.cryptoAmount} {cryptoPayment.cryptocurrency}
                                    </div>
                                    <div className="wallet-address">
                                        <strong>À l'adresse :</strong>
                                        <div className="address-container">
                                            <code className="wallet-address-code">{cryptoPayment.walletAddress}</code>
                                            <button
                                                className="copy-btn"
                                                onClick={() => navigator.clipboard.writeText(cryptoPayment.walletAddress)}
                                            >
                                                📋 Copier
                                            </button>
                                        </div>
                                    </div>
                                    <div className="qr-code-section">
                                        <h5>Ou scannez le code QR :</h5>
                                        <div className="qr-code-placeholder">
                                            {qrCodeDataUrl ? (
                                                <img
                                                    src={qrCodeDataUrl}
                                                    alt={`QR Code for ${cryptoPayment?.cryptocurrency || 'crypto'} payment`}
                                                    className="qr-code-image"
                                                />
                                            ) : (
                                                <div className="qr-code">
                                                    <div className="qr-placeholder">
                                                        Génération du code QR...
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="expiry-info">
                                    ⏰ Le paiement expire à : {new Date(cryptoPayment.expiresAt).toLocaleString()}
                                </p>

                                {/* New Button in the Space */}
                                <div className="payment-action-section">
                                    <button
                                        className="payment-action-btn"
                                        onClick={() => {
                                            console.log('Payment action button clicked');
                                            // Add your custom action here
                                        }}
                                    >
                                        🔄 Actualiser le statut du paiement
                                    </button>
                                </div>

                                <p className="payment-note">
                                    <strong>Important :</strong> Envoyez le montant exact indiqué ci-dessus. Les paiements avec des montants incorrects ne seront pas traités.
                                </p>

                                {/* Confirmation Message */}
                                {showConfirmationMessage && (
                                    <div className="confirmation-message">
                                        <div className="confirmation-icon">📞</div>
                                        <h4>Confirmation de paiement</h4>
                                        <p>Le support technique va vous contacter pour confirmer le paiement.</p>
                                        <p className="confirmation-note">
                                            Vous pouvez continuer à utiliser l'application normalement.
                                            Notre équipe vous contactera bientôt.
                                        </p>
                                        <button
                                            className="close-confirmation-btn"
                                            onClick={async () => {
                                                console.log('Fermer clicked, redirecting directly...');
                                                setShowConfirmationMessage(false);

                                                try {
                                                    // Confirm both payment and order status
                                                    console.log('Confirming payment and order...');
                                                    const token = localStorage.getItem('token');
                                                    if (order?._id) {
                                                        // Use the same API endpoint as PaymentModal
                                                        const updateData = {
                                                            paymentStatus: 'Paid',
                                                            status: 'confirmed',
                                                            paymentMethod: 'crypto',
                                                            paymentId: cryptoPayment?._id || 'crypto-payment',
                                                            coupon: appliedCoupon,
                                                            discountAmount: discountAmount,
                                                            finalAmount: finalAmount
                                                        };

                                                        await api.post(`/payments/update-order-payment-status/${order._id}`, updateData, {
                                                            headers: { Authorization: `Bearer ${token}` }
                                                        });
                                                        console.log('Order and payment confirmed successfully');
                                                    }

                                                    // Clear cart (panier)
                                                    console.log('Clearing cart...');
                                                    // Add cart clearing logic here if needed

                                                    // Redirect directly to orders URL
                                                    console.log('Redirecting to orders page...');
                                                    window.location.href = 'http://localhost:3000/client-dashboard/orders';
                                                } catch (error) {
                                                    console.error('Error confirming order:', error);
                                                    // Still redirect even if there's an error
                                                    window.location.href = 'http://localhost:3000/client-dashboard/orders';
                                                }
                                            }}
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                )}

                            </div>
                        )}

                        {paymentStatus === 'completed' && (
                            <div className="payment-success">
                                <h4>✅ Paiement réussi !</h4>
                                <p>Votre paiement {cryptoPayment.cryptocurrency} a été confirmé !</p>
                                <button className="success-btn" onClick={onPaySuccess}>
                                    Continuer
                                </button>
                            </div>
                        )}

                        {paymentStatus === 'expired' && (
                            <div className="payment-expired">
                                <h4>⏰ Paiement expiré</h4>
                                <p>La fenêtre de paiement a expiré. Veuillez réessayer.</p>
                                <button className="retry-btn" onClick={() => setCryptoPayment(null)}>
                                    Réessayer
                                </button>
                            </div>
                        )}

                        <div className="crypto-payment-footer">
                            <button className="cancel-btn" onClick={onCancel}>
                                Annuler
                            </button>
                            <button
                                className="confirm-payment-btn"
                                onClick={() => {
                                    console.log('Confirm payment clicked, showing support message immediately');
                                    // Show support message immediately
                                    setShowConfirmationMessage(true);
                                }}
                            >
                                ✅ Confirmer paiement
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="crypto-payment-modal">
                <div className="crypto-payment-content">
                    <div className="crypto-payment-header">
                        <h2>🪙 Paiement crypto</h2>
                        <button className="close-btn" onClick={onCancel}>×</button>
                    </div>

                    <div className="crypto-payment-body">
                        <div className="order-summary">
                            <h3>Récapitulatif de la commande</h3>
                            <p><strong>Commande :</strong> {order?.orderNumber || 'Inconnue'}</p>
                            <p><strong>Montant initial :</strong> {formatPrice(order?.totalAmount || 0)}</p>

                            {appliedCoupon && (
                                <div className="coupon-applied">
                                    <p><strong>Coupon appliqué :</strong> {appliedCoupon.code}</p>
                                    <p><strong>Remise :</strong> -{formatPrice(discountAmount)}</p>
                                </div>
                            )}

                            <p className="final-amount"><strong>Montant final :</strong> {formatPrice(finalAmount)}</p>
                        </div>

                        <div className="coupon-section">
                            <h4>Appliquer un coupon (Facultatif)</h4>
                            <div className="coupon-input">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder="Saisir le code du coupon"
                                    disabled={couponLoading}
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={couponLoading || !couponCode.trim()}
                                    className="apply-coupon-btn"
                                >
                                    {couponLoading ? 'Application...' : 'Appliquer'}
                                </button>
                            </div>
                            {couponError && <p className="coupon-error">{couponError}</p>}
                        </div>

                        <div className="crypto-selection">
                            <h4>Sélectionner la cryptomonnaie</h4>
                            <div className="crypto-options">
                                {supportedCrypto.map((crypto) => (
                                    <div
                                        key={crypto.symbol}
                                        className={`crypto-option ${selectedCrypto === crypto.symbol ? 'selected' : ''}`}
                                        onClick={() => setSelectedCrypto(crypto.symbol)}
                                    >
                                        <span className="crypto-icon">{crypto.icon}</span>
                                        <div className="crypto-info">
                                            <span className="crypto-name">{crypto.name}</span>
                                            <span className="crypto-symbol">{crypto.symbol}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {errorMessage && <p className="error-message">{errorMessage}</p>}

                        <div className="crypto-payment-footer">
                            <button className="cancel-btn" onClick={onCancel}>
                                Annuler
                            </button>
                            <button
                                className="create-payment-btn"
                                onClick={handleCreateCryptoPayment}
                                disabled={loading || !selectedCrypto}
                            >
                                {loading ? 'Création du paiement...' : 'Créer le paiement crypto'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CryptoPaymentModal;
