const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// Public endpoint for frequently bought together (no auth required)
router.get('/frequently-bought-together/:productId', reportController.getFrequentlyBoughtTogether);

// All other report routes require admin or manager role
router.use(protect, authorize('admin', 'manager'));

router.get('/summary', reportController.getSummary);
router.get('/daily-revenue', reportController.getDailyRevenue);
router.get('/top-products', reportController.getTopProducts);
router.get('/driver-performance', reportController.getDriverPerformance);
router.get('/customer-insights', reportController.getCustomerInsights);
router.post('/pdf', reportController.generatePDFReport);

module.exports = router;
