const Order = require('../models/Order');
const Client = require('../models/Client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createAndPayAutoOrder } = require('../services/paymentService');

// --- MANUAL ORDER PAYMENT ---

exports.createPaymentIntent = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId).populate('client');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.client._id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (order.paymentStatus === 'Paid') return res.status(400).json({ message: 'Order is already paid' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'eur',
      customer: order.client.stripeCustomerId,
      receipt_email: order.client.email,
      metadata: { orderId: order._id.toString() },
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY 
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send('Server error');
  }
};

exports.updateOrderAfterPayment = async (req, res) => {
    const { orderId } = req.params;
    const { paymentIntentId } = req.body;
    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status === 'succeeded') {
            order.paymentStatus = 'Paid';
            order.status = 'confirmed';
            order.paymentDetails = { method: 'stripe', transactionId: paymentIntent.id };
            await order.save();
            res.json({ message: 'Payment successful and order updated', order });
        } else {
            order.paymentStatus = 'Failed';
            await order.save();
            res.status(400).json({ message: 'Payment not successful' });
        }
    } catch (error) {
        console.error('Error updating order after payment:', error);
        res.status(500).send('Server error');
    }
};

// --- AUTOMATIC ORDER PAYMENT ---

exports.createAutomaticOrderAndPay = async (req, res) => {
  try {
    const result = await createAndPayAutoOrder(req.user.id);
    if (result.success) res.json(result);
    else res.status(400).json(result);
  } catch (error) {
    console.error('Automatic order creation error:', error);
    res.status(500).send('Server error');
  }
};

// --- MANAGE PAYMENT METHODS ---

exports.createSetupIntent = async (req, res) => {
  try {
    const client = await Client.findById(req.user.id);
    if (!client || !client.stripeCustomerId) return res.status(400).json({ message: 'Stripe customer not found.' });

    const setupIntent = await stripe.setupIntents.create({
      customer: client.stripeCustomerId,
      payment_method_types: ['card'],
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).send('Server error');
  }
};

exports.getPaymentMethods = async (req, res) => {
    try {
        const client = await Client.findById(req.user.id);
        if (!client || !client.stripeCustomerId) return res.status(400).json({ message: 'Stripe customer not found.' });

        const paymentMethods = await stripe.paymentMethods.list({
            customer: client.stripeCustomerId,
            type: 'card',
        });

        res.json(paymentMethods.data.map(pm => ({
            id: pm.id,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
        })));
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).send('Server error');
    }
};

exports.detachPaymentMethod = async (req, res) => {
    const { paymentMethodId } = req.params;
    try {
        const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
        res.json({ success: true, message: 'Payment method detached successfully.', paymentMethod });
    } catch (error) {
        console.error('Error detaching payment method:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
