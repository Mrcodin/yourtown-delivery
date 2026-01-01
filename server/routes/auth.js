const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginValidation, validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

// Public routes - with strict rate limiting
router.post('/login', authLimiter, loginValidation, validate, authController.login);

// Protected routes
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.get('/verify', protect, authController.verifyToken);
router.post('/refresh', protect, authController.refreshToken);

module.exports = router;
