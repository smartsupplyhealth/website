// backend/services/embeddingService.js
require('dotenv').config();
const { ChromaClient } = require('chromadb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CHROMA_COLLECTION_NAME = 'products';

let genAI, embeddingModel, chromaClient;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'placeholder') {
  console.warn("⚠️  Embedding service disabled: GEMINI_API_KEY not provided or using placeholder value");
} else {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
}

// ChromaDB peut fonctionner indépendamment
try {
  chromaClient = new ChromaClient();
} catch (error) {
  console.warn("⚠️  ChromaDB not available:", error.message);
}

const formatProductForEmbedding = (product) => {
  const p = product.toObject ? product.toObject() : product;
  let content = `Nom du produit: ${p.name}\nDescription: ${p.description}\nCatégorie: ${p.category}\nMarque: ${p.brandInfo}\nInstructions:\n${p.usageInstructions}\nAudience: ${p.targetAudience}\n`;
  if (p.technicalSpecs?.length) {
    content += "Spécifications Techniques:\n";
    p.technicalSpecs.forEach(spec => {
      if (spec.specName && spec.specValue) content += `- ${spec.specName}: ${spec.specValue}\n`;
    });
  }
  if (p.faqs?.length) {
    content += "FAQ:\n";
    p.faqs.forEach(faq => {
      if (faq.question && faq.answer) content += `Q: ${faq.question}\nA: ${faq.answer}\n`;
    });
  }
  return content;
};

/**
 * EFFICIENTLY creates or updates the embedding for a SINGLE product.
 * Called by Mongoose hooks.
 */
const upsertProductEmbedding = async (product) => {
  if (!product?._id) return console.error('Embedding Service: Invalid product for upsert.');
  
  // Si les services d'embedding ne sont pas disponibles, on ignore silencieusement
  if (!embeddingModel || !chromaClient) {
    console.warn('⚠️  Embedding services not available - skipping product embedding');
    return;
  }
  
  try {
    console.log(` Embedding Service: Upserting product ID: ${product._id}`);
    const collection = await chromaClient.getOrCreateCollection({ name: CHROMA_COLLECTION_NAME });
    const document = formatProductForEmbedding(product);
    const metadata = { name: product.name, category: product.category, price: String(product.price) };
    const id = String(product._id);
    const result = await embeddingModel.embedContent(document);
    const embedding = result.embedding.values;

    await collection.upsert({
      ids: [id],
      embeddings: [embedding],
      metadatas: [metadata],
      documents: [document],
    });
    console.log(` Embedding Service: Product ID: ${id} processed successfully.`);
  } catch (error) {
    console.error(` Embedding Service: Error upserting product ID: ${product._id}`, error);
  }
};

/**
 * EFFICIENTLY deletes the embedding for a SINGLE product.
 * Called by Mongoose hooks.
 */
const deleteProductEmbedding = async (productId) => {
  if (!productId) return console.error('Embedding Service: Invalid product ID for deletion.');
  
  try {
    const idStr = String(productId);
    console.log(` Embedding Service: Deleting product ID: ${idStr}`);
    const collection = await chromaClient.getCollection({ name: CHROMA_COLLECTION_NAME });
    await collection.delete({ ids: [idStr] });
    console.log(`Embedding Service: Product ID: ${idStr} deleted successfully.`);
  } catch (error) {
    // It's okay if the item doesn't exist. Don't log an error for that.
    if (!error.message.includes("doesn't exist")) {
      console.error(` Embedding Service: Error deleting product ID: ${productId}`, error);
    }
  }
};

/**
 * SLOW - Deletes the entire collection and re-embeds all active products.
 * Called only by a manual script.
 */
const performFullReEmbedding = async () => {
  console.log('🔄 Starting FULL re-embedding of all products...');
  try {
    const products = await Product.find({}).lean();
    if (!products.length) return console.log('⚠️ No active products to embed.');

    console.log(`🗑️ Resetting Chroma collection: "${CHROMA_COLLECTION_NAME}"...`);
    try {
      await chromaClient.deleteCollection({ name: CHROMA_COLLECTION_NAME });
    } catch (error) {
      // Ignore error if collection doesn't exist
      if (!error.message.includes("could not be found")) {
        throw error;
      }
    }
    const collection = await chromaClient.createCollection({ name: CHROMA_COLLECTION_NAME });
    
    const documents = products.map(formatProductForEmbedding);
    const metadatas = products.map(p => ({ name: p.name, category: p.category, price: String(p.price) }));
    const ids = products.map(p => String(p._id));

    console.log(`⚡ Generating ${documents.length} embeddings...`);
    const embeddings = [];
    for (const doc of documents) {
      const result = await embeddingModel.embedContent(doc);
      embeddings.push(result.embedding.values);
    }

    await collection.add({ ids, embeddings, metadatas, documents });
    console.log(`🎉 SUCCESS - Vector database updated with ${products.length} products.`);
  } catch (error) {
    console.error('❌ ERREUR during full re-embedding:', error);
  }
};

module.exports = {
  upsertProductEmbedding,
  deleteProductEmbedding,
  performFullReEmbedding,
};