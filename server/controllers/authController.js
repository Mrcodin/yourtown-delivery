const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');
const { 
  trackFailedLogin, 
  resetLoginAttempts, 
  isAccountLocked 
} = require('../middleware/security');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
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
        remainingTime: lockCheck.remainingTime
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
          remainingTime: failedAttempt.remainingTime
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsRemaining: failedAttempt.remaining
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
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
          remainingTime: failedAttempt.remainingTime
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsRemaining: failedAttempt.remaining
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
      userAgent: req.headers['user-agent']
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
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
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
      username: req.user.username
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
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
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
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
      role: req.user.role
    }
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
      token
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
};
