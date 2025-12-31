const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Driver = require('../models/Driver');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail } = require('../config/email');
const { 
  orderConfirmationEmail, 
  orderStatusUpdateEmail, 
  adminNewOrderEmail 
} = require('../utils/emailTemplates');
const { logEmail } = require('./emailController');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin/Manager or Customer for own orders)
exports.getOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, search, driverId, customerId } = req.query;

    let query = {};

    // If customer is requesting, only show their orders
    if (req.customer) {
      query.customerId = req.customer._id;
    } else if (customerId) {
      // Admin can filter by specific customer
      query.customerId = customerId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Filter by driver
    if (driverId) {
      query['delivery.driverId'] = driverId;
    }

    // Search by order ID, customer name, or phone
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'customerInfo.name': { $regex: search, $options: 'i' } },
        { 'customerInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name phone email')
      .populate('delivery.driverId', 'firstName lastName phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private (Admin/Manager) or Order owner
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name phone email')
      .populate('delivery.driverId', 'firstName lastName phone vehicle')
      .populate('items.productId', 'name price category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// @desc    Get order by ID with payment intent verification
// @route   GET /api/orders/public/:id?payment_intent=xxx
// @access  Public (requires valid payment intent for card payments, or recent order for cash/check)
exports.getOrderPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_intent } = req.query;

    // Find order
    const order = await Order.findById(id)
      .populate('delivery.driverId', 'firstName lastName phone')
      .populate('items.productId', 'name price category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify payment intent matches (if order has payment intent and it's provided)
    if (order.payment?.stripePaymentIntentId) {
      if (order.payment.stripePaymentIntentId !== payment_intent) {
        return res.status(403).json({
          success: false,
          message: 'Invalid payment intent for this order'
        });
      }
    } else {
      // For cash/check orders without payment intent, only allow recent orders (within 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (order.createdAt < oneHourAgo) {
        return res.status(403).json({
          success: false,
          message: 'Order access expired. Please log in to view older orders.'
        });
      }
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get public order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// @desc    Track order by phone
// @route   GET /api/orders/track/:phone
// @access  Public (rate limited)
exports.trackOrder = async (req, res) => {
  try {
    const phone = req.params.phone;

    // Find most recent order for this phone number
    const order = await Order.findOne({ 'customerInfo.phone': phone })
      .populate('delivery.driverId', 'firstName lastName phone')
      .sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No order found for this phone number'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking order',
      error: error.message
    });
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    console.log('📦 Creating order - Request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { customerInfo, items, payment, delivery, notes } = req.body;

    // Validate products and calculate pricing
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product || product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product ${item.name} is not available`
        });
      }

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        emoji: product.emoji,
        quantity: item.quantity
      });

      subtotal += product.price * item.quantity;
    }

    const deliveryFee = 6.99;
    const total = subtotal + deliveryFee;

    // Find or create customer
    // Try to find by phone first, then by email
    let customer = await Customer.findOne({ 
      $or: [
        { phone: customerInfo.phone },
        ...(customerInfo.email ? [{ email: customerInfo.email }] : [])
      ]
    });
    
    if (!customer) {
      // Create new customer without email if email might be duplicate
      try {
        customer = await Customer.create({
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || undefined, // Make email optional
          createdViaOrder: true, // Mark as created via order (no password)
          addresses: [{
            street: customerInfo.address,
            isDefault: true
          }]
        });
      } catch (error) {
        // If duplicate email error, create without email
        if (error.code === 11000) {
          customer = await Customer.create({
            name: customerInfo.name,
            phone: customerInfo.phone,
            createdViaOrder: true,
            addresses: [{
              street: customerInfo.address,
              isDefault: true
            }]
          });
        } else {
          throw error;
        }
      }
    }

    // Generate order ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderId = `ORD-${timestamp}-${random}`;

    // Create order
    const order = await Order.create({
      orderId,
      customerId: customer._id,
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email,
        address: customerInfo.address
      },
      items: validatedItems,
      pricing: {
        subtotal,
        deliveryFee,
        total
      },
      status: 'placed',
      payment: {
        method: payment.method,
        status: payment.method === 'cash' ? 'pending' : 'pending'
      },
      delivery: {
        timePreference: delivery?.timePreference,
        instructions: delivery?.instructions
      },
      notes,
      statusHistory: [{
        status: 'placed',
        timestamp: new Date()
      }]
    });

    // Update customer stats
    customer.totalOrders += 1;
    customer.totalSpent += total;
    await customer.save();

    // Emit socket event for new order
    const io = req.app.get('io');
    io.to('admin-room').emit('new-order', {
      orderId: order.orderId,
      customerName: order.customerInfo.name,
      total: order.pricing.total,
      items: order.items.length
    });

    // Send confirmation email to customer
    if (customerInfo.email) {
      try {
        const emailContent = orderConfirmationEmail(order);
        await sendEmail({
          to: customerInfo.email,
          subject: emailContent.subject,
          html: emailContent.html
        });
        
        // Log successful email
        logEmail({
          to: customerInfo.email,
          type: 'order-confirmation',
          subject: emailContent.subject,
          status: 'sent'
        });
      } catch (emailError) {
        console.error('Error sending customer confirmation email:', emailError);
        // Log failed email
        logEmail({
          to: customerInfo.email,
          type: 'order-confirmation',
          subject: 'Order Confirmation',
          status: 'failed',
          error: emailError.message
        });
        // Don't fail the order if email fails
      }
    }

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        const emailContent = adminNewOrderEmail(order);
        await sendEmail({
          to: adminEmail,
          subject: emailContent.subject,
          html: emailContent.html
        });
        
        // Log successful email
        logEmail({
          to: adminEmail,
          type: 'admin-notification',
          subject: emailContent.subject,
          status: 'sent'
        });
      } catch (emailError) {
        console.error('Error sending admin notification email:', emailError);
        // Log failed email
        logEmail({
          to: adminEmail,
          type: 'admin-notification',
          subject: 'New Order Notification',
          status: 'failed',
          error: emailError.message
        });
        // Don't fail the order if email fails
      }
    }

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin/Manager)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    // If delivered, set actual delivery time
    if (status === 'delivered') {
      order.delivery.actualTime = new Date();
      order.payment.status = 'completed';

      // Update driver stats if assigned
      if (order.delivery.driverId) {
        const driver = await Driver.findById(order.delivery.driverId);
        if (driver) {
          driver.totalDeliveries += 1;
          driver.earnings += driver.payRate;
          driver.status = 'online'; // Change from busy to online
          await driver.save();
        }
      }
    }

    await order.save();

    // Log activity
    await ActivityLog.create({
      type: 'order_update',
      message: `${req.user.name} updated order ${order.orderId} status to ${status}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { orderId: order._id, status }
    });

    // Emit socket event for order update
    const io = req.app.get('io');
    io.to('admin-room').emit('order-updated', {
      orderId: order.orderId,
      status: order.status
    });
    io.to(`tracking-${order.customerInfo.phone}`).emit('order-status-changed', {
      orderId: order.orderId,
      status: order.status,
      driverInfo: order.delivery.driverName ? {
        name: order.delivery.driverName
      } : null
    });

    // Send status update email to customer
    if (order.customerInfo.email) {
      try {
        const emailContent = orderStatusUpdateEmail(order, status);
        await sendEmail({
          to: order.customerInfo.email,
          subject: emailContent.subject,
          html: emailContent.html
        });
        
        // Log successful email
        logEmail({
          to: order.customerInfo.email,
          type: 'status-update',
          subject: emailContent.subject,
          status: 'sent'
        });
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
        // Log failed email
        logEmail({
          to: order.customerInfo.email,
          type: 'status-update',
          subject: 'Order Status Update',
          status: 'failed',
          error: emailError.message
        });
        // Don't fail the order if email fails
      }
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// @desc    Assign driver to order
// @route   PUT /api/orders/:id/assign-driver
// @access  Private (Admin/Manager)
exports.assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;

    const order = await Order.findById(req.params.id);
    const driver = await Driver.findById(driverId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Assign driver
    order.delivery.driverId = driver._id;
    order.delivery.driverName = `${driver.firstName} ${driver.lastName}`;
    
    // Update driver status to busy
    driver.status = 'busy';
    await driver.save();

    await order.save();

    // Log activity
    await ActivityLog.create({
      type: 'order_update',
      message: `${req.user.name} assigned ${driver.firstName} ${driver.lastName} to order ${order.orderId}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { orderId: order._id, driverId: driver._id }
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`driver-${driverId}`).emit('order-assigned', {
      orderId: order.orderId,
      customerName: order.customerInfo.name,
      address: order.customerInfo.address
    });

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning driver',
      error: error.message
    });
  }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private (Admin/Manager)
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();

    // Log activity
    await ActivityLog.create({
      type: 'order_cancel',
      message: `${req.user.name} cancelled order ${order.orderId}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { orderId: order._id, reason }
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to('admin-room').emit('order-cancelled', {
      orderId: order.orderId
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};
