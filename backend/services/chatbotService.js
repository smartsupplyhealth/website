require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const Product = require('../models/Product');

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

if (!GEMINI_API_KEY || !MONGO_URI) {
  throw new Error("GEMINI_API_KEY ou MONGO_URI n'est pas défini.");
}

// --- INITIALISATION ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
const chatModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: { temperature: 0.8 }, // Plus créatif pour les réponses dynamiques
});

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
      const errorPrompt = `
Tu es SmartBot. Il y a eu un problème technique. Réponds à l'utilisateur de manière rassurante et professionnelle pour lui expliquer qu'il y a une difficulté temporaire. Suggère-lui de réessayer et reste positif.

Question originale: "${question}"

Génère une réponse d'excuse sympathique et professionnelle:
`;
      const errorResult = await chatModel.generateContent(errorPrompt);
      return errorResult.response.text();
    } catch (secondError) {
      return "Je rencontre une difficulté technique en ce moment. Pouvez-vous réessayer dans quelques instants ?";
    }
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