const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customerAuthController');
const { protectCustomer } = require('../middleware/auth');

// Public routes
router.post('/register', customerAuthController.register);
router.post('/login', customerAuthController.login);
router.get('/verify-email/:token', customerAuthController.verifyEmail);
router.post('/resend-verification', customerAuthController.resendVerification);
router.post('/forgot-password', customerAuthController.forgotPassword);
router.put('/reset-password/:token', customerAuthController.resetPassword);

// Protected routes (require customer authentication)
router.get('/me', protectCustomer, customerAuthController.getProfile);
router.put('/profile', protectCustomer, customerAuthController.updateProfile);
router.put('/change-password', protectCustomer, customerAuthController.changePassword);
router.get('/verify', protectCustomer, customerAuthController.verifyToken);
router.post('/logout', protectCustomer, customerAuthController.logout);

module.exports = router;
