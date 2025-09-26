const mongoose = require('mongoose');
const { upsertProductEmbedding, deleteProductEmbedding } = require('../services/embeddingService');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    images: [{ type: String }],

    // --- Champs enrichis pour le Chatbot IA ---
    usageInstructions: {
      type: String,
      default: 'Aucune instruction d utilisation fournie.'
    },
    brandInfo: {
      type: String,
      default: 'Aucune information sur la marque fournie.'
    },
    technicalSpecs: [{
      specName: String,
      specValue: String
    }],
    faqs: [{
      question: String,
      answer: String
    }],
    targetAudience: {
      type: String,
      default: 'Non spécifié'
    },
    lastEmbeddingUpdate: {
      type: Date,
      default: Date.now
    }
    // --- Fin des champs pour le Chatbot ---

}, { timestamps: true });

// --- AUTOMATIC EMBEDDING HOOKS ---

// After a product is created or updated via .save()
ProductSchema.post('save', async function(doc, next) {
  console.log(`📝 Hook 'post.save' triggered for product: ${doc._id}`);
  await upsertProductEmbedding(doc);
  next();
});

// After a product is updated via findOneAndUpdate()
ProductSchema.post('findOneAndUpdate', async function(doc, next) {
  if (doc) {
    console.log(`📝 Hook 'post.findOneAndUpdate' triggered for product: ${doc._id}`);
    // We need to fetch the updated doc to pass the full object to the embedding service
    const updatedDoc = await this.model.findById(doc._id);
    await upsertProductEmbedding(updatedDoc);
  }
  next();
});

// After a product is deleted
ProductSchema.post('findOneAndDelete', async function(doc, next) {
  if (doc) {
    console.log(`🗑️ Hook 'post.findOneAndDelete' triggered for product: ${doc._id}`);
    await deleteProductEmbedding(doc._id);
  }
  next();
});





// --- PRE-HOOKS POUR OPTIMISATIONS ---

// Nettoyage des données avant sauvegarde
ProductSchema.pre('save', function(next) {
  // Nettoyer les specs vides
  if (this.technicalSpecs) {
    this.technicalSpecs = this.technicalSpecs.filter(spec => 
      spec.specName && spec.specName.trim() && 
      spec.specValue && spec.specValue.trim()
    );
  }
  
  // Nettoyer les FAQs vides
  if (this.faqs) {
    this.faqs = this.faqs.filter(faq => 
      faq.question && faq.question.trim() && 
      faq.answer && faq.answer.trim()
    );
  }
  
  next();
});

// --- INDEX POUR PERFORMANCES ---
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ supplier: 1 });
ProductSchema.index({ updatedAt: -1 });



module.exports = mongoose.model('Product', ProductSchema);