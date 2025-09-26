// models/ClientInventory.js
const mongoose = require('mongoose');

const ClientInventorySchema = new mongoose.Schema({
  client:   { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },

  // valeurs que le client édite
  currentStock: { type: Number, default: 0, min: 0 },      // stock actuel chez le client
  dailyUsage:   { type: Number, default: 0, min: 0 },      // conso/jour
  reorderPoint: { type: Number, default: 0, min: 0 },      // seuil mini
  reorderQty:   { type: Number, default: 0, min: 0 },      // quantité à commander quand on passe sous le seuil

  autoOrder: {
    enabled: { type: Boolean, default: true }
  },

  // suivi
  lastDecrementAt: { type: Date }, // dernière exécution du décrément quotidien
  notes: { type: String, default: '' }
}, { timestamps: true });

ClientInventorySchema.index({ client: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('ClientInventory', ClientInventorySchema);
