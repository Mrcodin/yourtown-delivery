const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All report routes require admin or manager role
router.use(protect, authorize('admin', 'manager'));

router.get('/summary', reportController.getSummary);
router.get('/daily-revenue', reportController.getDailyRevenue);
router.get('/top-products', reportController.getTopProducts);
router.get('/driver-performance', reportController.getDriverPerformance);
router.get('/customer-insights', reportController.getCustomerInsights);

module.exports = router;
