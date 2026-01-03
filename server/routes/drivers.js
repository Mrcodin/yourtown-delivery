const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');
const { driverValidation, validate } = require('../middleware/validation');

/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Get all drivers
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Driver'
 */
router.get('/', protect, authorize('admin', 'manager'), driverController.getDrivers);

/**
 * @swagger
 * /api/drivers/{id}:
 *   get:
 *     summary: Get driver by ID
 *     tags: [Drivers]
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
 *         description: Driver details
 */
router.get('/:id', protect, driverController.getDriver);

/**
 * @swagger
 * /api/drivers/{id}/orders:
 *   get:
 *     summary: Get driver's orders
 *     tags: [Drivers]
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
 *         description: List of orders
 */
router.get('/:id/orders', protect, driverController.getDriverOrders);

/**
 * @swagger
 * /api/drivers:
 *   post:
 *     summary: Create new driver
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Driver created
 */
router.post(
    '/',
    protect,
    authorize('admin'),
    driverValidation,
    validate,
    driverController.createDriver
);

/**
 * @swagger
 * /api/drivers/{id}:
 *   put:
 *     summary: Update driver
 *     tags: [Drivers]
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
 *         description: Driver updated
 */
router.put('/:id', protect, authorize('admin', 'manager'), driverController.updateDriver);

/**
 * @swagger
 * /api/drivers/{id}/status:
 *   put:
 *     summary: Update driver status (online/offline)
 *     tags: [Drivers]
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
 *         description: Status updated
 */
router.put('/:id/status', protect, driverController.updateDriverStatus);

/**
 * @swagger
 * /api/drivers/{id}:
 *   delete:
 *     summary: Delete driver
 *     tags: [Drivers]
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
 *         description: Driver deleted
 */
router.delete('/:id', protect, authorize('admin'), driverController.deleteDriver);

module.exports = router;
