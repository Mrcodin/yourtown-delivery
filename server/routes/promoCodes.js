const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCodeController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/validate', promoCodeController.validatePromoCode);

// Protected routes - Admin/Manager only
router.get('/', protect, authorize('admin', 'manager'), promoCodeController.getPromoCodes);
router.post('/', protect, authorize('admin', 'manager'), promoCodeController.createPromoCode);
router.put('/:id', protect, authorize('admin', 'manager'), promoCodeController.updatePromoCode);
router.delete('/:id', protect, authorize('admin', 'manager'), promoCodeController.deletePromoCode);

module.exports = router;
