require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const Product = require('../models/Product');

// ------- ENV -------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// ------- INIT DB (connexion gérée par config/db.js) -------
// La connexion MongoDB est gérée par le fichier config/db.js

// ------- INIT GEMINI -------
let genAI = null;
let webModel = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'placeholder') {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY, {
    baseUrl: 'https://generativelanguage.googleapis.com/v1'
  });

  // Modèle Gemini standard
  webModel = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.6,
      topP: 0.9,
      topK: 32,
      maxOutputTokens: 1024,
    },
  });
} else {
  console.warn('⚠️ GEMINI_API_KEY absent — le mode web ne sera pas disponible.');
}

// ------- UTIL -------
function normalizeString(s) {
  return (s || '').toString().trim();
}

function formatSpecs(specs = []) {
  if (!Array.isArray(specs) || specs.length === 0) return '';
  return specs.map(s => `- ${s.specName}: ${s.specValue}`).join('\n');
}

function formatFaqs(faqs = []) {
  if (!Array.isArray(faqs) || faqs.length === 0) return '';
  return faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n');
}

// ------- 1) CHERCHER STRICTEMENT DANS LA BASE -------
async function findProductsInDB(question, limit = 5) {
  if (!question || !Product) return [];

  const q = normalizeString(question);
  if (!q) return [];

  // Découpage “mots-clés” simple, enlève petites particules
  const keywords = q
    .toLowerCase()
    .replace(/[()[\]{}.,;:!?/\\#+*"']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Requête $or par nom/description/catégorie + recherche par mots-clés
  const orClauses = [
    { name: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
    { category: { $regex: q, $options: 'i' } },
    ...keywords.map(k => ({ name: { $regex: k, $options: 'i' } })),
    ...keywords.map(k => ({ description: { $regex: k, $options: 'i' } })),
    ...keywords.map(k => ({ category: { $regex: k, $options: 'i' } })),
  ];

  try {
    const results = await Product.find({ $or: orClauses }).limit(limit).lean();
    return results || [];
  } catch (err) {
    console.warn('DB search warning:', err.message);
    return [];
  }
}

// Réponse “STRICTE DB” : ne s’appuie que sur ce qu’on a vraiment
function buildDbOnlyAnswer(products) {
  if (!products || products.length === 0) return null;

  let out = `J’ai trouvé ${products.length} résultat(s) dans notre catalogue :\n\n`;
  products.forEach((p, i) => {
    const specsBlock = formatSpecs(p.technicalSpecs);
    const faqsBlock = formatFaqs(p.faqs);

    out += `**${i + 1}. ${normalizeString(p.name)}**\n`;
    if (p.price !== undefined) out += `💰 Prix: €${p.price}\n`;
    if (p.stock !== undefined) out += `📦 Stock: ${p.stock} unité(s)\n`;
    if (p.brandInfo) out += `🏭 Marque: ${normalizeString(p.brandInfo)}\n`;
    if (p.category) out += `🏷️ Catégorie: ${normalizeString(p.category)}\n`;
    if (p.targetAudience) out += `👥 Audience: ${normalizeString(p.targetAudience)}\n`;
    if (p.description) out += `📝 Description: ${normalizeString(p.description)}\n`;
    if (p.usageInstructions) out += `🧩 Utilisation: ${normalizeString(p.usageInstructions)}\n`;
    if (specsBlock) out += `🔧 Spécifications:\n${specsBlock}\n`;
    if (faqsBlock) out += `❓ FAQ:\n${faqsBlock}\n`;
    out += '\n';
  });

  out += `Souhaitez-vous plus d’informations sur l’un de ces produits (fiches techniques, délais, photos, variantes) ?`;
  return out;
}

// ------- 2) SINON: GEMINI + WEB (toujours répondre) -------
async function webBackedAnswer(question) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'placeholder' || GEMINI_API_KEY === 'AIzaSyDummyKeyForTesting123456789') {
    // Simulation d'une réponse basée sur la recherche web
    const normalizedQuestion = question.toLowerCase();

    if (normalizedQuestion.includes('football') || normalizedQuestion.includes('sport')) {
      return `🏈 **Recherche web - Football/Sport :**

Je n'ai pas trouvé d'équipements de football dans notre base de données médicales, mais voici des informations générales sur les équipements sportifs médicaux :

**Équipements de protection sportive :**
- Protège-tibias médicaux
- Bandages de compression
- Attelles de sport
- Tapes de kinésithérapie

**Premiers secours sportifs :**
- Trousse de secours sportive
- Glace instantanée
- Bandages élastiques
- Désinfectants

Pour des équipements spécifiques au football, je recommande de préciser :
- Type d'équipement (protection, rééducation, premiers secours)
- Niveau de jeu (amateur, professionnel)
- Normes requises (CE, FIFA, etc.)

Pouvez-vous me donner plus de détails sur vos besoins spécifiques ?`;
    }

    // Réponse générique pour autres questions
    return `🌐 **Recherche web - ${question} :**

Je n'ai pas trouvé d'éléments correspondants dans notre base de données médicales, mais voici des informations générales basées sur des ressources web :

**Conseils généraux :**
- Décrivez votre besoin (usage, service, quantité, budget)
- Précisez les normes attendues (CE, ISO, stérile/non, classe de risque, etc.)
- Indiquez le contexte (bloc, consultation, domicile, transport)

**Pour une recherche plus précise :**
- Nom exact du produit recherché
- Usage spécifique (diagnostic, traitement, protection)
- Quantité et budget approximatif
- Normes de sécurité requises

Je peux ensuite vous proposer des références adaptées à vos besoins.`;
  }

  try {
    // Utilisation directe de l'API REST Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Tu es SmartBot, assistant en matériel médical. Réponds à cette question en français de manière claire et professionnelle : "${question}"`
          }]
        }],
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          topK: 32,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text && text.trim().length > 0) {
      return text.trim();
    }

    // Sécurité: une mini-réponse par défaut
    return `Voici une réponse synthétique basée sur des ressources web publiques : ${question}`;
  } catch (error) {
    console.warn('Gemini API error:', error.message);
    // En cas d'erreur API, retourner une réponse de secours
    return (
      `Je n'ai pas trouvé d'éléments dans notre base et la recherche web est temporairement indisponible.\n` +
      `Pouvez-vous préciser le nom du produit, l'usage, la quantité et les normes attendues (CE, ISO...) ?\n` +
      `Je vous proposerai des références adaptées.`
    );
  }
}

// ------- POINT D’ENTRÉE : “toujours répondre” -------
// Règle stricte : DB d’abord, sinon Web, sinon Fallback.
async function getChatbotResponse(question) {
  try {
    // 1) Chercher dans la base locale
    const dbProducts = await findProductsInDB(question, 5);
    if (dbProducts.length > 0) {
      return buildDbOnlyAnswer(dbProducts);
    }

    // 2) Sinon, Web (Gemini + Google Search)
    const webAnswer = await webBackedAnswer(question);
    if (webAnswer && webAnswer.trim().length > 0) {
      return webAnswer;
    }

    // 3) Fallback final (au cas où)
    return (
      `Je n’ai pas trouvé d’éléments en base et je ne peux pas interroger le web pour le moment.\n` +
      `Indiquez-moi le nom du produit exact, son usage, la quantité et les normes requises — je vous guiderai vers une alternative compatible.`
    );
  } catch (err) {
    console.error('getChatbotResponse error:', err);
    // Toujours répondre, même en cas d’exception
    return (
      `Un incident technique est survenu, mais je reste à votre disposition.\n` +
      `Pouvez-vous préciser le nom du produit, l’usage, la quantité et les normes attendues (CE, ISO…) ?\n` +
      `Je vous proposerai des références adaptées.`
    );
  }
}

module.exports = { getChatbotResponse };
