const Order = require('../models/Order');
const Product = require('../models/Product');

const generateOrderNumber = async () => {
  const count = await Order.countDocuments();
  return `CMD-${String(count + 1).padStart(6, '0')}`;
};

const createOrder = async (orderData) => {
  const { clientId, products, deliveryAddress, notes, totalAmount } = orderData;

  // Validate product stock
  for (const item of products) {
    const productDoc = await Product.findById(item.product);
    if (!productDoc || productDoc.stock < item.quantity) {
      throw new Error(`Product ${productDoc?.name || item.product} is out of stock or does not exist.`);
    }
  }

  const order = new Order({
    orderNumber: await generateOrderNumber(),
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
    status: 'confirmed',
    paymentStatus: 'Pending',
  });

  await order.save();

  // Decrease stock for each product
  for (const item of products) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }
    });
  }

  return order;
};

const getOrders = async (filter, options) => {
  const orders = await Order.paginate(filter, options);
  return orders;
};

module.exports = { createOrder, getOrders };