const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');

// Protect routes - accepts both admin and customer tokens
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if it's a customer or admin token
            if (decoded.type === 'customer') {
                // Customer token
                req.customer = await Customer.findById(decoded.id);
                if (!req.customer || !req.customer.isActive) {
                    return res.status(401).json({
                        success: false,
                        message: 'Customer not found or inactive',
                    });
                }
            } else {
                // Admin/user token
                req.user = await User.findById(decoded.id);
                if (!req.user || req.user.status !== 'active') {
                    return res.status(401).json({
                        success: false,
                        message: 'User not found or inactive',
                    });
                }
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token is invalid or expired',
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
        });
    }
};

// Protect customer routes
exports.protectCustomer = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Please log in to access this feature',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if it's a customer token
            if (decoded.type !== 'customer') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid authentication',
                });
            }

            // Get customer from token
            req.customer = await Customer.findById(decoded.id);

            if (!req.customer || !req.customer.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Customer not found or inactive',
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token is invalid or expired',
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
        });
    }
};

// Protect driver routes
exports.protectDriver = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Please log in to access this feature',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if it's a driver token
            if (decoded.role !== 'driver') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid authentication. Driver access only.',
                });
            }

            // Get driver from token
            req.driver = await Driver.findById(decoded.id);

            if (!req.driver) {
                return res.status(401).json({
                    success: false,
                    message: 'Driver not found',
                });
            }

            if (req.driver.status === 'inactive') {
                return res.status(401).json({
                    success: false,
                    message: 'Driver account is inactive',
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token is invalid or expired',
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
        });
    }
};

// Optional customer authentication (doesn't fail if not authenticated)
exports.optionalCustomerAuth = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            // No token, continue without authentication
            return next();
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if it's a customer token
            if (decoded.type === 'customer') {
                // Get customer from token
                req.customer = await Customer.findById(decoded.id);
            }
        } catch (error) {
            // Token invalid, continue without authentication
            // Don't fail the request
        }

        next();
    } catch (error) {
        // Error in middleware, continue without authentication
        next();
    }
};

// Authorize based on role
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this route`,
            });
        }
        next();
    };
};

// Role levels for hierarchical authorization
const roleLevels = {
    admin: 3,
    manager: 2,
    driver: 1,
};

// Minimum role level authorization
exports.minRole = minRole => {
    return (req, res, next) => {
        const userLevel = roleLevels[req.user.role] || 0;
        const requiredLevel = roleLevels[minRole] || 0;

        if (userLevel < requiredLevel) {
            return res.status(403).json({
                success: false,
                message: `Insufficient permissions. Minimum role required: ${minRole}`,
            });
        }
        next();
    };
};
