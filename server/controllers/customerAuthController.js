const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../config/email');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

/**
 * @desc    Register new customer
 * @route   POST /api/customer-auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if customer exists
        const customerExists = await Customer.findOne({ email });
        if (customerExists) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Check if phone exists
        const phoneExists = await Customer.findOne({ phone });
        if (phoneExists) {
            return res.status(400).json({
                success: false,
                message: 'An account with this phone number already exists'
            });
        }

        // Create customer
        const customer = await Customer.create({
            name,
            email,
            password,
            phone
        });

        // Generate verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        customer.emailVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        customer.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await customer.save();

        // Send verification email (optional - can enable later)
        // const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email/${verificationToken}`;
        // await sendEmail({
        //     to: customer.email,
        //     subject: 'Verify Your Email - Hometown Delivery',
        //     html: `<p>Please click <a href="${verificationUrl}">here</a> to verify your email.</p>`
        // });

        // Generate token
        const token = generateToken(customer._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            customer: customer.toProfileJSON()
        });
    } catch (error) {
        console.error('Customer registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating account'
        });
    }
};

/**
 * @desc    Login customer
 * @route   POST /api/customer-auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for customer (include password field)
        const customer = await Customer.findOne({ email }).select('+password');

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if customer is active
        if (!customer.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Check if password matches
        const isMatch = await customer.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        customer.lastLoginAt = Date.now();
        await customer.save();

        // Generate token
        const token = generateToken(customer._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            customer: customer.toProfileJSON()
        });
    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in'
        });
    }
};

/**
 * @desc    Get current customer profile
 * @route   GET /api/customer-auth/me
 * @access  Private (Customer)
 */
exports.getProfile = async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer.id)
            .populate('favorites.productId')
            .populate('usualOrder.productId');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            customer: customer.toProfileJSON()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
};

/**
 * @desc    Update customer profile
 * @route   PUT /api/customer-auth/profile
 * @access  Private (Customer)
 */
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, addresses, preferences } = req.body;

        const customer = await Customer.findById(req.customer.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Update fields
        if (name) customer.name = name;
        if (phone) customer.phone = phone;
        if (addresses) customer.addresses = addresses;
        if (preferences) customer.preferences = { ...customer.preferences, ...preferences };

        await customer.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            customer: customer.toProfileJSON()
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
};

/**
 * @desc    Change password
 * @route   PUT /api/customer-auth/change-password
 * @access  Private (Customer)
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        const customer = await Customer.findById(req.customer.id).select('+password');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check current password
        const isMatch = await customer.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        customer.password = newPassword;
        await customer.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
};

/**
 * @desc    Verify JWT token
 * @route   GET /api/customer-auth/verify
 * @access  Private (Customer)
 */
exports.verifyToken = async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            customer: customer.toProfileJSON()
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

/**
 * @desc    Logout customer
 * @route   POST /api/customer-auth/logout
 * @access  Private (Customer)
 */
exports.logout = async (req, res) => {
    // Since we're using JWT, logout is handled client-side by removing the token
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};
