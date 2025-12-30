const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customerAuthController');
const { protectCustomer } = require('../middleware/auth');

// Public routes
router.post('/register', customerAuthController.register);
router.post('/login', customerAuthController.login);

// Protected routes (require customer authentication)
router.get('/me', protectCustomer, customerAuthController.getProfile);
router.put('/profile', protectCustomer, customerAuthController.updateProfile);
router.put('/change-password', protectCustomer, customerAuthController.changePassword);
router.get('/verify', protectCustomer, customerAuthController.verifyToken);
router.post('/logout', protectCustomer, customerAuthController.logout);

module.exports = router;
