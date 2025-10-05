const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { getClientInventory, updateInventoryItem } = require('../controllers/clientInventoryController');
const ClientInventory = require('../models/ClientInventory');
const mongoose = require('mongoose');

// Toutes les routes ici sont protégées et réservées aux clients
router.use(auth, authorize('client'));

// GET /api/client-inventory - Récupère l'inventaire complet du client
router.get('/', getClientInventory);

// GET /api/client-inventory/product/:productId - Récupère l'inventaire d'un produit spécifique
router.get('/product/:productId', async (req, res) => {
  try {
    const clientId = req.user.id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Product ID invalide' });
    }

    const inventory = await ClientInventory.findOne({
      client: clientId,
      product: productId
    }).populate('product', 'name reference category images price');

    if (!inventory) {
      // Retourner des valeurs par défaut si pas d'inventaire
      return res.json({
        currentStock: 0,
        dailyUsage: 0,
        reorderPoint: 0,
        reorderQty: 0,
        autoOrder: { enabled: false }
      });
    }

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/client-inventory/:inventoryId - Met à jour les paramètres d'un article de l'inventaire
router.put('/:inventoryId', updateInventoryItem);

// CONSERVER: AJUSTER le stock manuellement (+/-)
router.patch('/:inventoryId/adjust', async (req, res) => {
  try {
    const clientId = req.user.id; // Utiliser req.user.id du middleware auth
    const { delta } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.inventoryId)) {
      return res.status(400).json({ message: 'inventoryId invalide' });
    }

    const inv = await ClientInventory.findOneAndUpdate(
      { _id: req.params.inventoryId, client: clientId },
      { $inc: { currentStock: Number(delta || 0) } },
      { new: true }
    ).populate('product', 'name reference price images category');

    if (!inv) return res.status(404).json({ message: 'Ligne d\'inventaire non trouvée ou accès refusé' });
    res.json(inv);
  } catch (e) {
    console.error('PATCH /client-inventory/:id/adjust error:', e);
    res.status(500).json({ message: 'Erreur ajustement stock', error: e.message });
  }
});

// CONSERVER: SIMULER sur N jours
router.get('/simulate-consumption', async (req, res) => {
  try {
    const clientId = req.user.id;
    const days = Math.max(1, Number(req.query.days || 7));
    const items = await ClientInventory.find({ client: clientId }).populate('product', 'name price');
    const out = items.map(it => {
      const current = Number(it.currentStock || 0);
      const daily = Number(it.dailyUsage || 0);
      const projected = Math.max(0, current - daily * days);
      return {
        _id: it._id, // Ajouter l'ID de l'inventaire pour référence
        product: it.product,
        currentStock: current,
        dailyUsage: daily,
        reorderPoint: it.reorderPoint,
        afterDays: days,
        projectedStock: projected,
        hitsReorder: projected <= Number(it.reorderPoint || 0)
      };
    });
    res.json(out);
  } catch (e) {
    console.error('GET /client-inventory/simulate-consumption error:', e);
    res.status(500).json({ message: 'Erreur simulation', error: e.message });
  }
});

module.exports = router;
