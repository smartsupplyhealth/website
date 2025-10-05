const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');
const ClientModel = require('../models/Client');

// Direct Wallet Payment Configuration
const BITCOIN_ADDRESS = process.env.BITCOIN_ADDRESS || '3LZ6CiRFgDf5ZBV5foKsSkJGb5DNewDM5K';
const ETHEREUM_ADDRESS = process.env.ETHEREUM_ADDRESS || '0x4cB49Ca44b3baD82Dc0B475648956294A2dCb4e4';
const SOLANA_ADDRESS = process.env.SOLANA_ADDRESS || 'GV9gRBRJPP9Y7ePDt8whYyDaYvoJErkiQtqFw8mncWXy';
const BLOCKCHAIN_API_KEY = process.env.BLOCKCHAIN_API_KEY; // For blockchain monitoring

// --- CRYPTO PAYMENT METHODS ---

exports.createCryptoPayment = async (req, res) => {
    const { orderId } = req.params;
    const { amount, cryptocurrency } = req.body;

    try {
        const order = await Order.findById(orderId).populate('client');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.client._id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        if (order.paymentStatus === 'Paid') return res.status(400).json({ message: 'Order is already paid' });

        // Use provided amount or fallback to order total
        const paymentAmount = amount || order.totalAmount;
        const selectedCrypto = cryptocurrency || 'BTC';

        console.log('Creating direct crypto payment with amount:', paymentAmount, 'cryptocurrency:', selectedCrypto);

        // Get wallet address based on selected cryptocurrency
        let walletAddress;
        let cryptoAmount;

        if (selectedCrypto === 'BTC') {
            walletAddress = BITCOIN_ADDRESS;
            // For demo purposes, we'll use a fixed BTC amount
            // In production, you'd get real-time exchange rates
            cryptoAmount = (paymentAmount / 50000).toFixed(8); // Approximate BTC amount
        } else if (selectedCrypto === 'ETH') {
            walletAddress = ETHEREUM_ADDRESS;
            // For demo purposes, we'll use a fixed ETH amount
            cryptoAmount = (paymentAmount / 3000).toFixed(6); // Approximate ETH amount
        } else if (selectedCrypto === 'SOL') {
            walletAddress = SOLANA_ADDRESS;
            // For demo purposes, we'll use a fixed SOL amount
            cryptoAmount = (paymentAmount / 100).toFixed(4); // Approximate SOL amount
        } else {
            return res.status(400).json({ message: 'Unsupported cryptocurrency' });
        }

        // Generate unique payment reference
        const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Generate expiration time
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Update order with crypto payment details
        order.paymentDetails = {
            method: 'crypto',
            paymentReference: paymentReference,
            status: 'pending',
            amount: paymentAmount,
            currency: 'EUR',
            cryptocurrency: selectedCrypto,
            cryptoAmount: cryptoAmount,
            walletAddress: walletAddress,
            provider: 'direct_wallet',
            expiresAt: expiresAt.toISOString()
        };
        await order.save();

        // Generate QR code data
        const qrData = `${selectedCrypto}:${walletAddress}?amount=${cryptoAmount}&label=Order ${order.orderNumber}`;

        res.json({
            success: true,
            paymentReference: paymentReference,
            walletAddress: walletAddress,
            cryptoAmount: cryptoAmount,
            cryptocurrency: selectedCrypto,
            qrData: qrData,
            amount: paymentAmount,
            currency: 'EUR',
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Error creating crypto payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getCryptoPaymentStatus = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId).populate('client');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.client._id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        if (!order.paymentDetails || order.paymentDetails.method !== 'crypto') {
            return res.status(400).json({ message: 'No crypto payment found for this order' });
        }

        // For direct wallet payments, we'll check if payment has been received
        // In a real implementation, you'd check the blockchain for incoming transactions
        const paymentDetails = order.paymentDetails;

        // For demo purposes, we'll simulate payment checking
        // In production, you'd integrate with blockchain APIs like BlockCypher, Infura, etc.
        let status = paymentDetails.status;
        let paymentStatus = order.paymentStatus;
        let orderStatus = order.status;

        // Check if payment has expired (30 minutes)
        const now = new Date();
        const expiresAt = new Date(paymentDetails.expiresAt || 0);
        if (now > expiresAt && status === 'pending') {
            status = 'expired';
            paymentStatus = 'Failed';
            orderStatus = 'cancelled';
        }

        // In a real implementation, you would:
        // 1. Check blockchain for incoming transactions to the wallet address
        // 2. Verify the transaction amount matches the expected cryptoAmount
        // 3. Confirm the transaction has enough confirmations
        // 4. Update the order status accordingly

        // Update order if status changed
        if (paymentStatus !== order.paymentStatus) {
            order.paymentStatus = paymentStatus;
            order.status = orderStatus;
            order.paymentDetails.status = status;
            await order.save();
        }

        res.json({
            success: true,
            status: status,
            paymentStatus: paymentStatus,
            orderStatus: orderStatus,
            amount: paymentDetails.amount,
            currency: paymentDetails.currency,
            cryptocurrency: paymentDetails.cryptocurrency,
            cryptoAmount: paymentDetails.cryptoAmount,
            walletAddress: paymentDetails.walletAddress,
            expiresAt: paymentDetails.expiresAt
        });

    } catch (error) {
        console.error('Error getting crypto payment status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.handleCryptoWebhook = async (req, res) => {
    // For direct wallet payments, webhooks would come from blockchain monitoring services
    // This is a placeholder for future blockchain integration
    try {
        const event = req.body;
        console.log('Direct wallet payment webhook received:', event);

        // In a real implementation, this would handle blockchain transaction confirmations
        // For now, we'll just acknowledge the webhook
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing crypto webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

exports.getSupportedCryptocurrencies = async (req, res) => {
    try {
        // Return list of supported cryptocurrencies for direct wallet payments
        const supportedCrypto = [
            {
                symbol: 'BTC',
                name: 'Bitcoin',
                icon: '₿',
                description: 'Bitcoin - Digital Gold',
                address: BITCOIN_ADDRESS
            },
            {
                symbol: 'ETH',
                name: 'Ethereum',
                icon: 'Ξ',
                description: 'Ethereum - Smart Contract Platform',
                address: ETHEREUM_ADDRESS
            },
            {
                symbol: 'SOL',
                name: 'Solana',
                icon: '◎',
                description: 'Solana - High Performance Blockchain',
                address: SOLANA_ADDRESS
            }
        ];

        res.json({
            success: true,
            cryptocurrencies: supportedCrypto
        });
    } catch (error) {
        console.error('Error getting supported cryptocurrencies:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
