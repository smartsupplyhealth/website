const mongoose = require('mongoose');
const Order = require('../models/Order');
const ClientInventory = require('../models/ClientInventory');
const Product = require('../models/Product');
const Client = require('../models/Client');
const sendEmail = require('../utils/emailService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createAndPayAutoOrder = async (clientId) => {
  const validClientId = new mongoose.Types.ObjectId(clientId);

  const inventoryItems = await ClientInventory.find({ client: validClientId, 'autoOrder.enabled': true }).populate('product');

  const itemsToOrderRaw = inventoryItems.filter(item => item.currentStock <= item.reorderPoint && item.reorderQty > 0);

  if (itemsToOrderRaw.length === 0) {
    return { success: true, message: 'No items to reorder at this time.' };
  }

  const orderProducts = [];
  const adjustmentNotes = [];

  for (const item of itemsToOrderRaw) {
    const product = item.product;
    if (!product || product.stock <= 0) {
      continue; // Skip if product doesn't exist or is out of stock
    }

    let orderQty = item.reorderQty;
    if (orderQty > product.stock) {
      orderQty = product.stock; // Adjust quantity to available stock
      adjustmentNotes.push(`La quantité pour ${product.name} a été ajustée à ${orderQty} en raison du stock disponible.`);
    }

    orderProducts.push({
      product: product._id,
      quantity: orderQty,
      unitPrice: product.price,
      totalPrice: product.price * orderQty,
    });
  }

  if (orderProducts.length === 0) {
    return { success: true, message: 'No items to reorder as all eligible products are out of stock.' };
  }

  const totalAmount = orderProducts.reduce((sum, p) => sum + p.totalPrice, 0);

  const client = await Client.findById(validClientId);
  if (!client) {
    return { success: false, message: 'Client not found.' };
  }

  const deliveryAddress = {
    street: client.address || 'N/A',
    city: 'N/A',
    postalCode: 'N/A',
    country: 'N/A',
  };

  const order = new Order({
    orderNumber: 'CMD' + Date.now(),
    client: validClientId,
    items: orderProducts,
    totalAmount,
    deliveryAddress,
    notes: 'Commande automatique générée par le système.',
    // status will use the default 'pending' from the model
    paymentStatus: 'Pending',
  });

  await order.save();

  // Ensure order has an _id after saving
  if (!order._id) {
    return { success: false, message: 'Failed to create order.' };
  }

  // --- Stripe Payment Logic ---
  try {
    if (!client || !client.stripeCustomerId) {
      throw new Error('Client is not configured for Stripe payments.');
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: client.stripeCustomerId,
      type: 'card',
    });

    if (paymentMethods.data.length === 0) {
      throw new Error('No saved payment method found for this client.');
    }
    const paymentMethodId = paymentMethods.data[0].id;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'eur',
      customer: client.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: { orderId: order._id.toString() },
    });

    order.paymentStatus = 'Paid';
    order.paymentDetails = {
      method: 'stripe',
      transactionId: paymentIntent.id,
    };
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    if (client.email) {
      const productDetailsList = order.items.map(item => {
        const inventoryItem = inventoryItems.find(invItem => invItem.product && invItem.product._id && invItem.product._id.equals(item.product));
        const productName = inventoryItem && inventoryItem.product ? inventoryItem.product.name : 'Unknown Product';
        return `<li>${productName} (Quantité: ${item.quantity})</li>`;
      }).join('');

      const adjustmentHtml = adjustmentNotes.length > 0
        ? `<h3>Notes importantes :</h3><p>${adjustmentNotes.join('<br>')}</p>`
        : '';

      const emailHtml = `
        <h1>Bonjour ${client.name},</h1>
        <p>Votre commande automatique <strong>${order.orderNumber}</strong> a été créée et payée avec succès.</p>
        ${adjustmentHtml}
        <h3>Détails de la commande :</h3>
        <ul>
          ${productDetailsList}
        </ul>
        <p><strong>Montant total : ${order.totalAmount.toFixed(2)}€</strong></p>
        <p>Merci de votre confiance.</p>
      `;
      await sendEmail(client.email, 'Confirmation de votre commande automatique', emailHtml);
    }

    return { success: true, message: 'Automatic order created and paid successfully.', order };

  } catch (error) {
    console.error('Stripe automatic payment error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      orderId: order._id,
      clientId: validClientId
    });

    order.paymentStatus = 'Failed';
    order.notes += ` Automatic payment failed: ${error.message}`;
    await order.save();
    // Do not restock here, as the order was placed and stock was reserved.
    return { success: false, message: `Automatic order created, but payment failed: ${error.message}`, order };
  }
};

module.exports = { createAndPayAutoOrder };