const Driver = require('../models/Driver');
const User = require('../models/User');
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private (Admin/Manager)
exports.getDrivers = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by name, phone, or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const drivers = await Driver.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching drivers',
      error: error.message
    });
  }
};

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private (Admin/Manager/Driver themselves)
exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('userId', 'username email');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      driver
    });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver',
      error: error.message
    });
  }
};

// @desc    Create driver
// @route   POST /api/drivers
// @access  Private (Admin only)
exports.createDriver = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, vehicle, payRate, notes } = req.body;

    // Create user account for driver
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const password = 'driver123'; // Default password, should be changed

    const user = await User.create({
      username,
      password,
      name: `${firstName} ${lastName}`,
      role: 'driver',
      email,
      phone
    });

    // Create driver profile
    const driver = await Driver.create({
      userId: user._id,
      firstName,
      lastName,
      phone,
      email,
      vehicle,
      payRate: payRate || 4.00,
      notes
    });

    // Log activity
    await ActivityLog.create({
      type: 'driver_add',
      message: `${req.user.name} added driver: ${firstName} ${lastName}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { driverId: driver._id }
    });

    res.status(201).json({
      success: true,
      driver,
      credentials: {
        username,
        password // Return once so admin can share with driver
      }
    });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating driver',
      error: error.message
    });
  }
};

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private (Admin/Manager)
exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Log activity
    await ActivityLog.create({
      type: 'driver_update',
      message: `${req.user.name} updated driver: ${driver.firstName} ${driver.lastName}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { driverId: driver._id }
    });

    res.json({
      success: true,
      driver
    });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driver',
      error: error.message
    });
  }
};

// @desc    Update driver status
// @route   PUT /api/drivers/:id/status
// @access  Private (Admin/Manager/Driver themselves)
exports.updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Emit socket event for status change
    const io = req.app.get('io');
    io.to('admin-room').emit('driver-status-changed', {
      driverId: driver._id,
      name: `${driver.firstName} ${driver.lastName}`,
      status: driver.status
    });

    res.json({
      success: true,
      driver
    });
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driver status',
      error: error.message
    });
  }
};

// @desc    Delete driver (soft delete)
// @route   DELETE /api/drivers/:id
// @access  Private (Admin only)
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Deactivate user account
    if (driver.userId) {
      await User.findByIdAndUpdate(driver.userId, { status: 'inactive' });
    }

    // Log activity
    await ActivityLog.create({
      type: 'driver_delete',
      message: `${req.user.name} deactivated driver: ${driver.firstName} ${driver.lastName}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { driverId: driver._id }
    });

    res.json({
      success: true,
      message: 'Driver deactivated successfully',
      driver
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting driver',
      error: error.message
    });
  }
};

// @desc    Get driver's order history
// @route   GET /api/drivers/:id/orders
// @access  Private (Admin/Manager/Driver themselves)
exports.getDriverOrders = async (req, res) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;

    let query = { 'delivery.driverId': req.params.id };

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get driver orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver orders',
      error: error.message
    });
  }
};
