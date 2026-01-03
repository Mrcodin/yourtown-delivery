const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getRevenueAnalytics,
    getPopularProducts,
    getCustomerAnalytics,
    getPeakTimes,
    getDriverPerformance,
    getDashboardSummary
} = require('../controllers/analyticsController');

// All analytics routes require admin authentication
router.use(protect);

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard summary with key metrics
// @access  Private (Admin)
router.get('/dashboard', getDashboardSummary);

// @route   GET /api/analytics/revenue
// @desc    Get revenue analytics with trends
// @access  Private (Admin)
router.get('/revenue', getRevenueAnalytics);

// @route   GET /api/analytics/popular-products
// @desc    Get popular products report
// @access  Private (Admin)
router.get('/popular-products', getPopularProducts);

// @route   GET /api/analytics/customers
// @desc    Get customer analytics and retention
// @access  Private (Admin)
router.get('/customers', getCustomerAnalytics);

// @route   GET /api/analytics/peak-times
// @desc    Get peak ordering times analysis
// @access  Private (Admin)
router.get('/peak-times', getPeakTimes);

// @route   GET /api/analytics/drivers
// @desc    Get driver performance metrics
// @access  Private (Admin)
router.get('/drivers', getDriverPerformance);

module.exports = router;
