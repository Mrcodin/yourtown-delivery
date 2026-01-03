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

/**
 * @swagger
 * /api/orders/track/{phone}:
 *   get:
 *     summary: Track orders by phone number
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders found
 */
router.get('/track/:phone', trackLimiter, orderController.trackOrder);

/**
 * @swagger
 * /api/orders/public/{id}:
 *   get:
 *     summary: Get order details (public, with payment verification)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.get('/public/:id', orderController.getOrderPublic);

/**
 * @swagger
 * /api/orders/{id}/receipt:
 *   get:
 *     summary: Generate PDF receipt for order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF receipt generated
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/receipt', orderController.generateOrderReceipt);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - items
 *               - deliveryAddress
 *               - paymentMethod
 *             properties:
 *               customer:
 *                 type: object
 *               items:
 *                 type: array
 *               deliveryAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *               specialInstructions:
 *                 type: string
 *               tip:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.post('/', orderLimiter, orderValidation, validate, orderController.createOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel order (customer self-service)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.put('/:id/cancel', orderController.cancelOrderCustomer);

/**
 * @swagger
 * /api/orders/{id}/modify:
 *   put:
 *     summary: Modify order items
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *     responses:
 *       200:
 *         description: Order modified successfully
 */
router.put('/:id/modify', protect, orderController.modifyOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (filtered by user role)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get('/', protect, orderController.getOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.get('/:id', protect, orderController.getOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (admin/manager only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, preparing, ready, out-for-delivery, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.put('/:id/status', protect, authorize('admin', 'manager'), orderController.updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/assign-driver:
 *   put:
 *     summary: Assign driver to order (admin/manager only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *             properties:
 *               driverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver assigned successfully
 */
router.put('/:id/assign-driver', protect, authorize('admin', 'manager'), orderController.assignDriver);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Cancel/delete order (admin/manager only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.delete('/:id', protect, authorize('admin', 'manager'), orderController.cancelOrder);

module.exports = router;
