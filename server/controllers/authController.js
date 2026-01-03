const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');
const { trackFailedLogin, resetLoginAttempts, isAccountLocked } = require('../middleware/security');

// Generate JWT Token
const generateToken = userId => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if account is locked
        const lockCheck = isAccountLocked(username);
        if (lockCheck.locked) {
            return res.status(429).json({
                success: false,
                message: lockCheck.message,
                remainingTime: lockCheck.remainingTime,
            });
        }

        // Find user and include password field
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            // Track failed attempt
            const failedAttempt = trackFailedLogin(username);
            if (failedAttempt.locked) {
                return res.status(429).json({
                    success: false,
                    message: failedAttempt.message,
                    remainingTime: failedAttempt.remainingTime,
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                attemptsRemaining: failedAttempt.remaining,
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive',
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            // Track failed attempt
            const failedAttempt = trackFailedLogin(username);
            if (failedAttempt.locked) {
                return res.status(429).json({
                    success: false,
                    message: failedAttempt.message,
                    remainingTime: failedAttempt.remainingTime,
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                attemptsRemaining: failedAttempt.remaining,
            });
        }

        // Reset login attempts on successful login
        resetLoginAttempts(username);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Log activity
        await ActivityLog.create({
            type: 'login',
            message: `${user.name} logged in`,
            userId: user._id,
            username: user.username,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message,
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        // Log activity
        await ActivityLog.create({
            type: 'logout',
            message: `${req.user.name} logged out`,
            userId: req.user._id,
            username: req.user.username,
        });

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging out',
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
        });
    }
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
exports.verifyToken = async (req, res) => {
    res.json({
        success: true,
        valid: true,
        user: {
            id: req.user._id,
            username: req.user.username,
            name: req.user.name,
            role: req.user.role,
        },
    });
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
exports.refreshToken = async (req, res) => {
    try {
        const token = generateToken(req.user._id);

        res.json({
            success: true,
            token,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Error refreshing token',
        });
    }
};

// @desc    Update customer profile
// @route   PUT /api/auth/profile
// @access  Private (Customer)
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const customer = await Customer.findById(req.user._id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        // Check if email is being changed and already exists
        if (email && email !== customer.email) {
            const emailExists = await Customer.findOne({ email, _id: { $ne: req.user._id } });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use',
                });
            }
            customer.email = email;
            customer.isEmailVerified = false; // Reset verification if email changes
        }

        // Check if phone is being changed and already exists
        if (phone && phone !== customer.phone) {
            const phoneExists = await Customer.findOne({ phone, _id: { $ne: req.user._id } });
            if (phoneExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already in use',
                });
            }
            customer.phone = phone;
        }

        if (name) customer.name = name;

        await customer.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message,
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private (Customer)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
            });
        }

        // Get customer with password field
        const customer = await Customer.findById(req.user._id).select('+password');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        // Check current password
        const isMatch = await customer.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Set new password (will be hashed by pre-save hook)
        customer.password = newPassword;
        await customer.save();

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message,
        });
    }
};

// @desc    Update notification preferences
// @route   PUT /api/auth/preferences
// @access  Private (Customer)
exports.updatePreferences = async (req, res) => {
    try {
        const { emailNotifications, smsNotifications } = req.body;

        const customer = await Customer.findById(req.user._id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        // Update preferences
        if (!customer.preferences) {
            customer.preferences = { notifications: {} };
        }
        if (!customer.preferences.notifications) {
            customer.preferences.notifications = {};
        }

        if (typeof emailNotifications === 'boolean') {
            customer.preferences.notifications.email = emailNotifications;
        }
        if (typeof smsNotifications === 'boolean') {
            customer.preferences.notifications.sms = smsNotifications;
        }

        await customer.save();

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences: customer.preferences,
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating preferences',
            error: error.message,
        });
    }
};
