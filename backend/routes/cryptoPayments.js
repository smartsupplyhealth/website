const express = require('express');
const router = express.Router();
const cryptoPaymentController = require('../controllers/cryptoPaymentController');
const { auth } = require('../middleware/auth');

// @route   POST /api/crypto-payments/create/:orderId
// @desc    Create a crypto payment for an order
// @access  Private
router.post('/create/:orderId', auth, cryptoPaymentController.createCryptoPayment);

// @route   GET /api/crypto-payments/status/:orderId
// @desc    Get crypto payment status for an order
// @access  Private
router.get('/status/:orderId', auth, cryptoPaymentController.getCryptoPaymentStatus);

// @route   POST /api/crypto-payments/webhook
// @desc    Handle crypto payment webhooks
// @access  Public (webhook endpoint)
router.post('/webhook', cryptoPaymentController.handleCryptoWebhook);

// @route   GET /api/crypto-payments/supported-currencies
// @desc    Get list of supported cryptocurrencies
// @access  Public
router.get('/supported-currencies', cryptoPaymentController.getSupportedCryptocurrencies);

// @route   POST /api/crypto-payments/confirm/:orderId
// @desc    Manually confirm a crypto payment (for testing)
// @access  Private
router.post('/confirm/:orderId', auth, cryptoPaymentController.confirmCryptoPayment);

// @route   GET /api/crypto-payments/exchange-rates
// @desc    Get current exchange rates for cryptocurrencies
// @access  Public
router.get('/exchange-rates', cryptoPaymentController.getExchangeRates);

// @route   POST /api/crypto-payments/convert
// @desc    Convert EUR to cryptocurrency
// @access  Public
router.post('/convert', cryptoPaymentController.convertEurToCrypto);

module.exports = router;
