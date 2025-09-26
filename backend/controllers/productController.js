const mongoose = require('mongoose');
const Product = require('../models/Product');

// Create product (handles JSON data)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, usageInstructions, brandInfo, targetAudience, technicalSpecs, faqs } = req.body;
    
    const product = new Product({
      supplier: req.user.id,
      name, description, price, stock, category,
      usageInstructions, brandInfo, targetAudience, technicalSpecs, faqs,
      images: [] // Images are now uploaded separately
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Error in createProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update product (handles JSON data)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, supplier: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Update all fields from request body
    Object.assign(product, req.body);

    // Parse JSON fields if they exist
    if (req.body.technicalSpecs) {
      product.technicalSpecs = JSON.parse(req.body.technicalSpecs);
    }
    if (req.body.faqs) {
      product.faqs = JSON.parse(req.body.faqs);
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => '/uploads/' + file.filename);
      // Replace old images with new ones
      product.images = newImages;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error in updateProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

// Upload images for a product
exports.uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, supplier: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => '/uploads/' + file.filename);
      product.images = [...product.images, ...newImages]; // Append new images
      await product.save();
    }
    res.json(product);
  } catch (err) {
    console.error('Error in uploadProductImages:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Instead of deleting, you might want to set an 'active' flag to false (soft delete)
    const result = await Product.deleteOne({ _id: id, supplier: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    const product = await Product.findById(id).populate('supplier', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error in getProductById:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all products for the logged-in supplier
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, q, category } = req.query;
    const filter = { supplier: req.user.id };
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .populate('supplier', 'name') // <-- Added populate for consistency
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Product.countDocuments(filter);

    res.json({
      data: products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    console.error('Error in getProducts:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get products for the client catalog view
exports.getProductsForClient = async (req, res) => {
  try {
    const { page = 1, limit = 10, q, category } = req.query;
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .populate('supplier', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(filter);

    res.json({
      data: products,
      pages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    console.error('Error in getProductsForClient:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all unique categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error('Error in getAllCategories:', err);
    res.status(500).json({ message: err.message });
  }
};

// Add a new category
exports.addCategory = async (req, res) => {
  try {
    // This is a placeholder implementation. In a real app, you'd have a separate Category collection.
    const { category } = req.body;
    if (!category) return res.status(400).json({ message: 'Category name is required' });
    // Logic to add category, perhaps check if it exists
    res.status(201).json({ message: `Category '${category}' added notionally.` });
  } catch (err) {
    console.error('Error in addCategory:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, set } = req.body;
    const product = await Product.findOne({ _id: id, supplier: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (typeof set === 'number') product.stock = set;
    else if (typeof delta === 'number') product.stock = Math.max(0, product.stock + delta);

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error in updateStock:', err);
    res.status(500).json({ message: err.message });
  }
};


