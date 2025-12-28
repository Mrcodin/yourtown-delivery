const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/auth');

// All activity log routes require admin role
router.get('/', protect, authorize('admin'), activityLogController.getActivityLogs);
router.post('/', protect, authorize('admin', 'manager'), activityLogController.createActivityLog);

module.exports = router;
