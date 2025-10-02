require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const Product = require('../models/Product');

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'placeholder') {
  console.warn('⚠️  Chatbot disabled: GEMINI_API_KEY not provided or using placeholder value');
}

if (!MONGO_URI) {
  console.warn('⚠️  MONGO_URI not defined, using MONGODB_URI instead');
}

// --- INITIALISATION ---
let genAI, embeddingModel, chatModel;

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'placeholder') {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  chatModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.8 }, // Plus créatif pour les réponses dynamiques
  });
} else {
  console.warn('⚠️  Google AI models not initialized - chatbot features will be disabled');
}

// Cache pour les embeddings
let productEmbeddingsCache = null;

// --- DÉTECTION SI LA QUESTION CONCERNE LES PRODUITS ---
function isProductRelated(question) {
  const lowerQuestion = question.toLowerCase().trim();

  // Mots-clés liés aux produits médicaux
  const productKeywords = [
    'produit', 'équipement', 'matériel', 'gant', 'masque', 'stéthoscope',
    'thermomètre', 'seringue', 'pansement', 'désinfectant', 'scalpel',
    'tensiomètre', 'oxymètre', 'cathéter', 'sonde', 'chirurgical',
    'médical', 'santé', 'hôpital', 'clinique', 'infirmier', 'docteur',
    'acheter', 'prix', 'coût', 'disponible', 'stock', 'commander',
    'spécification', 'caractéristique', 'utilisation', 'mode d\'emploi',
    'search', 'find', 'looking for', 'need', 'want', 'buy'
  ];

  // Questions directes sur les produits
  const productQuestions = [
    'que vendez-vous', 'quels produits', 'votre catalogue', 'vos équipements',
    'what do you sell', 'your products', 'your catalog'
  ];

  // Vérifier si la question contient des mots-clés produits
  const hasProductKeywords = productKeywords.some(keyword =>
    lowerQuestion.includes(keyword)
  );

  // Vérifier si c'est une question directe sur les produits
  const isDirectProductQuestion = productQuestions.some(q =>
    lowerQuestion.includes(q)
  );

  return hasProductKeywords || isDirectProductQuestion;
}

// --- CALCUL DE SIMILARITÉ COSINE ---
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- PRÉPARATION DES EMBEDDINGS PRODUITS ---
async function prepareProductEmbeddings() {
  if (productEmbeddingsCache) {
    return productEmbeddingsCache;
  }

  // Si les modèles AI ne sont pas initialisés, retourner une liste vide
  if (!embeddingModel) {
    console.warn('⚠️  Embedding model not available - product embeddings disabled');
    return [];
  }

  try {
    console.log('Chargement et traitement des produits...');
    const products = await Product.find({});

    const productData = [];

    for (const product of products) {
      // Créer un texte représentatif du produit
      const specs = (product.technicalSpecs || []).map(s => `${s.specName}: ${s.specValue}`).join(", ");
      const productText = `${product.name} ${product.description} ${product.targetAudience} ${specs}`;

      // Générer l'embedding
      const embeddingResult = await embeddingModel.embedContent(productText);
      const embedding = embeddingResult.embedding.values;

      productData.push({
        product: product,
        embedding: embedding,
        text: productText
      });
    }

    productEmbeddingsCache = productData;
    console.log(`${productData.length} produits traités et mis en cache.`);
    return productData;

  } catch (error) {
    console.error('Erreur lors de la préparation des embeddings:', error);
    return [];
  }
}

// --- RECHERCHE PAR SIMILARITÉ ---
async function findSimilarProducts(question, limit = 5) {
  try {
    const productData = await prepareProductEmbeddings();

    if (productData.length === 0) {
      return [];
    }

    const questionEmbeddingResult = await embeddingModel.embedContent(question);
    const questionEmbedding = questionEmbeddingResult.embedding.values;

    const similarities = productData.map(item => ({
      product: item.product,
      similarity: cosineSimilarity(questionEmbedding, item.embedding)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    // Seuil plus bas pour être plus inclusif
    const relevantProducts = similarities.filter(item => item.similarity > 0.2);

    return relevantProducts.slice(0, limit).map(item => item.product);

  } catch (error) {
    console.error('Erreur lors de la recherche par similarité:', error);
    return [];
  }
}

// --- GESTION DES QUESTIONS AVEC PRODUITS ---
async function handleQuestionWithProducts(question) {
  try {
    const products = await findSimilarProducts(question, 5);

    let context = "";
    if (products.length > 0) {
      context = products.map(p => {
        const specs = (p.technicalSpecs || []).map(s => `- ${s.specName}: ${s.specValue}`).join("\n");
        const faqs = (p.faqs || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n");
        return `Nom: ${p.name}\nDescription: ${p.description}\nUtilisation: ${p.usageInstructions}\nMarque: ${p.brandInfo}\nAudience: ${p.targetAudience}\nSpécifications:\n${specs}\nFAQ:\n${faqs}`;
      }).join("\n\n---\n\n");
    }

    const prompt = `
Tu es "SmartBot", un assistant intelligent et sympathique spécialisé en matériel médical et équipements de santé.

${context ? `INFORMATIONS PRODUITS PERTINENTES:\n${context}\n\n` : 'AUCUN PRODUIT SPÉCIFIQUE TROUVÉ DANS LA BASE DE DONNÉES.\n\n'}

QUESTION DE L'UTILISATEUR:
"${question}"

INSTRUCTIONS:
- Réponds de manière naturelle, dynamique et personnalisée à la question
- Si des produits sont disponibles, utilise ces informations pour enrichir ta réponse
- Si aucun produit spécifique n'est trouvé, donne quand même une réponse utile sur le domaine médical en général
- Sois professionnel mais accessible et engageant
- Adapte ton ton et style à la question posée
- N'invente jamais de produits qui ne sont pas dans les informations fournies
- Si tu ne peux pas répondre précisément, explique ce que tu peux faire et propose des alternatives

RÉPONSE:
`.trim();

    const result = await chatModel.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error("Erreur lors de la gestion avec produits:", error);
    throw error;
  }
}

// --- GESTION DES QUESTIONS GÉNÉRALES ---
async function handleGeneralQuestion(question) {
  try {
    const prompt = `
Tu es "SmartBot", un assistant intelligent et sympathique spécialisé en matériel médical et équipements de santé.

CONTEXT SUR TOI:
- Tu es expert en matériel médical, équipements de santé, fournitures hospitalières
- Tu peux aider avec la recherche de produits, conseils d'utilisation, informations techniques
- Tu es professionnel mais chaleureux et accessible
- Tu travailles pour une entreprise qui vend du matériel médical

QUESTION DE L'UTILISATEUR:
"${question}"

INSTRUCTIONS:
- Réponds de manière naturelle et personnalisée à la question
- Adapte ton ton selon le contexte (salutation, question technique, remerciement, etc.)
- Reste dans ton domaine d'expertise (santé/médical) mais sois conversationnel
- Si c'est une salutation, présente-toi et tes services de manière engageante
- Si c'est une question sur tes capacités, explique ce que tu peux faire
- Si c'est hors de ton domaine, redirige poliment vers tes spécialités
- Sois authentique et évite les réponses robotiques

RÉPONSE:
`.trim();

    const result = await chatModel.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error("Erreur lors de la gestion générale:", error);
    throw error;
  }
}

// --- FONCTION PRINCIPALE ---
async function getChatbotResponse(question) {
  try {
    console.log(`Question reçue: "${question}"`);

    // Si GEMINI n'est pas configuré, utiliser les réponses de fallback
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'placeholder' || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return await handleFallbackResponse(question);
    }

    // Vérifier si la question est liée aux produits
    if (isProductRelated(question)) {
      console.log('Question liée aux produits détectée');
      return await handleQuestionWithProducts(question);
    } else {
      console.log('Question générale détectée');
      return await handleGeneralQuestion(question);
    }

  } catch (error) {
    console.error("Erreur dans le service chatbot:", error);

    // Même les messages d'erreur peuvent être dynamiques !
    try {
      if (chatModel) {
        const errorPrompt = `
Tu es SmartBot. Il y a eu un problème technique. Réponds à l'utilisateur de manière rassurante et professionnelle pour lui expliquer qu'il y a une difficulté temporaire. Suggère-lui de réessayer et reste positif.

Question originale: "${question}"

Génère une réponse d'excuse sympathique et professionnelle:
`;
        const errorResult = await chatModel.generateContent(errorPrompt);
        return errorResult.response.text();
      } else {
        return await handleFallbackResponse(question);
      }
    } catch (secondError) {
      return "Je rencontre une difficulté technique en ce moment. Pouvez-vous réessayer dans quelques instants ?";
    }
  }
}

// --- GESTION DES RÉPONSES DE FALLBACK (SANS IA) ---
async function handleFallbackResponse(question) {
  try {
    const lowerQuestion = question.toLowerCase().trim();

    // Salutations
    if (lowerQuestion.match(/^(bonjour|hello|salut|hi|hey|bonsoir)/)) {
      return "Bonjour ! Je suis SmartBot, votre assistant spécialisé en matériel médical. Je peux vous aider à trouver des produits, vous donner des informations sur nos équipements de santé, ou répondre à vos questions sur l'utilisation du matériel médical. Comment puis-je vous aider aujourd'hui ?";
    }

    // Questions sur les produits
    if (lowerQuestion.includes('produit') || lowerQuestion.includes('équipement') || lowerQuestion.includes('matériel')) {
      const products = await Product.find({}).limit(3);
      if (products.length > 0) {
        let response = "Voici quelques-uns de nos produits populaires :\n\n";
        products.forEach((product, index) => {
          response += `${index + 1}. **${product.name}** - €${product.price}\n`;
          response += `   ${product.description}\n\n`;
        });
        response += "Souhaitez-vous plus d'informations sur l'un de ces produits ?";
        return response;
      }
    }

    // Questions sur les prix
    if (lowerQuestion.includes('prix') || lowerQuestion.includes('coût') || lowerQuestion.includes('tarif')) {
      return "Nos prix varient selon les produits. Nous proposons du matériel médical de qualité à des prix compétitifs. Pour connaître le prix exact d'un produit spécifique, n'hésitez pas à me donner son nom ou à parcourir notre catalogue.";
    }

    // Questions sur la livraison
    if (lowerQuestion.includes('livraison') || lowerQuestion.includes('délai') || lowerQuestion.includes('expédition')) {
      return "Nous proposons une livraison rapide et sécurisée pour tous nos équipements médicaux. Les délais varient selon votre localisation et le type de produit. Pour plus de détails sur la livraison, je vous recommande de contacter notre service client.";
    }

    // Questions sur l'aide ou les fonctionnalités
    if (lowerQuestion.includes('aide') || lowerQuestion.includes('aider') || lowerQuestion.includes('faire') || lowerQuestion.includes('fonction')) {
      return "Je peux vous aider avec :\n\n• Recherche de produits médicaux\n• Informations sur nos équipements\n• Conseils d'utilisation\n• Questions sur les prix et la livraison\n• Recommandations de produits\n\nN'hésitez pas à me poser vos questions !";
    }

    // Remerciements
    if (lowerQuestion.includes('merci') || lowerQuestion.includes('thanks')) {
      return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions sur nos produits médicaux. Je suis là pour vous aider !";
    }

    // Au revoir
    if (lowerQuestion.includes('au revoir') || lowerQuestion.includes('bye') || lowerQuestion.includes('à bientôt')) {
      return "Au revoir ! N'hésitez pas à revenir si vous avez besoin d'aide avec nos équipements médicaux. Bonne journée !";
    }

    // Réponse par défaut
    return "Je comprends votre question sur le matériel médical. Bien que je ne puisse pas donner une réponse détaillée en ce moment, je peux vous aider à trouver des produits dans notre catalogue ou vous mettre en contact avec notre équipe spécialisée. Que recherchez-vous précisément ?";

  } catch (error) {
    console.error("Erreur dans handleFallbackResponse:", error);
    return "Je suis là pour vous aider avec vos questions sur le matériel médical. Pouvez-vous me dire ce que vous recherchez ?";
  }
}

// --- FONCTIONS UTILITAIRES ---
function clearCache() {
  productEmbeddingsCache = null;
  console.log('Cache des embeddings nettoyé.');
}

async function reloadProducts() {
  clearCache();
  await prepareProductEmbeddings();
  console.log('Produits rechargés avec succès.');
}

module.exports = { getChatbotResponse, clearCache, reloadProducts };