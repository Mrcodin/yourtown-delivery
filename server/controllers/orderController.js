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
const { generateReceipt } = require('../utils/pdfReceipt');

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
    
    const { customerInfo, items, payment, delivery, notes, promoCode } = req.body;

    // Validate products and calculate pricing
    let subtotal = 0;
    let taxableItemsSubtotal = 0; // Track taxable items separately
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product || product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product ${item.name} is not available`
        });
      }

      const itemTotal = product.price * item.quantity;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        emoji: product.emoji,
        quantity: item.quantity,
        isTaxable: product.isTaxable || false
      });

      subtotal += itemTotal;
      
      // Track taxable items (non-food: soap, paper products, etc.)
      if (product.isTaxable) {
        taxableItemsSubtotal += itemTotal;
      }
    }

    const deliveryFee = 6.99;
    
    // Calculate discount from promo code if provided
    let discount = 0;
    let promoCodeData = null;
    if (promoCode && promoCode.code && promoCode.discount) {
      discount = promoCode.discount;
      promoCodeData = {
        code: promoCode.code,
        discount: promoCode.discount,
        promoCodeId: promoCode.promoCodeId
      };
    }
    
    // Get tip amount (default to 0 if not provided)
    const tip = req.body.tip || 0;
    
    // Calculate Washington state sales tax
    // NOTE: Groceries are EXEMPT from sales tax in WA state (RCW 82.08.0293)
    // Taxable: delivery fee + non-food items (soap, paper products, cleaning supplies)
    // Non-taxable: all food and food ingredients
    const taxRate = parseFloat(process.env.TAX_RATE) || 0.084; // Chelan County: 8.4%
    const taxableAmount = deliveryFee + taxableItemsSubtotal;
    const tax = taxableAmount * taxRate;
    
    const total = subtotal + deliveryFee + tip + tax - discount;

    // Find or create customer
    // Try to find by phone first, then by email (if provided)
    let customer = await Customer.findOne({ 
      $or: [
        { phone: customerInfo.phone },
        ...(customerInfo.email && customerInfo.email.trim() ? [{ email: customerInfo.email }] : [])
      ]
    });
    
    if (!customer) {
      // Prepare customer data - only include email if it's not empty
      const customerData = {
        name: customerInfo.name,
        phone: customerInfo.phone,
        createdViaOrder: true, // Mark as created via order (no password)
        addresses: [{
          street: customerInfo.address,
          isDefault: true
        }]
      };
      
      // Only add email if it exists and is not empty
      if (customerInfo.email && customerInfo.email.trim()) {
        customerData.email = customerInfo.email;
      }
      
      // Create new customer
      try {
        customer = await Customer.create(customerData);
      } catch (error) {
        // If duplicate error (phone or email), try to find existing customer
        if (error.code === 11000) {
          // Try finding by phone again
          customer = await Customer.findOne({ phone: customerInfo.phone });
          
          if (!customer) {
            // If still not found, there might be a duplicate email, try without email
            delete customerData.email;
            customer = await Customer.create(customerData);
          }
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
        tip,
        tax,
        discount,
        promoCode: promoCodeData,
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

    // Update promo code usage if applicable
    if (promoCodeData && promoCodeData.promoCodeId) {
      const PromoCode = require('../models/PromoCode');
      try {
        await PromoCode.findByIdAndUpdate(
          promoCodeData.promoCodeId,
          {
            $inc: { usageCount: 1 },
            $push: { 
              usedBy: {
                customerId: customer._id,
                orderId: order._id,
                usedAt: new Date()
              }
            }
          }
        );
        console.log('✅ Promo code usage updated');
      } catch (promoError) {
        console.error('⚠️ Failed to update promo code usage:', promoError);
        // Don't fail the order if promo code update fails
      }
    }

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

// @desc    Cancel order (customer self-service)
// @route   PUT /api/orders/:id/cancel
// @access  Public (with order validation)
exports.cancelOrderCustomer = async (req, res) => {
  try {
    const { reason, phone } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify customer owns this order
    if (phone && order.customerInfo.phone !== phone) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this order'
      });
    }

    // Only allow cancellation if order is placed or confirmed
    if (!['placed', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage. Please contact us directly.'
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date()
    });

    await order.save();

    // TODO: Send cancellation email to customer and admin

    // Log activity
    await ActivityLog.create({
      type: 'order_cancel',
      message: `Customer cancelled order ${order.orderId}`,
      metadata: { orderId: order._id, reason }
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to('admin-room').emit('order-cancelled', {
      orderId: order.orderId,
      reason
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

// @desc    Cancel order (admin)
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

// @desc    Generate PDF receipt for an order
// @route   GET /api/orders/:id/receipt
// @access  Public (with order ID) or Private (authenticated)
exports.generateOrderReceipt = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Find order by MongoDB _id or orderId
    let order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      order = await Order.findOne({ orderId }).populate('items.productId');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Generate PDF receipt
    const pdfBuffer = await generateReceipt(order);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${order.orderId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating receipt',
      error: error.message
    });
  }
};
