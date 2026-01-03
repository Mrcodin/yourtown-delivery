const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customerAuthController');
const { protectCustomer, optionalCustomerAuth } = require('../middleware/auth');
const {
    authLimiter,
    createAccountLimiter,
    passwordResetLimiter,
} = require('../middleware/security');

// Public routes - with rate limiting
router.post('/register', createAccountLimiter, customerAuthController.register);
router.post('/login', authLimiter, customerAuthController.login);
router.get('/verify-email/:token', customerAuthController.verifyEmail);
router.post(
    '/resend-verification',
    authLimiter,
    optionalCustomerAuth,
    customerAuthController.resendVerification
);
router.post('/forgot-password', passwordResetLimiter, customerAuthController.forgotPassword);
router.put('/reset-password/:token', authLimiter, customerAuthController.resetPassword);

// Protected routes (require customer authentication)
router.get('/me', protectCustomer, customerAuthController.getProfile);
router.put('/profile', protectCustomer, customerAuthController.updateProfile);
router.put('/change-password', protectCustomer, customerAuthController.changePassword);
router.get('/verify', protectCustomer, customerAuthController.verifyToken);
router.post('/logout', protectCustomer, customerAuthController.logout);

module.exports = router;
