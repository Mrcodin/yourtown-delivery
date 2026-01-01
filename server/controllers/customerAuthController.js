const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../config/email');
const { 
  trackFailedLogin, 
  resetLoginAttempts, 
  isAccountLocked 
} = require('../middleware/security');

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

        // Send verification email
        try {
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/verify-email.html?token=${verificationToken}`;
            const { emailVerificationEmail } = require('../utils/emailTemplates');
            const emailContent = emailVerificationEmail(customer.name, verificationUrl);
            
            await sendEmail({
                to: customer.email,
                ...emailContent
            });
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // Don't fail registration if email sending fails
        }

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

        // Check if account is locked
        const lockCheck = isAccountLocked(email);
        if (lockCheck.locked) {
            return res.status(429).json({
                success: false,
                message: lockCheck.message,
                remainingTime: lockCheck.remainingTime
            });
        }

        // Check for customer (include password field)
        const customer = await Customer.findOne({ email }).select('+password');

        if (!customer) {
            // Track failed attempt
            const failedAttempt = trackFailedLogin(email);
            if (failedAttempt.locked) {
                return res.status(429).json({
                    success: false,
                    message: failedAttempt.message,
                    remainingTime: failedAttempt.remainingTime
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                attemptsRemaining: failedAttempt.remaining
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
            // Track failed attempt
            const failedAttempt = trackFailedLogin(email);
            if (failedAttempt.locked) {
                return res.status(429).json({
                    success: false,
                    message: failedAttempt.message,
                    remainingTime: failedAttempt.remainingTime
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                attemptsRemaining: failedAttempt.remaining
            });
        }

        // Reset login attempts on successful login
        resetLoginAttempts(email);

        // Update last login
        customer.lastLoginAt = Date.now();
        await customer.save();

        // Generate token
        const token = generateToken(customer._id);

        // Add verification warning if email not verified
        const response = {
            success: true,
            message: customer.isEmailVerified ? 'Login successful' : 'Login successful - Please verify your email',
            token,
            customer: customer.toProfileJSON(),
            emailVerified: customer.isEmailVerified
        };

        if (!customer.isEmailVerified) {
            response.warning = 'Please verify your email address to unlock all features';
        }

        res.json(response);
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
 * @desc    Verify email
 * @route   GET /api/customer-auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = async (req, res) => {
    try {
        // Hash the token from URL
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // Find customer with matching token that hasn't expired
        const customer = await Customer.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!customer) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Mark email as verified
        customer.isEmailVerified = true;
        customer.emailVerificationToken = undefined;
        customer.emailVerificationExpires = undefined;
        await customer.save();

        // Send confirmation email
        try {
            const { emailVerifiedEmail } = require('../utils/emailTemplates');
            const emailContent = emailVerifiedEmail(customer.name);
            await sendEmail({
                to: customer.email,
                ...emailContent
            });
        } catch (emailError) {
            console.error('Error sending verification confirmation email:', emailError);
            // Don't fail the verification if email sending fails
        }

        res.json({
            success: true,
            message: 'Email verified successfully! You can now log in.'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email'
        });
    }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/customer-auth/resend-verification
 * @access  Public
 */
exports.resendVerification = async (req, res) => {
    try {
        // Support both authenticated and public requests
        let email = req.body.email;
        
        // If authenticated, get email from token
        if (req.customer && req.customer._id) {
            const authCustomer = await Customer.findById(req.customer._id);
            if (authCustomer) {
                email = authCustomer.email;
            }
        }
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const customer = await Customer.findOne({ email });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'No account found with that email'
            });
        }

        if (customer.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        customer.emailVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        customer.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await customer.save();

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/verify-email.html?token=${verificationToken}`;
        
        const { emailVerificationEmail } = require('../utils/emailTemplates');
        const emailContent = emailVerificationEmail(customer.name, verificationUrl);
        
        await sendEmail({
            to: customer.email,
            ...emailContent
        });

        res.json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending verification email'
        });
    }
};

/**
 * @desc    Request password reset
 * @route   POST /api/customer-auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const customer = await Customer.findOne({ email });

        if (!customer) {
            // Don't reveal whether email exists for security
            return res.json({
                success: true,
                message: 'If an account exists with that email, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        customer.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        customer.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await customer.save();

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/reset-password.html?token=${resetToken}`;
        
        const { passwordResetEmail } = require('../utils/emailTemplates');
        const emailContent = passwordResetEmail(customer.name, resetUrl);
        
        try {
            await sendEmail({
                to: customer.email,
                ...emailContent
            });
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
            // Clear reset token if email fails
            customer.passwordResetToken = undefined;
            customer.passwordResetExpires = undefined;
            await customer.save();
            
            return res.status(500).json({
                success: false,
                message: 'Error sending password reset email. Please try again.'
            });
        }

        res.json({
            success: true,
            message: 'If an account exists with that email, a password reset link has been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing password reset request'
        });
    }
};

/**
 * @desc    Reset password
 * @route   PUT /api/customer-auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Hash the token from URL
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // Find customer with matching token that hasn't expired
        const customer = await Customer.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+password');

        if (!customer) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Update password
        customer.password = password; // Will be hashed by pre-save hook
        customer.passwordResetToken = undefined;
        customer.passwordResetExpires = undefined;
        await customer.save();

        // Generate new JWT token
        const token = generateToken(customer._id);

        res.json({
            success: true,
            message: 'Password reset successfully!',
            token
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
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
