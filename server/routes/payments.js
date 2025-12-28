const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/create-intent', paymentController.createPaymentIntent);
router.post('/confirm', paymentController.confirmPayment);
router.get('/status/:paymentIntentId', paymentController.getPaymentStatus);

// Stripe webhook (raw body needed)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Protected routes
router.post('/refund', protect, authorize('admin'), paymentController.createRefund);

module.exports = router;
