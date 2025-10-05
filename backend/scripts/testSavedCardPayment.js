const mongoose = require('mongoose');
require('dotenv').config();

const Client = require('../models/Client');
const Order = require('../models/Order');
const PaymentMethod = require('../models/PaymentMethod');

// Initialize Stripe
let stripe;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_key_here') {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.error('Stripe not initialized: STRIPE_SECRET_KEY not provided');
    process.exit(1);
}

async function testSavedCardPayment() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a client with saved cards
        const client = await Client.findOne({
            stripeCustomerId: { $exists: true, $ne: null }
        });

        if (!client) {
            console.log('❌ No client found with Stripe customer ID');
            return;
        }

        console.log(`✅ Found client: ${client.name} (${client.email})`);
        console.log(`   Stripe Customer ID: ${client.stripeCustomerId}`);

        // Get saved payment methods
        const paymentMethods = await PaymentMethod.find({
            client: client._id,
            isActive: true
        });

        if (paymentMethods.length === 0) {
            console.log('❌ No saved payment methods found');
            return;
        }

        const savedCard = paymentMethods[0];
        console.log(`✅ Found saved card: ${savedCard.cardType.toUpperCase()} ending in ${savedCard.last4}`);
        console.log(`   Stripe Payment Method ID: ${savedCard.stripePaymentMethodId}`);

        // Find an unpaid order
        const order = await Order.findOne({
            client: client._id,
            paymentStatus: { $ne: 'Paid' }
        });

        if (!order) {
            console.log('❌ No unpaid orders found');
            return;
        }

        console.log(`✅ Found order: ${order.orderNumber} (Amount: €${order.totalAmount})`);

        // Test creating a payment intent with customer
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(order.totalAmount * 100),
                currency: 'eur',
                customer: client.stripeCustomerId,
                receipt_email: client.email,
                metadata: {
                    orderId: order._id.toString(),
                    clientId: client._id.toString()
                },
                setup_future_usage: 'off_session',
            });

            console.log(`✅ Payment intent created:`);
            console.log(`   ID: ${paymentIntent.id}`);
            console.log(`   Status: ${paymentIntent.status}`);
            console.log(`   Customer: ${paymentIntent.customer}`);
            console.log(`   Amount: €${paymentIntent.amount / 100}`);

            // Test confirming with saved payment method
            try {
                const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
                    payment_method: savedCard.stripePaymentMethodId,
                    return_url: 'https://example.com/return',
                });

                console.log(`✅ Payment confirmed successfully:`);
                console.log(`   Status: ${confirmedPaymentIntent.status}`);
                console.log(`   Payment Method: ${confirmedPaymentIntent.payment_method}`);

            } catch (confirmError) {
                console.error('❌ Payment confirmation failed:', confirmError.message);
                console.error('   Error code:', confirmError.code);
                console.error('   Error type:', confirmError.type);
            }

        } catch (stripeError) {
            console.error('❌ Stripe error:', stripeError.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testSavedCardPayment();
