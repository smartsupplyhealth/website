// server.js
const dotenv = require('dotenv');
dotenv.config(); // <- This will automatically look for a .env file in the current directory

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const orderRoutes = require('./routes/order');
const recommendationRoutes = require('./routes/recommendations');
const scrapingRoutes = require('./routes/scraping');
const clientInventoryRoutes = require('./routes/clientInventory');
const paymentRoutes = require('./routes/payment');
const supplierRoutes = require('./routes/supplier');
const chatbotRoutes = require('./routes/chatbot'); // <-- AJOUTER CETTE LIGNE
const statisticsRoutes = require('./routes/statisticsRoutes');
const webhookRoutes = require('./routes/webhook');
const couponRoutes = require('./routes/coupons');
const notificationRoutes = require('./routes/notifications');
const cryptoPaymentRoutes = require('./routes/cryptoPayments');
const stockReleaseRoutes = require('./routes/stockRelease');
const errorHandler = require('./middleware/errorHandler');
const stockReleaseService = require('./services/stockReleaseService');

// Error handler (doit être APRES les routes)
const connectDB = require('./config/db');
//const { scheduleDailyConsumption } = require('./jobs/dailyConsumption');

// Connexion à la base de données
connectDB().then(() => {
  // Démarrer le service de libération de stock seulement après la connexion MongoDB
  // stockReleaseService.start(); // TEMPORAIREMENT DÉSACTIVÉ POUR TESTER LES EMAILS

  // Démarrer le job de consommation quotidienne et commandes automatiques
  /*scheduleDailyConsumption();
  console.log('🔄 Job de consommation quotidienne et commandes automatiques démarré');*/

  const app = express();

  /* ------------------------ 1) CORE MIDDLEWARES ------------------------ */
  // Configuration CORS pour permettre les requêtes depuis le frontend
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:80'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json()); // <- une seule fois et AVANT les routes
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  /* ------------------------ 2) ROUTES PUBLIQUES ------------------------ */
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Auth en premier (login/register)
  app.use('/api/auth', authRoutes);

  // API n8n pour l'automatisation
  app.use('/api/n8n', require('./routes/n8n'));

  /* ------------------------ 3) ROUTES MÉTIER --------------------------- */
  // Produits, commandes, recommandations
  app.use('/api/products', productsRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/recommendations', recommendationRoutes);

  // Scraping (expose /api/scrape/:productId et /api/simulate/:productId)
  app.use('/api', scrapingRoutes);

  // Inventaire client (GET /api/client-inventory, etc.)
  app.use('/api/client-inventory', clientInventoryRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/supplier', supplierRoutes);
  app.use('/api/chatbot', chatbotRoutes); // <-- AJOUTER CETTE LIGNE
  app.use('/api/statistics', statisticsRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/crypto-payments', cryptoPaymentRoutes);
  app.use('/api/stock-release', stockReleaseRoutes);

  /* ------------------------ 4) HEALTHCHECK ----------------------------- */
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, env: process.env.NODE_ENV || 'dev' });
  });

  /* ------------------------ 5) ERROR HANDLER --------------------------- */
  // ⚠️ Toujours APRES toutes les routes
  app.use(errorHandler);

  /* ------------------------ 6) MONGOOSE CONNECTION --------------------- */
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

}).catch(err => {
  console.error('Erreur lors de la connexion à MongoDB:', err);
});   