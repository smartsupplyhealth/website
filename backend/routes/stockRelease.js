const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const stockReleaseService = require('../services/stockReleaseService');

// Route pour obtenir les statistiques du service de libération du stock
router.get('/stats', auth, async (req, res) => {
    try {
        // Seuls les administrateurs peuvent voir les stats
        if (req.user.role !== 'admin' && req.user.role !== 'supplier') {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const stats = await stockReleaseService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting stock release stats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Route pour libérer manuellement le stock d'une commande
router.post('/release/:orderId', auth, async (req, res) => {
    try {
        // Seuls les administrateurs peuvent libérer manuellement le stock
        if (req.user.role !== 'admin' && req.user.role !== 'supplier') {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const { orderId } = req.params;
        const result = await stockReleaseService.releaseOrderStockManually(orderId);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error manually releasing stock:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur'
        });
    }
});

// Route pour démarrer/arrêter le service
router.post('/toggle', auth, async (req, res) => {
    try {
        // Seuls les administrateurs peuvent contrôler le service
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const { action } = req.body; // 'start' ou 'stop'

        if (action === 'start') {
            stockReleaseService.start();
            res.json({
                success: true,
                message: 'Service de libération du stock démarré'
            });
        } else if (action === 'stop') {
            stockReleaseService.stop();
            res.json({
                success: true,
                message: 'Service de libération du stock arrêté'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Action invalide. Utilisez "start" ou "stop"'
            });
        }
    } catch (error) {
        console.error('Error toggling stock release service:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

module.exports = router;
