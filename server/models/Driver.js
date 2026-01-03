const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const driverSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            unique: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false,
        },
        vehicle: {
            type: {
                type: String,
                enum: ['car', 'suv', 'truck', 'van'],
                default: 'car',
            },
            description: String,
            licensePlate: String,
        },
        status: {
            type: String,
            enum: ['online', 'busy', 'offline', 'inactive'],
            default: 'offline',
        },
        rating: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5,
        },
        totalDeliveries: {
            type: Number,
            default: 0,
        },
        earnings: {
            type: Number,
            default: 0,
        },
        payRate: {
            type: Number,
            default: 4.0,
            min: 0,
        },
        joinDate: {
            type: Date,
            default: Date.now,
        },
        notes: {
            type: String,
        },
        availability: {
            monday: { available: { type: Boolean, default: true }, hours: String },
            tuesday: { available: { type: Boolean, default: true }, hours: String },
            wednesday: { available: { type: Boolean, default: true }, hours: String },
            thursday: { available: { type: Boolean, default: true }, hours: String },
            friday: { available: { type: Boolean, default: true }, hours: String },
            saturday: { available: { type: Boolean, default: true }, hours: String },
            sunday: { available: { type: Boolean, default: true }, hours: String },
        },
    },
    {
        timestamps: true,
    }
);

// Virtual for full name
driverSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Encrypt password before saving
driverSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
driverSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
driverSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: 'driver' }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// Index for search
driverSchema.index({ firstName: 'text', lastName: 'text' });

module.exports = mongoose.model('Driver', driverSchema);
