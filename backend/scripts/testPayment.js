const mongoose = require('mongoose');
require('dotenv').config();

const Client = require('../models/Client');
const Order = require('../models/Order');

// Initialize Stripe
let stripe;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_key_here') {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.error('Stripe not initialized: STRIPE_SECRET_KEY not provided');
    process.exit(1);
}

async function testPayment() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a client with stripeCustomerId
        const client = await Client.findOne({
            stripeCustomerId: { $exists: true, $ne: null }
        });

        if (!client) {
            console.log('❌ No client found with Stripe customer ID');
            return;
        }

        console.log(`✅ Found client: ${client.name} (${client.email})`);
        console.log(`   Stripe Customer ID: ${client.stripeCustomerId}`);

        // Find an unpaid order for this client
        const order = await Order.findOne({
            client: client._id,
            paymentStatus: { $ne: 'Paid' }
        });

        if (!order) {
            console.log('❌ No unpaid orders found for this client');
            return;
        }

        console.log(`✅ Found order: ${order.orderNumber} (Amount: €${order.totalAmount})`);

        // Test creating a payment intent
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(order.totalAmount * 100),
                currency: 'eur',
                customer: client.stripeCustomerId,
                receipt_email: client.email,
                metadata: { orderId: order._id.toString() },
            });

            console.log(`✅ Payment intent created successfully:`);
            console.log(`   ID: ${paymentIntent.id}`);
            console.log(`   Status: ${paymentIntent.status}`);
            console.log(`   Amount: €${paymentIntent.amount / 100}`);
            console.log(`   Client Secret: ${paymentIntent.client_secret.substring(0, 20)}...`);

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

testPayment();
