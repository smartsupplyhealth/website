const Order = require('../models/Order');
const Product = require('../models/Product');
const ClientInventory = require('../models/ClientInventory');
const Coupon = require('../models/Coupon');
const orderService = require('../services/orderService');
const mongoose = require('mongoose');
const sendEmail = require('../utils/emailService');
const Client = require('../models/Client');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { products, deliveryAddress, notes, totalAmount } = req.body;
    const orderData = {
      clientId: req.user.id,
      products,
      deliveryAddress,
      notes,
      totalAmount,
    };
    const order = await orderService.createOrder(orderData);
    const client = await Client.findById(req.user.id);
    if (client && client.email) {
      const subject = `[SmartSupply Health] Confirmation de commande ${order.orderNumber} - €${order.totalAmount.toFixed(2)}`;

      // Format order items for email
      const orderItemsList = order.items.map(item =>
        `<tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.product?.name || 'Produit'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">€${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">€${item.totalPrice.toFixed(2)}</td>
        </tr>`
      ).join('');

      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
              🎉 Commande Confirmée
            </h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
              Votre commande a été placée avec succès
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0; line-height: 1.6;">
              Bonjour <strong>${client.name}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.6;">
              Nous avons bien reçu votre commande <strong style="color: #667eea;">${order.orderNumber}</strong> et nous la traitons actuellement.
            </p>
            
            <!-- Order Details -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                📋 Détails de la commande
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr style="background: #e2e8f0;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #2d3748;">Produit</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #2d3748;">Quantité</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748;">Prix unitaire</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsList}
                </tbody>
              </table>
              
              <div style="border-top: 2px solid #e2e8f0; margin-top: 15px; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 18px; font-weight: 700; color: #2d3748;">Total de la commande :</span>
                  <span style="font-size: 20px; font-weight: 700; color: #667eea;">€${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <!-- Next Steps -->
            <div style="background: #ebf8ff; border-left: 4px solid #3182ce; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h4 style="color: #2c5282; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                📬 Prochaines étapes
              </h4>
              <ul style="color: #2d3748; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Vous recevrez un email de confirmation de paiement</li>
                <li>Vous serez informé de tout changement de statut de votre commande</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #4a5568; margin: 25px 0 0 0; line-height: 1.6;">
              Merci pour votre confiance ! Nous nous efforçons de vous fournir le meilleur service possible.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #718096; font-size: 14px;">
              Cordialement,<br>
              <strong style="color: #2d3748;">L'équipe SmartSupply Health</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      `;

      await sendEmail(client.email, subject, html);
    }
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Get orders (for admin/supplier)
exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let filter = {};
    if (status) {
      filter.status = status;
    }
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'items.product', select: 'name' },
        { path: 'client', select: 'name email clinicName' }
      ]
    };
    const orders = await orderService.getOrders(filter, options);
    res.json({
      success: true,
      data: orders.docs,
      pagination: {
        totalItems: orders.totalDocs,
        totalPages: orders.totalPages,
        currentPage: orders.page,
        hasNext: orders.hasNextPage,
        hasPrev: orders.hasPrevPage,
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get orders for the currently logged-in client
exports.getMyOrders = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 10 } = req.query;
    let filter = { client: req.user.id }; // Automatically filter by the logged-in client's ID
    if (status) {
      filter.status = status;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'items.product', select: 'name' },
        { path: 'client', select: 'name email clinicName' }
      ]
    };
    const orders = await orderService.getOrders(filter, options);
    res.json({
      success: true,
      data: orders.docs,
      pagination: {
        totalItems: orders.totalDocs,
        totalPages: orders.totalPages,
        currentPage: orders.page,
        hasNext: orders.hasNextPage,
        hasPrev: orders.hasPrevPage,
      }
    });
  } catch (error) {
    console.error('Error fetching client-specific orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get a specific order by ID
exports.getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name description price')
      .populate('client', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'processing', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const order = await Order.findById(req.params.id)
      .populate('client', 'name email')
      .populate('items.product', 'name');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot change status of a delivered or cancelled order.' });
    }

    // --- LOGIQUE DE RESTOCKAGE ET REMBOURSEMENT LORS DE L'ANNULATION ---
    // Si le nouveau statut est "annulé" et que l'ancien statut était un statut où le stock était réservé
    if (status === 'cancelled' && ['confirmed', 'processing'].includes(order.status)) {
      for (const item of order.items) {
        // On remet la quantité commandée dans le stock du produit
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        console.log(`Stock pour le produit ${item.product._id} réapprovisionné de ${item.quantity}.`);
      }
    }
    // --- FIN DE LA LOGIQUE DE RESTOCKAGE ---

    order.status = status;
    await order.save();

    // Generate refund coupon if order is cancelled and was paid
    let couponCode = null;
    let refundAmount = 0;
    if (status === 'cancelled' && order.paymentStatus === 'Paid') {
      // Calculate refund amount (amount paid by card)
      if (order.paymentDetails?.method === 'stripe') {
        refundAmount = order.totalAmount;
      } else if (order.paymentDetails?.method === 'coupon_partial') {
        refundAmount = order.totalAmount - (order.coupon?.discountAmount || 0);
      }

      if (refundAmount > 0) {
        couponCode = `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Create coupon
        const coupon = new Coupon({
          code: couponCode,
          description: `Refund coupon for cancelled order ${order.orderNumber}`,
          type: 'fixed',
          value: refundAmount,
          minOrderAmount: 0,
          usageLimit: 1,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days validity
          isActive: true
        });

        await coupon.save();

        // Add coupon info to order notes
        order.notes = order.notes + `\n[CANCELLED] Refund coupon: ${couponCode}`;
        await order.save();
      }
    }

    if (status === 'delivered') {
      for (const item of order.items) {
        await ClientInventory.findOneAndUpdate(
          { client: order.client, product: item.product._id },
          { $inc: { currentStock: item.quantity } },
          { upsert: true, new: true }
        );
      }
    }

    if (order.client && order.client.email) {
      const productDetailsList = order.items.map(item =>
        `<li>${item.product.name} (Quantité: ${item.quantity})</li>`
      ).join('');

      let subject, html;

      if (status === 'cancelled' && couponCode) {
        subject = `[SmartSupply Health] Commande ${order.orderNumber} annulée - Coupon de remboursement €${refundAmount.toFixed(2)}`;

        // Format order items for email
        const orderItemsList = order.items.map(item =>
          `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.product?.name || 'Produit'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">€${item.unitPrice.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">€${item.totalPrice.toFixed(2)}</td>
          </tr>`
        ).join('');

        html = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                ❌ Commande Annulée
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Votre commande a été annulée - Coupon de remboursement généré
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0; line-height: 1.6;">
                Bonjour <strong>${order.client.name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.6;">
                Le statut de votre commande <strong style="color: #e53e3e;">${order.orderNumber}</strong> est maintenant : <strong style="color: #e53e3e;">cancelled</strong>.
              </p>
              
              <!-- Order Details -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                  📋 Détails de la commande
                </h3>
                
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                  <thead>
                    <tr style="background: #e2e8f0;">
                      <th style="padding: 12px; text-align: left; font-weight: 600; color: #2d3748;">Produit</th>
                      <th style="padding: 12px; text-align: center; font-weight: 600; color: #2d3748;">Quantité</th>
                      <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748;">Prix unitaire</th>
                      <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderItemsList}
                  </tbody>
                </table>
                
                <div style="border-top: 2px solid #e2e8f0; margin-top: 15px; padding-top: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 18px; font-weight: 700; color: #2d3748;">Total de la commande :</span>
                    <span style="font-size: 20px; font-weight: 700; color: #e53e3e;">€${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <!-- Refund Coupon Section -->
              <div style="background: #fef5e7; border: 2px solid #f6ad55; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #c05621; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                  🎟️ Coupon de Remboursement
                </h3>
                
                <div style="background: white; border-radius: 6px; padding: 15px; margin: 15px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: 600; color: #2d3748;">Montant de remboursement :</span>
                    <span style="font-size: 18px; font-weight: 700; color: #e53e3e;">€${refundAmount.toFixed(2)}</span>
                  </div>
                  
                  <div style="margin: 15px 0;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #2d3748;">Code Coupon :</p>
                    <div style="background: #f7fafc; border: 2px dashed #cbd5e0; border-radius: 6px; padding: 12px; text-align: center;">
                      <span style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #2d3748; letter-spacing: 1px;">${couponCode}</span>
                    </div>
                  </div>
                  
                  <div style="background: #ebf8ff; border-radius: 6px; padding: 12px; margin-top: 15px;">
                    <p style="margin: 0 0 5px 0; font-weight: 600; color: #2c5282;">📅 Validité :</p>
                    <p style="margin: 0; color: #2d3748;">30 jours à partir d'aujourd'hui</p>
                  </div>
                  
                  <div style="background: #f0fff4; border-radius: 6px; padding: 12px; margin-top: 10px;">
                    <p style="margin: 0 0 5px 0; font-weight: 600; color: #38a169;">💡 Comment utiliser :</p>
                    <p style="margin: 0; color: #2d3748;">Entrez ce code lors du checkout pour obtenir votre montant de remboursement en réduction.</p>
                  </div>
                </div>
              </div>
              
              <p style="font-size: 16px; color: #4a5568; margin: 25px 0 0 0; line-height: 1.6;">
                Merci pour votre compréhension. Nous nous excusons pour tout inconvénient causé.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 14px;">
                Cordialement,<br>
                <strong style="color: #2d3748;">L'équipe SmartSupply Health</strong>
              </p>
              <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        `;
      } else {
        subject = `[SmartSupply Health] Mise à jour commande ${order.orderNumber} - Statut: ${status}`;

        // Format order items for email
        const orderItemsList = order.items.map(item =>
          `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.product?.name || 'Produit'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">€${item.unitPrice.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">€${item.totalPrice.toFixed(2)}</td>
          </tr>`
        ).join('');

        // Status-specific content
        let statusInfo = '';
        let statusColor = '#667eea';
        let statusIcon = '📋';

        if (status === 'cancelled' || status === 'annulée') {
          statusInfo = 'Votre commande a été annulée.';
          statusColor = '#e53e3e';
          statusIcon = '❌';
        } else if (status === 'delivered' || status === 'livrée') {
          statusInfo = 'Votre commande a été livrée avec succès !';
          statusColor = '#38a169';
          statusIcon = '✅';
        } else {
          statusInfo = `Le statut de votre commande a été mis à jour : ${status}`;
        }

        html = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                ${statusIcon} Mise à jour de commande
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                ${statusInfo}
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0; line-height: 1.6;">
                Bonjour <strong>${order.client.name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.6;">
                Le statut de votre commande <strong style="color: ${statusColor};">${order.orderNumber}</strong> est maintenant : <strong style="color: ${statusColor};">${status}</strong>.
              </p>
              
              <!-- Order Details -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                  📋 Détails de la commande
                </h3>
                
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                  <thead>
                    <tr style="background: #e2e8f0;">
                      <th style="padding: 12px; text-align: left; font-weight: 600; color: #2d3748;">Produit</th>
                      <th style="padding: 12px; text-align: center; font-weight: 600; color: #2d3748;">Quantité</th>
                      <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748;">Prix unitaire</th>
                      <th style="padding: 12px; text-align: right; font-weight: 600; color: #2d3748;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderItemsList}
                  </tbody>
                </table>
                
                <div style="border-top: 2px solid #e2e8f0; margin-top: 15px; padding-top: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 18px; font-weight: 700; color: #2d3748;">Total de la commande :</span>
                    <span style="font-size: 20px; font-weight: 700; color: ${statusColor};">€${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <p style="font-size: 16px; color: #4a5568; margin: 25px 0 0 0; line-height: 1.6;">
                Merci pour votre confiance ! Nous nous efforçons de vous fournir le meilleur service possible.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 14px;">
                Cordialement,<br>
                <strong style="color: #2d3748;">L'équipe SmartSupply Health</strong>
              </p>
              <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        `;
      }

      await sendEmail(order.client.email, subject, html);
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel an order and generate coupon
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id).populate('client');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.client._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    // Calculate refund amount (amount paid by card)
    let refundAmount = 0;
    if (order.paymentStatus === 'Paid' && order.paymentDetails?.method === 'stripe') {
      // For stripe payments, refund the total amount paid
      refundAmount = order.totalAmount;
    } else if (order.paymentDetails?.method === 'coupon_partial') {
      // For partial payments, refund only the card portion
      refundAmount = order.totalAmount - (order.coupon?.discountAmount || 0);
    }

    // Generate coupon code if there's a refund amount
    let couponCode = null;
    if (refundAmount > 0) {
      couponCode = `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create coupon
      const coupon = new Coupon({
        code: couponCode,
        description: `Refund coupon for cancelled order ${order.orderNumber}`,
        type: 'fixed',
        value: refundAmount,
        minOrderAmount: 0,
        usageLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days validity
        isActive: true
      });

      await coupon.save();
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    // Update order status
    order.status = 'cancelled';
    order.notes = order.notes + `\n[CANCELLED] Reason: ${reason || 'No reason provided'}`;
    if (couponCode) {
      order.notes += `\nRefund coupon: ${couponCode}`;
    }
    await order.save();

    // Send email with coupon code
    if (order.client.email) {
      let subject, html;

      if (couponCode) {
        subject = `[SmartSupply Health] Order ${order.orderNumber} Cancelled - Refund Coupon €${refundAmount.toFixed(2)}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e53e3e;">Order Cancelled</h2>
              <p>Bonjour ${order.client.name},</p>
              <p>Le statut de votre commande ${order.orderNumber} est maintenant : <strong>cancelled</strong>.</p>
              <p><strong>Détails de la commande :</strong></p>
              <ul>
                ${order.items.map(item => `<li>${item.product?.name || 'Produit'} (Quantité: ${item.quantity})</li>`).join('')}
              </ul>
              <p><strong>Montant de remboursement :</strong> €${refundAmount.toFixed(2)}</p>
              <p><strong>Code Coupon de Remboursement :</strong> <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold;">${couponCode}</span></p>
              <p><strong>Validité du Coupon :</strong> 30 jours à partir d'aujourd'hui</p>
              <p><strong>Comment utiliser :</strong> Entrez ce code lors du checkout pour obtenir votre montant de remboursement en réduction.</p>
              <p>Merci pour votre patience !</p>
              <p>Cordialement,<br>Équipe SmartSupply Health</p>
          </div>
        `;
      } else {
        subject = `[SmartSupply Health] Order ${order.orderNumber} Cancelled`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e53e3e;">Order Cancelled</h2>
              <p>Bonjour ${order.client.name},</p>
              <p>Le statut de votre commande ${order.orderNumber} est maintenant : <strong>cancelled</strong>.</p>
              <p><strong>Détails de la commande :</strong></p>
              <ul>
                ${order.items.map(item => `<li>${item.product?.name || 'Produit'} (Quantité: ${item.quantity})</li>`).join('')}
              </ul>
              <p>Merci pour votre patience !</p>
              <p>Cordialement,<br>Équipe SmartSupply Health</p>
          </div>
        `;
      }

      await sendEmail(order.client.email, subject, html);
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      couponCode: couponCode
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get clients for a supplier
exports.getSupplierClients = async (req, res) => {
  try {
    const supplierProducts = await Product.find({ supplier: req.user.id }).select('_id');
    const productIds = supplierProducts.map(p => p._id);
    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('client', 'name email phone clinicName');
    const clients = orders.reduce((acc, order) => {
      const client = order.client;
      if (client && !acc.some(c => c._id.equals(client._id))) {
        acc.push(client);
      }
      return acc;
    }, []);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching supplier clients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get products previously ordered by a client
exports.getMyOrderedProducts = async (req, res) => {
  try {
    const orders = await Order.find({ client: req.user.id }).populate('items.product');
    const products = orders
      .flatMap(order => order.items.map(item => item.product))
      .filter((product, index, self) =>
        product && self.findIndex(p => p._id.equals(product._id)) === index
      );
    res.json(products);
  } catch (error) {
    console.error('Error fetching ordered products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
