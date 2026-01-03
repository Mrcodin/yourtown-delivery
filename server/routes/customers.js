const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');
const { customerValidation, validate } = require('../middleware/validation');

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 */
router.get('/', protect, authorize('admin', 'manager'), customerController.getCustomers);

/**
 * @swagger
 * /api/customers/export/csv:
 *   get:
 *     summary: Export customers to CSV
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 */
router.get('/export/csv', protect, authorize('admin', 'manager'), customerController.exportCustomers);

/**
 * @swagger
 * /api/customers/by-phone/{phone}:
 *   get:
 *     summary: Get customer by phone number
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer found
 */
router.get('/by-phone/:phone', customerController.getCustomerByPhone);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
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
 *         description: Customer details
 */
router.get('/:id', protect, authorize('admin', 'manager'), customerController.getCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
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
 *         description: Customer updated
 */
router.put('/:id', protect, authorize('admin', 'manager'), customerValidation, validate, customerController.updateCustomer);

module.exports = router;
