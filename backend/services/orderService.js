const Order = require('../models/Order');
const Product = require('../models/Product');

const generateOrderNumber = async () => {
  // Find the highest existing order number
  const lastOrder = await Order.findOne({}, {}, { sort: { orderNumber: -1 } });

  if (!lastOrder || !lastOrder.orderNumber) {
    return 'CMD-000001';
  }

  // Extract the number from the last order number
  const match = lastOrder.orderNumber.match(/CMD-(\d+)/);
  if (match) {
    const lastNumber = parseInt(match[1]);
    return `CMD-${String(lastNumber + 1).padStart(6, '0')}`;
  }

  // Fallback if no valid order number found
  return 'CMD-000001';
};

const createOrder = async (orderData) => {
  const { clientId, products, deliveryAddress, notes, totalAmount, paymentMethod } = orderData;

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
    // status will use the default 'pending' from the model
    paymentStatus: 'Pending',
    // Store the intended payment method
    paymentDetails: paymentMethod ? { method: paymentMethod } : null,
  });

  await order.save();

  // Note: Stock is NOT deducted here - it will be deducted only after payment confirmation
  // This prevents stock from being locked for unpaid orders
  console.log(`📦 Order ${order.orderNumber} created - stock will be deducted after payment confirmation`);

  return order;
};

const getOrders = async (filter, options) => {
  const orders = await Order.paginate(filter, options);
  return orders;
};

module.exports = { createOrder, getOrders };