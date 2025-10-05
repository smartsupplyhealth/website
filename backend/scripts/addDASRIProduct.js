// backend/scripts/addDASRIProduct.js
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const MONGO_URI = process.env.MONGO_URI;

async function addDASRIProduct() {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connecté.');

        // Trouver un fournisseur existant
        const supplier = await Supplier.findOne({});
        if (!supplier) {
            console.error('Aucun fournisseur trouvé. Veuillez d\'abord créer un fournisseur.');
            return;
        }

        // Vérifier si le produit existe déjà
        const existingProduct = await Product.findOne({
            name: "Collecteurs DASRI 5 L (carton de 20)"
        });

        if (existingProduct) {
            console.log('Le produit existe déjà dans la base de données.');
            return;
        }

        // Créer le produit DASRI
        const dasriProduct = new Product({
            name: "Collecteurs DASRI 5 L (carton de 20)",
            description: "Boîtes pour objets piquants/coupants conformes ADR. Collecteurs de déchets d'activités de soins à risques infectieux (DASRI) avec une capacité de 5 litres. Carton de 20 unités.",
            price: 80.00,
            category: "Hygiène & Déchets",
            stock: 94,
            supplier: supplier._id,
            images: [],
            usageInstructions: "Utiliser pour la collecte des déchets d'activités de soins à risques infectieux. Respecter les normes ADR pour le transport. Fermer hermétiquement après usage et stocker dans un endroit sécurisé.",
            brandInfo: "Conforme aux normes européennes pour la collecte des DASRI. Certifié ADR pour le transport de matières dangereuses.",
            technicalSpecs: [
                { specName: "Capacité", specValue: "5 litres" },
                { specName: "Quantité", specValue: "Carton de 20 unités" },
                { specName: "Conformité", specValue: "ADR - Transport de matières dangereuses" },
                { specName: "Matériau", specValue: "Plastique résistant aux perforations" },
                { specName: "Couleur", specValue: "Jaune avec symbole biohazard" }
            ],
            faqs: [
                {
                    question: "Ces collecteurs sont-ils conformes aux normes ADR ?",
                    answer: "Oui, ces collecteurs sont entièrement conformes aux normes ADR pour le transport de matières dangereuses."
                },
                {
                    question: "Peuvent-ils être utilisés pour tous types de DASRI ?",
                    answer: "Oui, ils conviennent pour la collecte de tous types de déchets d'activités de soins à risques infectieux."
                },
                {
                    question: "Quelle est la durée de conservation ?",
                    answer: "Les collecteurs peuvent être stockés jusqu'à 2 ans dans un endroit sec et à l'abri de la lumière."
                }
            ],
            targetAudience: "Hôpitaux, cliniques, laboratoires, cabinets médicaux, centres de soins"
        });

        await dasriProduct.save();
        console.log('✅ Produit "Collecteurs DASRI 5 L (carton de 20)" ajouté avec succès !');
        console.log(`ID du produit: ${dasriProduct._id}`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout du produit:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Déconnecté de MongoDB.');
    }
}

addDASRIProduct();


