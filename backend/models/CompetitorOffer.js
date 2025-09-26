const mongoose = require('mongoose');

const CompetitorOfferSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  title: String,
  url: String,
  snippet: String,
  price: Number,
  collectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CompetitorOffer', CompetitorOfferSchema);
