// backend/scripts/embedProducts.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { performFullReEmbedding } = require('../services/embeddingService');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Erreur: MONGO_URI doit être défini dans .env");
  process.exit(1);
}

/**
 * This script connects to the database and triggers a full re-embedding of all products.
 * It should only be run manually if the vector database is out of sync.
 */
async function run() {
  let mongoConnected = false;
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    mongoConnected = true;
    console.log('✅ MongoDB connected.');

    await performFullReEmbedding();

  } catch (error) {
    console.error('❌ An error occurred during the script execution:', error);
  } finally {
    if (mongoConnected) {
      await mongoose.disconnect();
      console.log('🔌 MongoDB disconnected.');
    }
    process.exit(0);
  }
}

run();
