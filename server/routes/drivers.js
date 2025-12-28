const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');
const { driverValidation, validate } = require('../middleware/validation');

// Protected routes
router.get('/', protect, authorize('admin', 'manager'), driverController.getDrivers);
router.get('/:id', protect, driverController.getDriver);
router.get('/:id/orders', protect, driverController.getDriverOrders);
router.post('/', protect, authorize('admin'), driverValidation, validate, driverController.createDriver);
router.put('/:id', protect, authorize('admin', 'manager'), driverController.updateDriver);
router.put('/:id/status', protect, driverController.updateDriverStatus);
router.delete('/:id', protect, authorize('admin'), driverController.deleteDriver);

module.exports = router;
