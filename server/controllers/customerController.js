const Customer = require('../models/Customer');
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (Admin/Manager)
exports.getCustomers = async (req, res) => {
  try {
    const { search, sortBy } = req.query;

    let query = {};

    // Search by name, phone, or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'orders') sortOptions = { totalOrders: -1 };
    if (sortBy === 'spent') sortOptions = { totalSpent: -1 };

    const customers = await Customer.find(query).sort(sortOptions);

    res.json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private (Admin/Manager)
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's order history
    const orders = await Order.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      customer,
      orders
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
};

// @desc    Get customer by phone
// @route   GET /api/customers/by-phone/:phone
// @access  Public (for order tracking) / Private (for admin)
exports.getCustomerByPhone = async (req, res) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Get customer by phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Admin/Manager)
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Log activity
    await ActivityLog.create({
      type: 'customer_update',
      message: `${req.user.name} updated customer: ${customer.name}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { customerId: customer._id }
    });

    res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
};

// @desc    Export customers to CSV
// @route   GET /api/customers/export/csv
// @access  Private (Admin/Manager)
exports.exportCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    // Create CSV content
    const csvHeaders = 'Name,Phone,Email,Total Orders,Total Spent,Joined Date\n';
    const csvRows = customers.map(customer => {
      return [
        customer.name,
        customer.phone,
        customer.email || '',
        customer.totalOrders,
        customer.totalSpent.toFixed(2),
        new Date(customer.createdAt).toLocaleDateString()
      ].join(',');
    }).join('\n');

    const csv = csvHeaders + csvRows;

    // Log activity
    await ActivityLog.create({
      type: 'export_data',
      message: `${req.user.name} exported ${customers.length} customers`,
      userId: req.user._id,
      username: req.user.username
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting customers',
      error: error.message
    });
  }
};
