const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide a promo code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: [true, 'Please provide a discount value'],
    min: 0
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number, // Maximum discount for percentage-based codes
    default: null
  },
  usageLimit: {
    type: Number, // Total number of times the code can be used
    default: null // null = unlimited
  },
  usageCount: {
    type: Number,
    default: 0
  },
  perCustomerLimit: {
    type: Number, // Number of times each customer can use it
    default: 1
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: [true, 'Please provide an expiry date']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }], // Empty array = all products
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  firstTimeCustomersOnly: {
    type: Boolean,
    default: false
  },
  usedBy: [{
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    orderAmount: Number
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
PromoCodeSchema.index({ code: 1 });
PromoCodeSchema.index({ validFrom: 1, validUntil: 1 });
PromoCodeSchema.index({ isActive: 1 });

// Method to check if promo code is valid
PromoCodeSchema.methods.isValid = function(customerId = null, orderAmount = 0) {
  const now = new Date();
  
  // Check if code is active
  if (!this.isActive) {
    return { valid: false, message: 'This promo code is no longer active' };
  }
  
  // Check date validity
  if (now < this.validFrom) {
    return { valid: false, message: 'This promo code is not yet valid' };
  }
  
  if (now > this.validUntil) {
    return { valid: false, message: 'This promo code has expired' };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, message: 'This promo code has reached its usage limit' };
  }
  
  // Check minimum order amount
  if (orderAmount < this.minimumOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of $${this.minimumOrderAmount.toFixed(2)} required`
    };
  }
  
  // Check per-customer usage limit
  if (customerId) {
    const customerUsage = this.usedBy.filter(
      usage => usage.customer.toString() === customerId.toString()
    ).length;
    
    if (customerUsage >= this.perCustomerLimit) {
      return {
        valid: false,
        message: 'You have already used this promo code the maximum number of times'
      };
    }
  }
  
  return { valid: true };
};

// Method to calculate discount
PromoCodeSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    // Apply max discount cap if set
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    // Fixed amount discount
    discount = this.discountValue;
  }
  
  // Discount cannot exceed order amount
  if (discount > orderAmount) {
    discount = orderAmount;
  }
  
  return Number(discount.toFixed(2));
};

module.exports = mongoose.model('PromoCode', PromoCodeSchema);
