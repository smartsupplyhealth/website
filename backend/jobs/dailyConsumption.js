const cron = require('node-cron');
const ClientInventory = require('../models/ClientInventory');
const { createAndPayAutoOrder } = require('../services/paymentService');
const mongoose = require('mongoose');
const Client = require('../models/Client');
const Order = require('../models/Order');
const sendEmail = require('../utils/emailService');

// Helper function to count orders by type for a client today
async function getOrderCountsByType(clientId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const orders = await Order.find({
    client: clientId,
    createdAt: { $gte: today, $lt: tomorrow }
  });

  let autoOrders = 0;
  let manualOrders = 0;

  orders.forEach(order => {
    // Auto orders: CMD{timestamp} (like CMD1758467520055)
    if (/^CMD\d{13}$/.test(order.orderNumber)) {
      autoOrders++;
    }
    // Manual orders: CMD-{6-digit-number} (like CMD-000010)
    else if (/^CMD-\d{6}$/.test(order.orderNumber)) {
      manualOrders++;
    }
  });

  return { autoOrders, manualOrders };
}

// Function to send security notification email
async function sendSecurityNotificationEmail(client) {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Notification de Sécurité</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2d3748; margin-top: 0;">Bonjour ${client.name},</h2>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">⚠️ Limite de Commandes Automatiques Atteinte</h3>
            <p style="color: #856404; margin-bottom: 0;">
              Vous avez atteint la limite de sécurité de <strong>2 commandes automatiques</strong> pour aujourd'hui.
            </p>
          </div>
          
          <div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1565c0; margin-top: 0;">🔐 Mesure de Sécurité Requise</h3>
            <p style="color: #1565c0; margin-bottom: 10px;">
              Pour des raisons de sécurité, vous devez effectuer <strong>au moins une commande manuelle</strong> 
              avant de pouvoir passer d'autres commandes automatiques.
            </p>
            <p style="color: #1565c0; margin-bottom: 0;">
              Cette mesure nous permet de vérifier votre identité et de protéger votre compte.
            </p>
          </div>
          
          <div style="background: #e8f5e8; border: 1px solid #a5d6a7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">✅ Prochaines Étapes</h3>
            <ol style="color: #2e7d32; padding-left: 20px;">
              <li>Connectez-vous à votre compte</li>
              <li>Placez une commande manuelle via le catalogue</li>
              <li>Une fois la commande manuelle confirmée, vous pourrez reprendre les commandes automatiques (max 2 par jour)</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client-dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Accéder à Mon Compte
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            Cette notification est envoyée automatiquement pour votre sécurité.<br>
            Si vous avez des questions, n'hésitez pas à nous contacter.
          </p>
        </div>
      </div>
    `;

    await sendEmail(client.email, '🔒 Notification de Sécurité - Limite de Commandes Automatiques', emailHtml);
    console.log(`Security notification email sent to client: ${client.name} (${client.email})`);
  } catch (error) {
    console.error(`Failed to send security notification email to client ${client.name}:`, error);
  }
}

// Function to send rejection email to client
async function sendRejectionEmail(client, reason) {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚫 Commande Automatique Rejetée</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2d3748; margin-top: 0;">Bonjour ${client.name},</h2>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">⚠️ Commande Automatique Rejetée</h3>
            <p style="color: #7f1d1d; margin-bottom: 0;">
              Votre commande automatique a été rejetée pour des raisons de sécurité.
            </p>
          </div>
          
          <div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1565c0; margin-top: 0;">🔐 Mesure de Sécurité</h3>
            <p style="color: #1565c0; margin-bottom: 10px;">
              <strong>Raison du rejet :</strong> ${reason}
            </p>
            <p style="color: #1565c0; margin-bottom: 0;">
              Cette mesure nous permet de vérifier votre identité et de protéger votre compte.
            </p>
          </div>
          
          <div style="background: #e8f5e8; border: 1px solid #a5d6a7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">✅ Prochaines Étapes</h3>
            <ol style="color: #2e7d32; padding-left: 20px;">
              <li>Connectez-vous à votre compte</li>
              <li>Placez <strong>une commande manuelle</strong> via le catalogue</li>
              <li>Une fois la commande manuelle confirmée, vous pourrez reprendre les commandes automatiques</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client-dashboard" 
               style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Accéder à Mon Compte
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">💡 Pourquoi cette mesure ?</h4>
            <p style="color: #856404; margin-bottom: 0; font-size: 14px;">
              Les commandes automatiques sont limitées à 2 par jour pour des raisons de sécurité. 
              Une commande manuelle nous permet de vérifier votre identité avant de réactiver les commandes automatiques.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            Cette notification est envoyée automatiquement pour votre sécurité.<br>
            Si vous avez des questions, n'hésitez pas à nous contacter.
          </p>
        </div>
      </div>
    `;

    await sendEmail(client.email, '🚫 Commande Automatique Rejetée - Mesure de Sécurité', emailHtml);
    console.log(`Rejection email sent to client: ${client.name} (${client.email})`);
  } catch (error) {
    console.error(`Failed to send rejection email to client ${client.name}:`, error);
  }
}

// Function to create a rejected order for display in orders list
async function createRejectedOrderForLimit(client, reason) {
  try {
    // Check if we already created a rejected order today for this reason
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingRejectedOrder = await Order.findOne({
      client: client._id,
      status: 'cancelled',
      notes: reason,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (existingRejectedOrder) {
      console.log(`Rejected order already exists for client ${client.name} today`);
      return;
    }

    const rejectedOrder = new Order({
      orderNumber: 'CMD' + Date.now() + '-REJECTED',
      client: client._id,
      items: [], // Empty items for rejected orders
      totalAmount: 0,
      deliveryAddress: {
        street: client.address || 'N/A',
        city: 'N/A',
        postalCode: 'N/A',
        country: 'N/A',
      },
      notes: reason,
      status: 'cancelled',
      paymentStatus: 'Failed',
      paymentDetails: {
        method: 'auto_rejection',
        reason: reason
      }
    });

    await rejectedOrder.save();
    console.log(`Rejected order created for client ${client.name}: ${reason}`);

    // Send rejection email to client
    await sendRejectionEmail(client, reason);
  } catch (error) {
    console.error(`Error creating rejected order for client ${client.name}:`, error);
  }
}

async function runAutoOrdersForClient(client) {
  console.log(`Checking auto-orders for client: ${client.name}`);
  try {
    // Check order limits for today
    const { autoOrders, manualOrders } = await getOrderCountsByType(client._id);
    
    console.log(`Client ${client.name} - Auto orders today: ${autoOrders}, Manual orders today: ${manualOrders}`);
    
    // Check if client has reached auto order limit (max 2)
    if (autoOrders >= 2) {
      console.log(`Client ${client.name} has reached the daily auto order limit (2). Current auto orders: ${autoOrders}`);
      
      // Send security notification if they have 2 auto orders and 0 manual orders
      if (autoOrders === 2 && manualOrders === 0) {
        await sendSecurityNotificationEmail(client);
      }
      
      // Create a rejected order to show the limit in the orders list
      await createRejectedOrderForLimit(client, 'Limite auto order atteinte (max 2/jour)');
      return;
    }
    
    // Check if client needs to place a manual order first
    // If they have 1 auto order and 0 manual orders, they need a manual order before the second auto order
    if (autoOrders === 1 && manualOrders === 0) {
      console.log(`Client ${client.name} needs to place a manual order before the second auto order.`);
      await sendSecurityNotificationEmail(client);
      
      // Create a rejected order to show the requirement
      await createRejectedOrderForLimit(client, 'Commande manuelle requise avant auto-commande');
      return;
    }

    const result = await createAndPayAutoOrder(client._id);
    if (result.order) {
      console.log(`Auto-order created for client ${client.name}, Order ID: ${result.order._id}, Success: ${result.success}`);
    } else {
      console.log(`No auto-order needed for client ${client.name}. Reason: ${result.message}`);
    }
  } catch (error) {
    console.error(`Error processing auto-order for client ${client._id}:`, error);
  }
}

function scheduleDailyConsumption() {
  // Schedule to run every day at 'min h' (server time)
  cron.schedule('44 15 * * *', async () => {
    console.log('Starting daily consumption and auto-order job...');
    try {
      // 1. Decrement stock based on daily usage for all inventories
      await ClientInventory.updateMany(
        { dailyUsage: { $gt: 0 } },
        [
          {
            $set: {
              currentStock: {
                $max: [0, { $subtract: ['$currentStock', '$dailyUsage'] }]
              },
              lastDecrementAt: new Date()
            }
          }
        ]
      );
      console.log('Daily consumption stock decremented.');

      // 2. Find all clients with items that have auto-ordering enabled
      const clientsWithAutoOrder = await ClientInventory.distinct('client', { 'autoOrder.enabled': true });

      // 3. Process auto-orders for each client
      for (const clientId of clientsWithAutoOrder) {
        const client = await Client.findById(clientId);
        if (client) {
          await runAutoOrdersForClient(client);
        }
      }

      console.log('Daily consumption and auto-order job finished.');
    } catch (e) {
      console.error('Error in daily consumption job:', e);
    }
  }, {
    timezone: 'Africa/Tunis' // Example timezone
  });
}

module.exports = { scheduleDailyConsumption };