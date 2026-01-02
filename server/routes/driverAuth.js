const express = require('express');
const router = express.Router();
const driverAuthController = require('../controllers/driverAuthController');
const { protectDriver } = require('../middleware/auth');

// Public routes
router.post('/login', driverAuthController.login);

// Protected routes (require driver authentication)
router.post('/logout', protectDriver, driverAuthController.logout);
router.get('/me', protectDriver, driverAuthController.getMe);
router.put('/profile', protectDriver, driverAuthController.updateProfile);
router.put('/password', protectDriver, driverAuthController.changePassword);
router.get('/deliveries', protectDriver, driverAuthController.getAssignedDeliveries);
router.get('/history', protectDriver, driverAuthController.getDeliveryHistory);
router.put('/orders/:orderId/status', protectDriver, driverAuthController.updateOrderStatus);
router.put('/status', protectDriver, driverAuthController.updateStatus);

module.exports = router;
