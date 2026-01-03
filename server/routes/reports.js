const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/reports/frequently-bought-together/{productId}:
 *   get:
 *     summary: Get frequently bought together suggestions
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: Product suggestions with confidence scores
 */
router.get('/frequently-bought-together/:productId', reportController.getFrequentlyBoughtTogether);

// All other report routes require admin or manager role
router.use(protect, authorize('admin', 'manager'));

/**
 * @swagger
 * /api/reports/summary:
 *   get:
 *     summary: Get business summary statistics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Summary statistics
 */
router.get('/summary', reportController.getSummary);

/**
 * @swagger
 * /api/reports/daily-revenue:
 *   get:
 *     summary: Get daily revenue data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily revenue chart data
 */
router.get('/daily-revenue', reportController.getDailyRevenue);

/**
 * @swagger
 * /api/reports/top-products:
 *   get:
 *     summary: Get top selling products
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top products list
 */
router.get('/top-products', reportController.getTopProducts);

/**
 * @swagger
 * /api/reports/driver-performance:
 *   get:
 *     summary: Get driver performance metrics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver performance data
 */
router.get('/driver-performance', reportController.getDriverPerformance);

/**
 * @swagger
 * /api/reports/customer-insights:
 *   get:
 *     summary: Get customer analytics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer insights data
 */
router.get('/customer-insights', reportController.getCustomerInsights);

/**
 * @swagger
 * /api/reports/pdf:
 *   post:
 *     summary: Generate PDF report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType:
 *                 type: string
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: PDF report generated
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/pdf', reportController.generatePDFReport);

module.exports = router;
