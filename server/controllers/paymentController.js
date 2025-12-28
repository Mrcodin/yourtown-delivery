const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Public
exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Public
exports.confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      const order = await Order.findOne({ orderId });
      
      if (order) {
        order.payment.status = 'completed';
        order.payment.transactionId = paymentIntent.id;
        order.payment.stripePaymentIntentId = paymentIntent.id;
        await order.save();

        // Log activity
        await ActivityLog.create({
          type: 'payment_received',
          message: `Payment received for order ${orderId}`,
          metadata: { 
            orderId: order._id, 
            amount: paymentIntent.amount / 100,
            paymentIntentId: paymentIntent.id
          }
        });
      }

      res.json({
        success: true,
        message: 'Payment confirmed',
        paymentStatus: paymentIntent.status
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful',
        paymentStatus: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

// @desc    Get payment status
// @route   GET /api/payments/status/:paymentIntentId
// @access  Public
exports.getPaymentStatus = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);

    res.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status',
      error: error.message
    });
  }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public (Stripe only)
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful:', paymentIntent.id);
      
      // Update order in database
      const order = await Order.findOne({ 
        'payment.stripePaymentIntentId': paymentIntent.id 
      });
      
      if (order) {
        order.payment.status = 'completed';
        await order.save();

        // Emit socket event
        const io = req.app.get('io');
        io.to('admin-room').emit('payment-received', {
          orderId: order.orderId,
          amount: paymentIntent.amount / 100
        });
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      
      const failedOrder = await Order.findOne({ 
        'payment.stripePaymentIntentId': failedPayment.id 
      });
      
      if (failedOrder) {
        failedOrder.payment.status = 'failed';
        await failedOrder.save();
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// @desc    Create refund
// @route   POST /api/payments/refund
// @access  Private (Admin only)
exports.createRefund = async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
      reason: reason || 'requested_by_customer'
    });

    // Log activity
    await ActivityLog.create({
      type: 'payment_received',
      message: `${req.user.name} issued refund: $${refund.amount / 100}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { 
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount / 100
      }
    });

    res.json({
      success: true,
      refund
    });
  } catch (error) {
    console.error('Create refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating refund',
      error: error.message
    });
  }
};
