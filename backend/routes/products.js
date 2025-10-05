const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth } = require('../middleware/auth'); // Assuming authorize is for role checks
const upload = require('../middleware/upload');

// --- Routes Protégées ---

// POST create new product (handles JSON data)
router.post('/', auth, productController.createProduct);

// GET all products for the logged-in supplier
router.get('/supplier', auth, productController.getProducts);

// GET all unique categories
router.get('/categories', productController.getAllCategories);

// POST a new category
router.post('/categories', auth, productController.addCategory);

// GET products for the client catalog view
router.get('/client-dashboard/catalog', auth, productController.getProductsForClient);

// GET similar products by category
router.get('/similar/:productId', auth, productController.getSimilarProducts);

// GET a single product by ID (must be last among GET routes)
router.get('/:id', auth, productController.getProductById);

// PUT update a product by ID
router.put('/:id', auth, upload.array('images', 10), productController.updateProduct);

// POST to upload images for a specific product
router.post('/:id/images', auth, upload.array('images', 10), productController.uploadProductImages);

// Ajuster le stock
router.patch('/:id/stock', auth, productController.updateStock);

// DELETE a product by ID
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;

