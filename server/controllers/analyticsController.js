const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Driver = require('../models/Driver');

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue
// @access  Private (Admin)
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const { period = '30days' } = req.query;

        // Calculate date range
        const endDate = new Date();
        let startDate = new Date();
        
        switch (period) {
            case '7days':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30days':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90days':
                startDate.setDate(startDate.getDate() - 90);
                break;
            case '1year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(startDate.getDate() - 30);
        }

        // Get daily revenue
        const dailyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$pricing.total' },
                    orders: { $sum: 1 },
                    avgOrderValue: { $avg: '$pricing.total' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Get total stats
        const totalStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricing.total' },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: '$pricing.total' },
                    totalTips: { $sum: '$pricing.tip' }
                }
            }
        ]);

        // Get payment method breakdown
        const paymentBreakdown = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: '$payment.method',
                    count: { $sum: 1 },
                    revenue: { $sum: '$pricing.total' }
                }
            }
        ]);

        res.json({
            success: true,
            period,
            startDate,
            endDate,
            dailyRevenue,
            totalStats: totalStats[0] || {
                totalRevenue: 0,
                totalOrders: 0,
                avgOrderValue: 0,
                totalTips: 0
            },
            paymentBreakdown
        });
    } catch (error) {
        console.error('Get revenue analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get popular products
// @route   GET /api/analytics/popular-products
// @access  Private (Admin)
exports.getPopularProducts = async (req, res) => {
    try {
        const { period = '30days', limit = 10 } = req.query;

        const endDate = new Date();
        let startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period.replace('days', '')));

        const popularProducts = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    emoji: { $first: '$items.emoji' },
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: parseInt(limit) }
        ]);

        // Get product details
        const productIds = popularProducts.map(p => p._id);
        const products = await Product.find({ _id: { $in: productIds } });
        
        const enrichedProducts = popularProducts.map(pop => {
            const product = products.find(p => p._id.toString() === pop._id.toString());
            return {
                ...pop,
                imageUrl: product?.imageUrl,
                category: product?.category,
                currentPrice: product?.price
            };
        });

        res.json({
            success: true,
            period,
            products: enrichedProducts
        });
    } catch (error) {
        console.error('Get popular products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private (Admin)
exports.getCustomerAnalytics = async (req, res) => {
    try {
        const { period = '30days' } = req.query;

        const endDate = new Date();
        let startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period.replace('days', '')));

        // Total customers
        const totalCustomers = await Customer.countDocuments();
        
        // New customers in period
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Customers with orders in period
        const activeCustomers = await Order.distinct('customerId', {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
        });

        // Customer lifetime value
        const customerLTV = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: '$customerId',
                    totalSpent: { $sum: '$pricing.total' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    avgLifetimeValue: { $avg: '$totalSpent' },
                    avgOrdersPerCustomer: { $avg: '$orderCount' }
                }
            }
        ]);

        // Repeat customer rate
        const repeatCustomers = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: '$customerId',
                    orderCount: { $sum: 1 }
                }
            },
            {
                $match: { orderCount: { $gt: 1 } }
            },
            { $count: 'repeatCount' }
        ]);

        const repeatRate = activeCustomers.length > 0
            ? ((repeatCustomers[0]?.repeatCount || 0) / activeCustomers.length * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            period,
            totalCustomers,
            newCustomers,
            activeCustomers: activeCustomers.length,
            repeatCustomerRate: parseFloat(repeatRate),
            avgLifetimeValue: customerLTV[0]?.avgLifetimeValue || 0,
            avgOrdersPerCustomer: customerLTV[0]?.avgOrdersPerCustomer || 0
        });
    } catch (error) {
        console.error('Get customer analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get peak ordering times
// @route   GET /api/analytics/peak-times
// @access  Private (Admin)
exports.getPeakTimes = async (req, res) => {
    try {
        const { period = '30days' } = req.query;

        const endDate = new Date();
        let startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period.replace('days', '')));

        // Orders by hour of day
        const hourlyOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$pricing.total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Orders by day of week
        const weeklyOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$pricing.total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weeklyData = weeklyOrders.map(item => ({
            day: dayNames[item._id - 1],
            orders: item.orders,
            revenue: item.revenue
        }));

        res.json({
            success: true,
            period,
            hourlyOrders,
            weeklyOrders: weeklyData
        });
    } catch (error) {
        console.error('Get peak times error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get driver performance
// @route   GET /api/analytics/drivers
// @access  Private (Admin)
exports.getDriverPerformance = async (req, res) => {
    try {
        const { period = '30days' } = req.query;

        const endDate = new Date();
        let startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period.replace('days', '')));

        const driverStats = await Order.aggregate([
            {
                $match: {
                    'delivery.driverId': { $exists: true },
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: '$delivery.driverId',
                    totalDeliveries: { $sum: 1 },
                    totalEarnings: {
                        $sum: {
                            $add: [
                                4, // Base pay
                                { $ifNull: ['$pricing.tip', 0] }
                            ]
                        }
                    },
                    totalTips: { $sum: '$pricing.tip' },
                    avgTip: { $avg: '$pricing.tip' }
                }
            },
            { $sort: { totalDeliveries: -1 } }
        ]);

        // Get driver details
        const driverIds = driverStats.map(d => d._id);
        const drivers = await Driver.find({ _id: { $in: driverIds } });

        const enrichedStats = driverStats.map(stat => {
            const driver = drivers.find(d => d._id.toString() === stat._id.toString());
            return {
                ...stat,
                driverName: driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown',
                phone: driver?.phone,
                rating: driver?.rating
            };
        });

        res.json({
            success: true,
            period,
            drivers: enrichedStats
        });
    } catch (error) {
        console.error('Get driver performance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get dashboard summary
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
exports.getDashboardSummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Today's stats
        const todayStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$pricing.total' },
                    orders: { $sum: 1 }
                }
            }
        ]);

        // Last 30 days stats
        const monthStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$pricing.total' },
                    orders: { $sum: 1 },
                    avgOrderValue: { $avg: '$pricing.total' }
                }
            }
        ]);

        // Current active orders
        const activeOrders = await Order.countDocuments({
            status: { $in: ['confirmed', 'shopping', 'picked-up', 'delivering'] }
        });

        // Total customers
        const totalCustomers = await Customer.countDocuments();

        // Active drivers
        const activeDrivers = await Driver.countDocuments({ status: 'online' });

        res.json({
            success: true,
            today: todayStats[0] || { revenue: 0, orders: 0 },
            last30Days: monthStats[0] || { revenue: 0, orders: 0, avgOrderValue: 0 },
            activeOrders,
            totalCustomers,
            activeDrivers
        });
    } catch (error) {
        console.error('Get dashboard summary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
