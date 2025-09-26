const express = require('express');
const router = express.Router();
const searchGoogle = require('../utils/googleSearch');
const CompetitorOffer = require('../models/CompetitorOffer');
const Product = require('../models/Product');

// [POST] /api/scrape/:productId
// [POST] /api/scrape/:productId
router.post('/scrape/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Validation: Assurer que le nom et la description existent
    if (!product.name || !product.description) {
      return res.status(400).json({ message: 'Le nom ou la description du produit est manquant, impossible de lancer la recherche.' });
    }

    const query = `${product.name} ${product.description} prix`;
    const results = await searchGoogle(query);
   
    console.log("Résultats Google:", results);


    const offers = await Promise.all(results.map(data => {
      return CompetitorOffer.create({
        product: product._id,
        title: data.title,
        url: data.link,
        snippet: data.snippet,
        price: data.price
      });
    }));

    res.status(200).json({ offers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur scraping' });
  }
});

// [GET] /api/simulate/:productId
router.get('/simulate/:productId', async (req, res) => {
  try {
    const offers = await CompetitorOffer.find({ product: req.params.productId });
    const prices = offers.map(o => o.price).filter(p => p != null);

    if (!prices.length) return res.status(400).json({ message: "Pas de données de prix disponibles." });

    const min = Math.min(...prices);
    const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    const recommendedPrice = parseFloat((median - 0.10).toFixed(2));

    res.json({ productId: req.params.productId, min, median, recommendedPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur simulation' });
  }
});

module.exports = router;
