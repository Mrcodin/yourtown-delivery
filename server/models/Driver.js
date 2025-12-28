const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  vehicle: {
    type: {
      type: String,
      enum: ['car', 'suv', 'truck', 'van'],
      default: 'car'
    },
    description: String,
    licensePlate: String
  },
  status: {
    type: String,
    enum: ['online', 'busy', 'offline', 'inactive'],
    default: 'offline'
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  payRate: {
    type: Number,
    default: 4.00,
    min: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  },
  availability: {
    monday: { available: { type: Boolean, default: true }, hours: String },
    tuesday: { available: { type: Boolean, default: true }, hours: String },
    wednesday: { available: { type: Boolean, default: true }, hours: String },
    thursday: { available: { type: Boolean, default: true }, hours: String },
    friday: { available: { type: Boolean, default: true }, hours: String },
    saturday: { available: { type: Boolean, default: true }, hours: String },
    sunday: { available: { type: Boolean, default: true }, hours: String }
  }
}, {
  timestamps: true
});

// Virtual for full name
driverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for search
driverSchema.index({ firstName: 'text', lastName: 'text' });

module.exports = mongoose.model('Driver', driverSchema);
