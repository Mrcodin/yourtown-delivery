const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getEmailConfig,
    saveEmailConfig,
    testConnection,
    sendTestEmail,
    getEmailHistory
} = require('../controllers/emailController');

// All routes require authentication and admin access
router.use(protect);
router.use(authorize('admin', 'manager'));

// Email configuration routes
router.get('/config', getEmailConfig);
router.post('/config', saveEmailConfig);

// Testing routes
router.post('/test-connection', testConnection);
router.post('/send-test', sendTestEmail);

// History route
router.get('/history', getEmailHistory);

module.exports = router;
