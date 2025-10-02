// backend/controllers/recommendationController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Essayez de charger "natural" (TF-IDF). Si absent, on fera sans.
let natural = null;
try {
  natural = require('natural');
} catch (_) {
  console.warn('[RECO] "natural" non disponible – TF-IDF désactivé (reco par catégorie uniquement).');
}

/* ---------------- Helpers ---------------- */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const norm = (t) =>
  (t || '').toString().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------------- TF-IDF utils (si natural présent) ---------------- */
function cosine(a, b) {
  if (!a?.size || !b?.size) return { score: 0, shared: 0 };
  let dot = 0, na = 0, nb = 0, shared = 0;
  for (const [, wa] of a) na += wa * wa;
  for (const [, wb] of b) nb += wb * wb;
  const den = Math.sqrt(na) * Math.sqrt(nb) || 1;
  for (const [t, wa] of a) {
    const wb = b.get(t);
    if (wb) { dot += wa * wb; shared++; }
  }
  return { score: dot / den, shared };
}

async function buildTfIdf() {
  if (!natural) return null;

  // Produits "actifs" (tolérant: accepte si champ manquant)
  const products = await Product.find({
    $or: [{ active: true }, { isActive: true }, { active: { $exists: false } }],
  }).lean();

  const tfidf = new natural.TfIdf();
  const docs = products.map(p => [norm(p.name), norm(p.category), norm(p.description)].join(' '));
  docs.forEach((txt, i) => tfidf.addDocument(txt, i));

  const TOP = 20;
  const vectors = products.map((_, i) => {
    const m = new Map();
    tfidf.listTerms(i).slice(0, TOP).forEach(t => m.set(t.term, t.tfidf));
    return m;
  });

  return { products, vectors };
}

function runTfIdfReco(tf, boughtIdx, purchasedIds, purchasedCategories, { sameCategoryOnly, minScore, minShared, limit }) {
  const { products, vectors } = tf;

  const candidates = products
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !purchasedIds.has(p._id.toString()))
    .filter(({ p }) => !sameCategoryOnly || purchasedCategories.has(p.category));

  const scored = new Map();
  for (const { p: cand, i: ci } of candidates) {
    const vC = vectors[ci];
    let best = 0, sum = 0, matched = 0;
    for (const bi of boughtIdx) {
      const { score, shared } = cosine(vC, vectors[bi]);
      if (shared >= minShared) matched++;
      best = Math.max(best, score);
      sum += score;
    }
    if (best >= minScore && matched > 0) {
      scored.set(cand._id.toString(), { product: cand, score: best, sum, matches: matched });
    }
  }

  return [...scored.values()]
    .sort((a, b) => b.score - a.score || b.sum - a.sum || b.matches - a.matches)
    .slice(0, limit);
}

/* ---------------- Coeur de la recommandation ---------------- */
async function getRecommendations(clientId, limit = 5) {
  if (!isValidId(clientId)) throw new Error('Invalid client ID');

  // 1) Historique d’achats du client
  const orders = await Order.find({ client: clientId })
    .populate('items.product', '_id name category description active')
    .lean();

  // ⚠️ Règle métier demandée : NO HISTORY => NO RECO
  if (!orders.length) return [];

  // 2) Infos utiles
  const purchasedIds = new Set(
    orders.flatMap(o => (o.items || [])
      .map(it => it?.product?._id?.toString()).filter(Boolean))
  );
  const purchasedCategories = new Set(
    orders.flatMap(o => (o.items || [])
      .map(it => it?.product?.category).filter(Boolean))
  );

  // 3) Si TF-IDF dispo → reco précise
  const tf = await buildTfIdf();
  if (tf) {
    const boughtIdx = tf.products
      .map((p, i) => (purchasedIds.has(p._id.toString()) ? i : -1))
      .filter(i => i !== -1);

    if (boughtIdx.length) {
      // Palier strict (même catégorie)
      let recos = runTfIdfReco(tf, boughtIdx, purchasedIds, purchasedCategories,
        { sameCategoryOnly: true, minScore: 0.25, minShared: 3, limit });
      if (recos.length) return recos.map(r => r.product);

      // Palier assoupli (même catégorie)
      recos = runTfIdfReco(tf, boughtIdx, purchasedIds, purchasedCategories,
        { sameCategoryOnly: true, minScore: 0.18, minShared: 2, limit });
      if (recos.length) return recos.map(r => r.product);
    }
  }

  // 4) Sinon : fallback **précis** par même catégorie (sans élargir)
  if (purchasedCategories.size) {
    const products = await Product.find({
      $or: [{ active: true }, { isActive: true }, { active: { $exists: false } }],
      category: { $in: [...purchasedCategories] },
      _id: { $nin: [...purchasedIds] },
    }).limit(limit).lean();
    return products;
  }

  // 5) Pas de catégorie exploitable → rien (on reste strict)
  return [];
}

/* ---------------- Controller HTTP ---------------- */
exports.getRecommendationsForClient = async (req, res) => {
  try {
    // Use clientId from params if provided, otherwise use logged-in user's ID
    const clientId = req.params.clientId || req.user?.id;
    const limit = Number(req.query.limit) || 5;

    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    // Vérif JWT (garde-le si tu n'as pas de middleware global)
    const raw = req.headers.authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No authentication token provided' });
    try { jwt.verify(token, process.env.JWT_SECRET); }
    catch { return res.status(401).json({ message: 'Invalid or expired token' }); }

    const products = await getRecommendations(clientId, limit);
    return res.status(200).json(products); // Renvoie DIRECTEMENT des Product[]
  } catch (err) {
    console.error('[RECO] error:', err);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des recommandations',
      error: err.message,
    });
  }
};



