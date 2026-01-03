const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            index: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
            sparse: true, // Allow multiple documents without email (guest orders)
        },
        password: {
            type: String,
            minlength: 6,
            select: false, // Don't return password by default
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            index: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: String,
        emailVerificationExpires: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        addresses: [
            {
                label: {
                    type: String,
                    default: 'Home',
                },
                street: String,
                city: String,
                state: String,
                zipCode: String,
                isDefault: {
                    type: Boolean,
                    default: false,
                },
                deliveryInstructions: String,
            },
        ],
        favorites: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                addedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        usualOrder: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1,
                },
            },
        ],
        preferences: {
            deliveryTimePreference: String,
            substitutionPreferences: String,
            notifications: {
                email: {
                    type: Boolean,
                    default: true,
                },
                sms: {
                    type: Boolean,
                    default: false,
                },
            },
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
        lastLoginAt: Date,
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for search
customerSchema.index({ name: 'text', email: 'text' });

// Hash password before saving
customerSchema.pre('save', async function (next) {
    // Skip hashing if password is not modified or undefined (guest customers)
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to check if password matches
customerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Get customer with order count and spent
customerSchema.methods.toProfileJSON = function () {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        isEmailVerified: this.isEmailVerified,
        addresses: this.addresses,
        favorites: this.favorites,
        preferences: this.preferences,
        totalOrders: this.totalOrders,
        totalSpent: this.totalSpent,
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model('Customer', customerSchema);
