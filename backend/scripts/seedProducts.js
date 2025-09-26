// backend/scripts/seedProducts.js
require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI;

// --- Données d'exemple de haute qualité ---
const sampleData = [
  {
    name: "Seringue de Précision 'InjectaFine'",
    description: "Seringue stérile à usage unique avec une aiguille ultra-fine pour des injections précises et moins douloureuses.",
    usageInstructions: "Utiliser immédiatement après ouverture de l'emballage stérile. Ne pas réutiliser. Jeter dans un conteneur pour objets tranchants après usage. Vérifier que le capuchon de l'aiguille est bien en place avant de retirer la seringue.",
    brandInfo: "La marque Medisave est un leader européen dans la fabrication de dispositifs médicaux, reconnue pour sa fiabilité et la qualité de ses matériaux depuis 1995.",
    targetAudience: "Cliniques dentaires, laboratoires d'analyse, services de pédiatrie.",
    technicalSpecs: [
      { specName: "Capacité", specValue: "3ml" },
      { specName: "Taille de l'aiguille", specValue: "28G" },
      { specName: "Matériau", specValue: "Polypropylène de grade médical, sans latex" }
    ],
    faqs: [
      { question: "Cette seringue contient-elle du latex ?", answer: "Non, la seringue InjectaFine est entièrement sans latex pour éviter les réactions allergiques." },
      { question: "Est-elle adaptée pour les vaccins ?", answer: "Oui, sa précision la rend idéale pour l'administration de vaccins et d'autres médicaments à faible dosage." }
    ]
  },
  {
    name: "Gants d'Examen en Nitrile 'SecuraTouch'",
    description: "Boîte de 100 gants d'examen en nitrile, non poudrés et ambidextres. Offrent une excellente barrière de protection et une sensibilité tactile supérieure.",
    usageInstructions: "Vérifier l'absence de perforations avant usage. Enfiler sur des mains propres et sèches. Usage unique uniquement. Conserver dans un endroit sec et à l'abri de la lumière directe du soleil.",
    brandInfo: "SecuraTouch est une marque spécialisée dans les équipements de protection individuelle (EPI) pour le secteur de la santé, garantissant une conformité aux normes européennes les plus strictes.",
    targetAudience: "Tous types de cliniques, hôpitaux, laboratoires.",
    technicalSpecs: [
      { specName: "Matériau", specValue: "Nitrile" },
      { specName: "Couleur", specValue: "Bleu" },
      { specName: "Poudré", specValue: "Non" }
    ],
    faqs: [
      { question: "Ces gants sont-ils réutilisables ?", answer: "Non, les gants SecuraTouch sont conçus pour un usage unique afin de garantir une hygiène maximale." },
      { question: "Quelle est la différence entre le nitrile et le latex ?", answer: "Le nitrile est une alternative synthétique au latex, offrant une résistance supérieure aux perforations et éliminant le risque d'allergies au latex." }
    ]
  },
  {
    name: "Compresse Stérile 'CuraGauze'",
    description: "Compresse de gaze stérile en pur coton, très absorbante et non adhérente. Idéale pour le nettoyage des plaies et l'application de pansements.",
    usageInstructions: "Appliquer sur une plaie préalablement nettoyée et désinfectée. Peut être utilisée pour absorber les exsudats ou comme pansement secondaire. Changer la compresse quotidiennement ou selon les instructions d'un professionnel de santé.",
    brandInfo: "CuraGauze est développée par PharmaHeal, une entreprise dédiée aux solutions de soin des plaies innovantes et efficaces.",
    targetAudience: "Services d'urgence, cliniques médicales, infirmiers.",
    technicalSpecs: [
      { specName: "Dimensions", specValue: "10cm x 10cm" },
      { specName: "Composition", specValue: "100% Coton" },
      { specName: "Stérilité", specValue: "Oui, par oxyde d'éthylène" }
    ],
    faqs: [
      { question: "La compresse colle-t-elle à la plaie ?", answer: "Non, la compresse CuraGauze est conçue pour être non adhérente, ce qui facilite le changement de pansement sans traumatiser la plaie." }
    ]
  }
];

async function seedDatabase() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connecté.');

    console.log('Recherche de produits à mettre à jour...');
    // On cherche des produits qui ont encore les informations par défaut pour éviter d'écraser des données déjà saisies.
    const productsToUpdate = await Product.find({ 
      brandInfo: 'Aucune information sur la marque fournie.' 
    }).limit(sampleData.length);

    if (productsToUpdate.length === 0) {
      console.log("Aucun produit avec des données par défaut n'a été trouvé. Peut-être ont-ils déjà été mis à jour ?");
      console.log("Si vous voulez forcer la mise à jour, veuillez modifier le script.");
      return;
    }

    console.log(`${productsToUpdate.length} produits trouvés. Mise à jour en cours...`);

    for (let i = 0; i < productsToUpdate.length; i++) {
      const product = productsToUpdate[i];
      const data = sampleData[i];

      // On met à jour le produit avec les nouvelles données
      product.name = data.name; // On met aussi à jour le nom pour correspondre aux données
      product.description = data.description;
      product.usageInstructions = data.usageInstructions;
      product.brandInfo = data.brandInfo;
      product.targetAudience = data.targetAudience;
      product.technicalSpecs = data.technicalSpecs;
      product.faqs = data.faqs;

      await product.save();
      console.log(`Produit '${product.name}' mis à jour avec succès.`);
    }

    console.log('\n--- SUCCÈS ---');
    console.log('La base de données a été enrichie avec des données d exemple.');

  } catch (error) {
    console.error('\n--- ERREUR ---');
    console.error('Une erreur est survenue lors du remplissage de la base de données:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnecté de MongoDB.');
  }
}

seedDatabase();
