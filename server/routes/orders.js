const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { orderValidation, validate } = require('../middleware/validation');
const { orderLimiter } = require('../middleware/security');

// Rate limiter specifically for order tracking
const rateLimit = require('express-rate-limit');
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many tracking requests, please try again later'
});

// Public routes with rate limiting
router.get('/track/:phone', trackLimiter, orderController.trackOrder);
router.get('/public/:id', orderController.getOrderPublic); // Public order retrieval with payment intent verification
router.get('/:id/receipt', orderController.generateOrderReceipt); // PDF receipt generation
router.post('/', orderLimiter, orderValidation, validate, orderController.createOrder); // Order creation with rate limit
router.put('/:id/cancel', orderController.cancelOrderCustomer); // Customer self-service cancellation

// Protected routes
router.get('/', protect, orderController.getOrders); // Allow both admin and customer
router.get('/:id', protect, orderController.getOrder);
router.put('/:id/status', protect, authorize('admin', 'manager'), orderController.updateOrderStatus);
router.put('/:id/assign-driver', protect, authorize('admin', 'manager'), orderController.assignDriver);
router.delete('/:id', protect, authorize('admin', 'manager'), orderController.cancelOrder);

module.exports = router;
