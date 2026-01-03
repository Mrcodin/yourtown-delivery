const mongoose = require('mongoose');

const usualOrderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],
        lastUsed: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
usualOrderSchema.index({ customerId: 1, createdAt: -1 });

// Validation: max 10 saved orders per customer
usualOrderSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments({ customerId: this.customerId });
        if (count >= 10) {
            const error = new Error('Maximum of 10 saved orders per customer reached');
            error.name = 'ValidationError';
            return next(error);
        }
    }
    next();
});

// Validation: max 50 items per order
usualOrderSchema.path('items').validate(function (items) {
    return items.length <= 50;
}, 'Maximum of 50 items per saved order');

module.exports = mongoose.model('UsualOrder', usualOrderSchema);
