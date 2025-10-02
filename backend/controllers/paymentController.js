const Order = require('../models/Order');
const Client = require('../models/Client');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const PaymentMethod = require('../models/PaymentMethod');
// Initialize Stripe only if the key is provided and valid
let stripe;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_key_here') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️  Stripe not initialized in paymentController: STRIPE_SECRET_KEY not provided or using placeholder value');
}
const { createAndPayAutoOrder } = require('../services/paymentService');
const sendEmail = require('../utils/emailService');

// --- MANUAL ORDER PAYMENT ---

exports.createPaymentIntent = async (req, res) => {
  const { orderId } = req.params;
  const { amount } = req.body;
  try {
    const order = await Order.findById(orderId).populate('client');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.client._id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (order.paymentStatus === 'Paid') return res.status(400).json({ message: 'Order is already paid' });

    // Use provided amount or fallback to order total
    const paymentAmount = amount || order.totalAmount;
    console.log('Creating payment intent with amount:', paymentAmount, 'original order amount:', order.totalAmount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentAmount * 100),
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
  const { paymentIntentId, coupon, discountAmount, finalAmount } = req.body;

  console.log(`[Backend] updateOrderAfterPayment called for orderId: ${orderId}, paymentIntentId: ${paymentIntentId}`);

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.error(`[Backend] Order not found for ID: ${orderId}`);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`[Backend] Found order:`, {
      orderId: order._id,
      clientId: order.client,
      userId: req.user.id,
      paymentStatus: order.paymentStatus
    });

    if (order.client.toString() !== req.user.id) {
      console.error(`[Backend] Unauthorized access attempt for order: ${orderId}`);
      return res.status(403).json({ message: 'Not authorized' });
    }

    console.log(`[Backend] Retrieving payment intent: ${paymentIntentId}`);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`[Backend] Payment intent status: ${paymentIntent.status}`);

    if (paymentIntent.status === 'succeeded') {
      // Save original amount if not already saved (for card-only payments)
      if (!order.originalAmount) {
        order.originalAmount = order.totalAmount;
      }

      // Save coupon information if provided
      if (coupon && discountAmount && finalAmount) {
        order.coupon = {
          code: coupon.code,
          discountAmount: discountAmount,
          couponId: coupon.id || null,
          originalAmount: order.totalAmount,
          finalAmount: finalAmount
        };
        order.totalAmount = finalAmount; // Update total amount to final amount
      }

      order.paymentStatus = 'Paid';
      order.status = 'confirmed';
      order.paymentDetails = { method: 'stripe', transactionId: paymentIntent.id };

      console.log(`[Backend] Updating order with new status:`, {
        paymentStatus: order.paymentStatus,
        status: order.status,
        paymentDetails: order.paymentDetails
      });

      await order.save();
      console.log(`[Backend] Order updated successfully`);

      res.json({ message: 'Payment successful and order updated', order });
    } else {
      console.log(`[Backend] Payment not successful, status: ${paymentIntent.status}`);
      order.paymentStatus = 'Failed';
      await order.save();
      res.status(400).json({ message: 'Payment not successful' });
    }
  } catch (error) {
    console.error('[Backend] Error updating order after payment:', error);
    console.error('[Backend] Full error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      message: 'Server error during order update',
      error: error.message
    });
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
    const clientId = req.user.id;

    // Fetch payment methods from our local database
    const paymentMethods = await PaymentMethod.find({
      client: clientId,
      isActive: true
    }).sort({ isDefault: -1, createdAt: -1 }); // Default cards first, then by creation date

    res.json(paymentMethods.map(pm => ({
      id: pm._id,
      brand: pm.cardType,
      last4: pm.last4,
      exp_month: pm.expiryMonth,
      exp_year: pm.expiryYear,
      isDefault: pm.isDefault,
      cardholderName: pm.cardholderName
    })));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).send('Server error');
  }
};

exports.detachPaymentMethod = async (req, res) => {
  const { paymentMethodId } = req.params;
  try {
    const clientId = req.user.id;
    console.log('🗑️ Deleting payment method:', paymentMethodId, 'for client:', clientId);

    // Find the payment method in our local database
    const localPaymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      client: clientId,
      isActive: true
    });

    if (!localPaymentMethod) {
      console.log('❌ Payment method not found in local database');
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    console.log('✅ Found payment method:', localPaymentMethod.stripePaymentMethodId);

    // Detach from Stripe
    try {
      await stripe.paymentMethods.detach(localPaymentMethod.stripePaymentMethodId);
      console.log('✅ Successfully detached from Stripe');
    } catch (stripeError) {
      console.log('⚠️ Stripe detach failed, but continuing with local deletion:', stripeError.message);
      // Continue with local deletion even if Stripe detach fails
    }

    // Mark as inactive in our local database
    localPaymentMethod.isActive = false;
    await localPaymentMethod.save();
    console.log('✅ Marked as inactive in local database');

    res.json({ success: true, message: 'Payment method detached successfully.' });
  } catch (error) {
    console.error('❌ Error detaching payment method:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// --- UPDATE PAYMENT METHOD ---
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const { cardholderName, expiryMonth, expiryYear, cvv } = req.body;
    const clientId = req.user.id;

    // Find the payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      client: clientId,
      isActive: true
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // CVV validation removed - Stripe handles all validation

    // Update the payment method
    if (cardholderName) paymentMethod.cardholderName = cardholderName;
    if (expiryMonth) paymentMethod.expiryMonth = parseInt(expiryMonth);
    if (expiryYear) paymentMethod.expiryYear = parseInt(expiryYear);

    await paymentMethod.save();

    res.json({
      success: true,
      message: 'Payment method updated successfully',
      paymentMethod: {
        id: paymentMethod._id,
        cardType: paymentMethod.cardType,
        last4: paymentMethod.last4,
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        cardholderName: paymentMethod.cardholderName,
        displayName: paymentMethod.getDisplayName()
      }
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// --- SET DEFAULT PAYMENT METHOD ---
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const clientId = req.user.id;

    // Find the payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      client: clientId,
      isActive: true
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Remove default status from all other payment methods for this client
    await PaymentMethod.updateMany(
      { client: clientId, isActive: true },
      { isDefault: false }
    );

    // Set this payment method as default
    paymentMethod.isDefault = true;
    await paymentMethod.save();

    res.json({
      success: true,
      message: 'Default payment method updated successfully',
      paymentMethod: {
        id: paymentMethod._id,
        cardType: paymentMethod.cardType,
        last4: paymentMethod.last4,
        displayName: paymentMethod.getDisplayName()
      }
    });

  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// --- SAVE PAYMENT METHOD ---
exports.savePaymentMethod = async (req, res) => {
  try {
    const { stripePaymentMethodId, cardholderName } = req.body;
    const clientId = req.user.id;

    // Get payment method details from Stripe
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId);

    if (!stripePaymentMethod || stripePaymentMethod.type !== 'card') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Extract card details
    const card = stripePaymentMethod.card;
    const cardType = ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay'].includes(card.brand.toLowerCase())
      ? card.brand.toLowerCase()
      : 'unknown';
    const last4 = card.last4;
    const expiryMonth = card.exp_month;
    const expiryYear = card.exp_year;

    // Check if this payment method already exists
    const existingPaymentMethod = await PaymentMethod.findOne({
      stripePaymentMethodId: stripePaymentMethodId,
      client: clientId
    });

    if (existingPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'This payment method is already saved'
      });
    }

    // Check if this is the first card for this client
    const existingCardsCount = await PaymentMethod.countDocuments({
      client: clientId,
      isActive: true
    });

    // Create new payment method
    const newPaymentMethod = new PaymentMethod({
      client: clientId,
      stripePaymentMethodId: stripePaymentMethodId,
      cardType: cardType,
      last4: last4,
      expiryMonth: expiryMonth,
      expiryYear: expiryYear,
      cardholderName: cardholderName || 'Card Holder',
      cvv: '000', // We don't store real CVV, just a placeholder
      isDefault: existingCardsCount === 0, // First card is automatically default
      isActive: true
    });

    await newPaymentMethod.save();

    res.json({
      success: true,
      message: 'Payment method saved successfully',
      paymentMethod: {
        id: newPaymentMethod._id,
        cardType: newPaymentMethod.cardType,
        last4: newPaymentMethod.last4,
        expiryMonth: newPaymentMethod.expiryMonth,
        expiryYear: newPaymentMethod.expiryYear,
        cardholderName: newPaymentMethod.cardholderName,
        displayName: newPaymentMethod.getDisplayName()
      }
    });

  } catch (error) {
    console.error('Error saving payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// --- CVV VALIDATION ---
// CVV validation removed - Stripe handles all validation during payment processing

// --- APPLY COUPON ---
exports.applyCoupon = async (req, res) => {
  const { orderId } = req.params;
  const { couponCode } = req.body;

  console.log('Apply coupon request:', { orderId, couponCode });

  try {
    const order = await Order.findById(orderId).populate('client');
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.client._id.toString() !== req.user.id) {
      console.log('Not authorized:', order.client._id, req.user.id);
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.paymentStatus === 'Paid') {
      console.log('Order already paid');
      return res.status(400).json({ message: 'Order is already paid' });
    }

    console.log('Order found:', {
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      items: order.items.length
    });

    // Find and validate coupon
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase().trim(),
      isActive: true
    });

    console.log('Coupon search result:', coupon ? 'Found' : 'Not found');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Get product IDs for coupon validation
    const productIds = order.items.map(item => item.product.toString());
    console.log('Product IDs for validation:', productIds);

    // Check if coupon can be used
    const canBeUsed = coupon.canBeUsed(order.totalAmount, productIds);
    console.log('Can coupon be used:', canBeUsed);

    if (!canBeUsed) {
      let message = 'Coupon cannot be used';
      if (order.totalAmount < coupon.minOrderAmount) {
        message = `Minimum order amount of €${coupon.minOrderAmount} required`;
      } else if (coupon.usedCount >= coupon.usageLimit) {
        message = 'Coupon usage limit exceeded';
      } else if (coupon.validUntil < new Date()) {
        message = 'Coupon has expired';
      } else if (coupon.validFrom > new Date()) {
        message = 'Coupon is not yet valid';
      }

      console.log('Coupon validation failed:', message);
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(order.totalAmount);
    const finalAmount = order.totalAmount - discountAmount;

    console.log('Coupon applied successfully:', {
      discountAmount,
      finalAmount,
      couponCode: coupon.code
    });

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description
      },
      discountAmount: discountAmount,
      finalAmount: finalAmount
    });

  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// --- COUPON PAYMENT ---

exports.processCouponPayment = async (req, res) => {
  const { orderId } = req.params;
  const { couponCode } = req.body;

  try {
    const order = await Order.findById(orderId).populate('client');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.client._id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (order.paymentStatus === 'Paid') return res.status(400).json({ message: 'Order is already paid' });

    // Find and validate coupon
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase().trim(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Get product IDs for coupon validation
    const productIds = order.items.map(item => item.product.toString());

    // Check if coupon can be used
    const canBeUsed = coupon.canBeUsed(order.totalAmount, productIds);
    if (!canBeUsed) {
      let message = 'Coupon cannot be used';
      if (order.totalAmount < coupon.minOrderAmount) {
        message = `Minimum order amount of €${coupon.minOrderAmount} required`;
      } else if (coupon.usedCount >= coupon.usageLimit) {
        message = 'Coupon usage limit exceeded';
      } else if (coupon.validUntil < new Date()) {
        message = 'Coupon has expired';
      } else if (coupon.validFrom > new Date()) {
        message = 'Coupon is not yet valid';
      }

      return res.status(400).json({
        success: false,
        message
      });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(order.totalAmount);
    const finalAmount = order.totalAmount - discountAmount;

    // Check if coupon is partially used (coupon value > order amount)
    const remainingCouponValue = coupon.value - discountAmount;
    let remainingCoupon = null;

    if (remainingCouponValue > 0) {
      // Create new coupon with remaining value
      const remainingCouponCode = `PARTIAL_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      remainingCoupon = new Coupon({
        code: remainingCouponCode,
        description: `Remaining value from coupon ${coupon.code}`,
        type: coupon.type,
        value: remainingCouponValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        usageLimit: 1,
        validFrom: new Date(),
        validUntil: coupon.validUntil, // Same validity as original
        isActive: true
      });

      await remainingCoupon.save();

      // Send email with remaining coupon
      if (order.client.email) {
        const subject = `[SmartSupply Health] Nouveau coupon généré - Commande ${order.orderNumber}`;
        const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #38a169;">Partial Coupon Usage</h2>
                        <p>Dear ${order.client.name},</p>
                        <p>Your coupon <strong>${coupon.code}</strong> was partially used for order <strong>${order.orderNumber}</strong>.</p>
                        <p><strong>Used Amount:</strong> €${discountAmount.toFixed(2)}</p>
                        <p><strong>Remaining Amount:</strong> €${remainingCouponValue.toFixed(2)}</p>
                        <p><strong>New Coupon Code:</strong> <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold;">${remainingCouponCode}</span></p>
                        <p><strong>Validity:</strong> Until ${new Date(coupon.validUntil).toLocaleDateString()}</p>
                        <p>You can use this new coupon code for your next purchase.</p>
                        <p>Best regards,<br>SmartSupply Health Team</p>
                    </div>
                `;
        await sendEmail(order.client.email, subject, html);
      }
    }

    // Update order with coupon details
    order.originalAmount = order.totalAmount;
    order.totalAmount = finalAmount;
    order.finalAmount = finalAmount;
    order.coupon = {
      code: coupon.code,
      discountAmount: discountAmount,
      couponId: coupon._id
    };

    // Only mark as paid if final amount is zero or less (full coupon discount)
    if (finalAmount <= 0) {
      order.paymentStatus = 'Paid';
      order.paymentDetails = {
        method: 'coupon',
        transactionId: `COUPON_${Date.now()}_${coupon.code}`
      };
    } else {
      // Partial coupon discount - order still needs payment
      order.paymentStatus = 'Pending';
      order.paymentDetails = {
        method: 'coupon_partial',
        transactionId: `COUPON_PARTIAL_${Date.now()}_${coupon.code}`
      };
    }

    // Mark original coupon as used
    coupon.usedCount += 1;
    await coupon.save();

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    await order.save();

    const message = finalAmount <= 0
      ? 'Payment processed successfully with coupon - Order fully paid!'
      : `Coupon applied successfully! €${discountAmount.toFixed(2)} discount applied. Remaining amount: €${finalAmount.toFixed(2)}`;

    res.json({
      success: true,
      message: message,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        originalAmount: order.originalAmount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        couponCode: coupon.code,
        paymentStatus: order.paymentStatus
      },
      remainingCoupon: remainingCoupon ? {
        code: remainingCoupon.code,
        value: remainingCoupon.value,
        validUntil: remainingCoupon.validUntil
      } : null
    });

  } catch (error) {
    console.error('Error processing coupon payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
