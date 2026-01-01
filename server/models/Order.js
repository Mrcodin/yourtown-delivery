const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  customerInfo: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true,
      index: true
    },
    email: String,
    address: {
      type: String,
      required: true
    }
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    price: Number,
    emoji: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 6.99
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    promoCode: {
      code: String,
      discount: Number,
      promoCodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PromoCode'
      }
    },
    total: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'shopping', 'delivering', 'delivered', 'cancelled'],
    default: 'placed',
    index: true
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'check', 'card'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    transactionId: String,
    stripePaymentIntentId: String
  },
  delivery: {
    timePreference: String,
    estimatedTime: Date,
    actualTime: Date,
    instructions: String,
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    driverName: String
  },
  shopper: {
    shopperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    shopperName: String
  },
  notes: String,
  orderType: {
    type: String,
    enum: ['online', 'phone'],
    default: 'online'
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  cancelledAt: Date,
  cancelReason: String
}, {
  timestamps: true
});

// Indexes for querying
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customerInfo.phone': 1, createdAt: -1 });
orderSchema.index({ 'delivery.driverId': 1 });

// Generate order ID before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
