const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { productValidation, validate } = require('../middleware/validation');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);

// Protected routes
router.post('/', protect, authorize('admin', 'manager'), productValidation, validate, productController.createProduct);
router.put('/:id', protect, authorize('admin', 'manager'), productValidation, validate, productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);

// Image upload route
router.post('/:id/image', protect, authorize('admin', 'manager'), upload.single('image'), productController.uploadProductImage);

module.exports = router;
