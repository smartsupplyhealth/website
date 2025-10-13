const cron = require('node-cron');
const ClientInventory = require('../models/ClientInventory');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Order = require('../models/Order');
// Services d'auto-commande et email gérés par n8n
// const autoOrderService = require('../services/autoOrderService');
// const emailService = require('../utils/emailService');

let cronJob = null;

// Fonction principale de consommation quotidienne
async function runAutoConsumptionCron() {
    try {
        console.log('🔄 Début de la consommation quotidienne...');

        // Récupérer tous les inventaires clients
        const inventories = await ClientInventory.find({});
        console.log(`📊 ${inventories.length} inventaires trouvés`);

        for (const inv of inventories) {
            try {
                // Vérifier si le produit existe
                const product = await Product.findById(inv.product);
                if (!product) {
                    console.log(`❌ Produit ${inv.product} non trouvé pour l'inventaire ${inv._id}`);
                    continue;
                }

                // Vérifier si le client existe
                const client = await Client.findById(inv.client);
                if (!client) {
                    console.log(`❌ Client ${client} non trouvé pour l'inventaire ${inv._id}`);
                    continue;
                }

                // Calculer la consommation quotidienne
                const dailyConsumption = product.dailyConsumption || 0;
                const newStock = Math.max(0, inv.currentStock - dailyConsumption);

                console.log(`📦 ${product.name}: ${inv.currentStock} → ${newStock} (consommation: ${dailyConsumption})`);

                // Mettre à jour le stock
                inv.currentStock = newStock;
                await inv.save();

                // Logique d'auto-commande et email gérée par n8n
                // Cette fonction ne fait que la décrémentation de stock

            } catch (error) {
                console.error(`❌ Erreur traitement inventaire ${inv._id}:`, error.message);
            }
        }

        console.log('✅ Consommation quotidienne terminée');

    } catch (error) {
        console.error('❌ Erreur consommation quotidienne:', error.message);
    }
}

// Fonction de planification du cron (DÉSACTIVÉE)
function scheduleDailyConsumption() {
    // CRON JOB DÉSACTIVÉ - REMPLACÉ PAR N8N
    console.log('⏸️ Cron job désactivé - Remplacé par n8n workflow');
    return;

    // Code du cron job commenté pour éviter les erreurs de syntaxe
    // if (cronJob) {
    //   console.log('⏸️ Cron déjà planifié, on évite la double planification');
    //   return; // évite la double planif
    // }
    // const cronSchedule = '*/5 * * * *'; // chaque 5 minutes
    // console.log('🕐 Cron activé: ' + cronSchedule + ' (Africa/Tunis)');
    // cronJob = cron.schedule(
    //   cronSchedule,
    //   async () => {
    //     await runAutoConsumptionCron();
    //   },
    //   { timezone: 'Africa/Tunis' }
    // );
    // console.log('✅ Cron job démarré (planification unique)');
}

// Fonction pour arrêter le cron
function stopDailyConsumption() {
    if (cronJob) {
        cronJob.destroy();
        cronJob = null;
        console.log('⏹️ Cron job arrêté');
    }
}

module.exports = {
    runAutoConsumptionCron,
    scheduleDailyConsumption,
    stopDailyConsumption
};
