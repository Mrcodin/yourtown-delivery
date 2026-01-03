const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: [
                'login',
                'logout',
                'order_create',
                'order_update',
                'order_cancel',
                'product_add',
                'product_update',
                'product_delete',
                'driver_add',
                'driver_update',
                'driver_delete',
                'customer_add',
                'customer_update',
                'payment_received',
                'export_data',
            ],
        },
        message: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        username: String,
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        ipAddress: String,
        userAgent: String,
    },
    {
        timestamps: true,
    }
);

// Index for querying
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });

// Keep only last 1000 logs (optional cleanup)
activityLogSchema.statics.cleanup = async function () {
    const count = await this.countDocuments();
    if (count > 1000) {
        const logs = await this.find()
            .sort({ createdAt: 1 })
            .limit(count - 1000);
        const ids = logs.map(log => log._id);
        await this.deleteMany({ _id: { $in: ids } });
    }
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
