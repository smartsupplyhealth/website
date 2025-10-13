const mongoose = require('mongoose');
const Order = require('../models/Order');
const ClientInventory = require('../models/ClientInventory');
const Product = require('../models/Product');
const Client = require('../models/Client');
const sendEmail = require('../utils/emailService');
// Initialize Stripe only if the key is provided and valid
let stripe;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_key_here') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️  Stripe not initialized in paymentService: STRIPE_SECRET_KEY not provided or using placeholder value');
}

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
    if (!product) {
      continue; // Skip if product doesn't exist
    }

    let orderQty = item.reorderQty;
    let stockStatus = 'available';

    // Check if product is out of stock globally
    if (product.stock <= 0) {
      stockStatus = 'out_of_stock';
      adjustmentNotes.push(`⚠️ ${product.name} est en rupture de stock chez le fournisseur. La commande sera en attente de réapprovisionnement.`);
    } else if (orderQty > product.stock) {
      orderQty = product.stock; // Adjust quantity to available stock
      adjustmentNotes.push(`La quantité pour ${product.name} a été ajustée à ${orderQty} en raison du stock disponible.`);
    }

    orderProducts.push({
      product: product._id,
      quantity: orderQty,
      unitPrice: product.price,
      totalPrice: product.price * orderQty,
      stockStatus: stockStatus, // Track stock status
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

  // Vérifier que le client a une carte bancaire configurée pour les paiements automatiques
  if (!client.stripeCustomerId) {
    return { success: false, message: 'Client not configured for automatic payments. Please add a payment method first.' };
  }

  const deliveryAddress = {
    street: client.address || 'N/A',
    city: 'N/A',
    postalCode: 'N/A',
    country: 'N/A',
  };

  // Check if any items are out of stock
  const hasOutOfStockItems = orderProducts.some(item => item.stockStatus === 'out_of_stock');

  const order = new Order({
    orderNumber: 'CMD' + Date.now(),
    client: validClientId,
    items: orderProducts,
    totalAmount,
    deliveryAddress,
    notes: hasOutOfStockItems ?
      'Commande automatique générée par le système. ⚠️ Certains produits sont en rupture de stock chez le fournisseur.' :
      'Commande automatique générée par le système.',
    // status will use the default 'pending' from the model
    paymentStatus: hasOutOfStockItems ? 'PendingRestock' : 'Pending',
  });

  await order.save();

  // Ensure order has an _id after saving
  if (!order._id) {
    return { success: false, message: 'Failed to create order.' };
  }

  // If there are out of stock items, don't process payment immediately
  if (hasOutOfStockItems) {
    console.log(`📦 Order ${order.orderNumber} created but payment deferred due to out of stock items`);

    if (client.email) {
      const productDetailsList = order.items.map(item => {
        const inventoryItem = inventoryItems.find(invItem => invItem.product && invItem.product._id && invItem.product._id.equals(item.product));
        const productName = inventoryItem && inventoryItem.product ? inventoryItem.product.name : 'Unknown Product';
        const stockNote = item.stockStatus === 'out_of_stock' ? ' (En attente de réapprovisionnement)' : '';
        return `<li>${productName} (Quantité: ${item.quantity})${stockNote}</li>`;
      }).join('');

      const emailHtml = `
        <h1>Bonjour ${client.name},</h1>
        <p>Votre commande automatique <strong>${order.orderNumber}</strong> a été créée avec succès.</p>
        <p><strong>⚠️ Note importante :</strong> Certains produits sont en rupture de stock chez le fournisseur. Votre commande sera traitée dès que le stock sera réapprovisionné.</p>
        <h3>Détails de la commande :</h3>
        <ul>
          ${productDetailsList}
        </ul>
        <p><strong>Montant total : ${order.totalAmount.toFixed(2)}€</strong></p>
        <p><strong>Statut :</strong> En attente de réapprovisionnement</p>
        <p>Merci de votre compréhension.</p>
      `;
      await sendEmail(client.email, 'Commande automatique créée - En attente de réapprovisionnement', emailHtml);
    }

    return { success: true, message: 'Automatic order created but payment deferred due to out of stock items.', order };
  }

  // --- Stripe Payment Logic (only for items in stock) ---
  try {
    if (!client || !client.stripeCustomerId) {
      throw new Error('Client is not configured for Stripe payments.');
    }

    // Vérifier qu'il y a des cartes bancaires disponibles avant de créer la commande
    const availablePaymentMethods = await stripe.paymentMethods.list({
      customer: client.stripeCustomerId,
      type: 'card',
    });

    if (availablePaymentMethods.data.length === 0) {
      throw new Error('No credit card found for automatic payments. Please add a payment method first.');
    }

    const paymentMethods = availablePaymentMethods;

    // Trouver la carte bancaire par défaut ou la première carte disponible
    let paymentMethodId;
    const defaultCard = paymentMethods.data.find(pm => pm.metadata && pm.metadata.isDefault === 'true');

    if (defaultCard) {
      paymentMethodId = defaultCard.id;
      console.log(`💳 Using default card for automatic payment: ${defaultCard.card.brand} ****${defaultCard.card.last4}`);
    } else {
      // Utiliser la première carte bancaire disponible
      paymentMethodId = paymentMethods.data[0].id;
      console.log(`💳 Using first available card for automatic payment: ${paymentMethods.data[0].card.brand} ****${paymentMethods.data[0].card.last4}`);
    }

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
        <p>Votre commande automatique <strong>${order.orderNumber}</strong> a été créée et payée avec succès par carte bancaire.</p>
        ${adjustmentHtml}
        <h3>Détails de la commande :</h3>
        <ul>
          ${productDetailsList}
        </ul>
        <p><strong>Montant total : ${order.totalAmount.toFixed(2)}€</strong></p>
        <p><strong>Méthode de paiement :</strong> Carte bancaire (paiement automatique)</p>
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