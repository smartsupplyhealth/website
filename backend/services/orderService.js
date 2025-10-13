const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Génère un numéro de commande unique et robuste.
 * - Ne dépend plus de la base vide (évite les collisions après redémarrage du conteneur)
 * - Combine timestamp + nombre aléatoire pour garantir l’unicité
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6); // 6 derniers chiffres du timestamp
  const randomPart = Math.floor(100 + Math.random() * 900); // 3 chiffres aléatoires
  return `CMD-${timestamp}${randomPart}`;
};

/**
 * Crée une nouvelle commande pour un client.
 * @param {Object} orderData - Données de commande (clientId, produits, etc.)
 */
const createOrder = async (orderData) => {
  const { clientId, products, deliveryAddress, notes, totalAmount, paymentMethod } = orderData;

  // Vérifier le stock disponible pour chaque produit
  for (const item of products) {
    const productDoc = await Product.findById(item.product);
    if (!productDoc || productDoc.stock < item.quantity) {
      throw new Error(`Le produit ${productDoc?.name || item.product} est en rupture de stock ou n’existe pas.`);
    }
  }

  // Créer la commande avec un numéro unique
  const order = new Order({
    orderNumber: generateOrderNumber(),
    client: clientId,
    items: products.map(p => ({
      product: p.product,
      quantity: p.quantity,
      unitPrice: p.price,
      totalPrice: p.price * p.quantity,
    })),
    totalAmount,
    deliveryAddress,
    notes,
    mode: 'manuelle', // Commande manuelle par défaut
    status: 'pending',
    paymentStatus: 'Pending',
    paymentDetails: paymentMethod ? { method: paymentMethod } : null,
  });

  await order.save();

  console.log(`📦 Nouvelle commande ${order.orderNumber} créée avec succès`);

  return order;
};

/**
 * Récupère les commandes selon un filtre et des options de pagination
 */
const getOrders = async (filter, options) => {
  const orders = await Order.paginate(filter, options);
  return orders;
};

module.exports = { createOrder, getOrders };
