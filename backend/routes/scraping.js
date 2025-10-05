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
    console.log("Starting competitor analysis for product:", product.name);
    console.log("Search query:", query);

    const results = await searchGoogle(query);
    console.log("Search results count:", results.length);

    if (!results || results.length === 0) {
      return res.status(400).json({ message: 'Aucun résultat trouvé pour ce produit. Veuillez réessayer plus tard.' });
    }

    // Clear existing offers for this product to avoid duplicates
    await CompetitorOffer.deleteMany({ product: product._id });

    const offers = await Promise.all(results.map(data => {
      return CompetitorOffer.create({
        product: product._id,
        title: data.title,
        url: data.link,
        snippet: data.snippet,
        price: data.price
      });
    }));

    console.log("Created offers:", offers.length);
    res.status(200).json({
      success: true,
      offers,
      message: `${offers.length} offres concurrentes trouvées`
    });
  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse des concurrents. Veuillez réessayer.'
    });
  }
});

// [GET] /api/simulate/:productId
router.get('/simulate/:productId', async (req, res) => {
  try {
    const offers = await CompetitorOffer.find({ product: req.params.productId });
    const prices = offers.map(o => o.price).filter(p => p != null);

    console.log("Price simulation for product:", req.params.productId);
    console.log("Found offers:", offers.length);
    console.log("Valid prices:", prices.length);

    if (!prices.length) {
      return res.status(400).json({
        success: false,
        message: "Aucune donnée de prix disponible. Veuillez d'abord analyser la concurrence pour ce produit."
      });
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const sortedPrices = prices.sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const recommendedPrice = parseFloat((median - 0.10).toFixed(2));

    console.log("Price analysis:", { min, max, median, average, recommendedPrice });

    res.json({
      success: true,
      productId: req.params.productId,
      min,
      max,
      median,
      average,
      recommendedPrice,
      competitorCount: offers.length,
      message: `Analyse basée sur ${offers.length} offres concurrentes`
    });
  } catch (err) {
    console.error("Price simulation error:", err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la simulation de prix. Veuillez réessayer.'
    });
  }
});

module.exports = router;
