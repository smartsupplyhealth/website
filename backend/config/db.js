// backend/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Vérifier si déjà connecté
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB déjà connectée.');
      return Promise.resolve();
    }

    // Fermer toute connexion existante avant de se reconnecter
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connectée avec succès.');
    return Promise.resolve();
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err.message);
    return Promise.reject(err);
  }
};

module.exports = connectDB;
