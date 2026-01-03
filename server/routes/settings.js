const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/settings
 * @desc    Get business settings (public)
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.getSettings();

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message,
        });
    }
});

/**
 * @route   PUT /api/settings
 * @desc    Update business settings
 * @access  Private (Admin only)
 */
router.put('/', protect, authorize('admin'), async (req, res) => {
    try {
        const updates = req.body;

        // Validate required fields
        if (updates.phone && !updates.phone.match(/^[\d\-\(\)\s]+$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format',
            });
        }

        if (updates.email && !updates.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // Update settings
        const settings = await Settings.updateSettings(updates);

        // Log the activity
        const ActivityLog = require('../models/ActivityLog');
        await ActivityLog.create({
            type: 'product_update', // Using closest matching type
            message: `Updated business settings`,
            userId: req.user._id,
            username: req.user.username,
            metadata: { entity: 'settings', action: 'update' },
        });

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings,
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/settings/reset
 * @desc    Reset settings to defaults
 * @access  Private (Admin only)
 */
router.post('/reset', protect, authorize('admin'), async (req, res) => {
    try {
        // Delete existing settings
        await Settings.deleteMany({});

        // Create new default settings
        const settings = await Settings.create({ singleton: true });

        // Log the activity
        const ActivityLog = require('../models/ActivityLog');
        await ActivityLog.create({
            type: 'product_update', // Using closest matching type
            message: `Reset business settings to defaults`,
            userId: req.user._id,
            username: req.user.username,
            metadata: { entity: 'settings', action: 'reset' },
        });

        res.json({
            success: true,
            message: 'Settings reset to defaults',
            data: settings,
        });
    } catch (error) {
        console.error('Error resetting settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting settings',
            error: error.message,
        });
    }
});

module.exports = router;
