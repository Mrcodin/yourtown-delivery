const Order = require('../models/Order');
const Driver = require('../models/Driver');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc    Get summary statistics
// @route   GET /api/reports/summary
// @access  Private (Admin/Manager)
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total orders and revenue
    const orders = await Order.find({ ...dateFilter, status: { $ne: 'cancelled' } });
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Delivery rate (delivered vs total)
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
    const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      summary: {
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        avgOrderValue: avgOrderValue.toFixed(2),
        deliveryRate: deliveryRate.toFixed(1),
        ordersByStatus
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching summary',
      error: error.message
    });
  }
};

// @desc    Get daily revenue
// @route   GET /api/reports/daily-revenue
// @access  Private (Admin/Manager)
exports.getDailyRevenue = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      dailyRevenue
    });
  } catch (error) {
    console.error('Get daily revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily revenue',
      error: error.message
    });
  }
};

// @desc    Get top selling products
// @route   GET /api/reports/top-products
// @access  Private (Admin/Manager)
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const topProducts = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          emoji: { $first: '$items.emoji' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      topProducts
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top products',
      error: error.message
    });
  }
};

// @desc    Get driver performance
// @route   GET /api/reports/driver-performance
// @access  Private (Admin/Manager)
exports.getDriverPerformance = async (req, res) => {
  try {
    const drivers = await Driver.find({ status: { $ne: 'inactive' } })
      .select('firstName lastName totalDeliveries earnings rating status')
      .sort({ totalDeliveries: -1 });

    res.json({
      success: true,
      drivers
    });
  } catch (error) {
    console.error('Get driver performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver performance',
      error: error.message
    });
  }
};

// @desc    Get customer insights
// @route   GET /api/reports/customer-insights
// @access  Private (Admin/Manager)
exports.getCustomerInsights = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const repeatCustomers = await Customer.countDocuments({ totalOrders: { $gt: 1 } });
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Average customer lifetime value
    const customers = await Customer.find();
    const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const avgLifetimeValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    // Top customers
    const topCustomers = await Customer.find()
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name phone totalOrders totalSpent');

    res.json({
      success: true,
      insights: {
        totalCustomers,
        repeatCustomers,
        repeatRate: repeatRate.toFixed(1),
        avgLifetimeValue: avgLifetimeValue.toFixed(2),
        topCustomers
      }
    });
  } catch (error) {
    console.error('Get customer insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer insights',
      error: error.message
    });
  }
};
