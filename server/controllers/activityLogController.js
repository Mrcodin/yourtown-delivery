const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs
// @route   GET /api/activity-logs
// @access  Private (Admin only)
exports.getActivityLogs = async (req, res) => {
    try {
        const { type, userId, startDate, endDate, limit = 100 } = req.query;

        let query = {};

        // Filter by type
        if (type) {
            query.type = type;
        }

        // Filter by user
        if (userId) {
            query.userId = userId;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await ActivityLog.find(query)
            .populate('userId', 'name username role')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const totalCount = await ActivityLog.countDocuments(query);

        res.json({
            success: true,
            count: logs.length,
            totalCount,
            logs,
        });
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching activity logs',
            error: error.message,
        });
    }
};

// @desc    Create activity log
// @route   POST /api/activity-logs
// @access  Private (Admin/Manager)
exports.createActivityLog = async (req, res) => {
    try {
        const { type, message, metadata } = req.body;

        const log = await ActivityLog.create({
            type,
            message,
            userId: req.user._id,
            username: req.user.username,
            metadata,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.status(201).json({
            success: true,
            log,
        });
    } catch (error) {
        console.error('Create activity log error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating activity log',
            error: error.message,
        });
    }
};
