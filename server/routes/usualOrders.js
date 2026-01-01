const express = require('express');
const router = express.Router();
const usualOrderController = require('../controllers/usualOrderController');

// Public routes (with phone verification)
router.get('/', usualOrderController.getUsualOrders);
router.post('/', usualOrderController.createUsualOrder);
router.put('/:id', usualOrderController.updateUsualOrder);
router.delete('/:id', usualOrderController.deleteUsualOrder);
router.post('/:id/reorder', usualOrderController.reorderUsualOrder);

module.exports = router;
