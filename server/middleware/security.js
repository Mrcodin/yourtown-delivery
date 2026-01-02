const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const hpp = require('hpp');

/**
 * General API rate limiter
 * Prevents abuse of API endpoints
 * Increased limit for admin dashboard usage
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs (increased for admin dashboard)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Account creation rate limiter
 * Prevents spam account creation
 */
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 account creations per hour
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset rate limiter
 * Prevents abuse of password reset endpoint
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Order creation rate limiter
 * Prevents spam orders
 */
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 orders per hour
  message: {
    success: false,
    message: 'Too many orders from this IP. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Configure helmet for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://api.stripe.com']
    }
  },
  crossOriginEmbedderPolicy: false
});

/**
 * Failed login attempt tracker
 * Store in memory (for production, use Redis)
 */
const loginAttempts = new Map();
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Track failed login attempts
 */
function trackFailedLogin(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || { count: 0, lockUntil: null };
  
  // Check if account is locked
  if (attempts.lockUntil && now < attempts.lockUntil) {
    const remainingTime = Math.ceil((attempts.lockUntil - now) / 1000 / 60);
    return {
      locked: true,
      remainingTime,
      message: `Account temporarily locked. Try again in ${remainingTime} minutes.`
    };
  }
  
  // Reset if lock time has passed
  if (attempts.lockUntil && now >= attempts.lockUntil) {
    loginAttempts.delete(identifier);
    return { locked: false };
  }
  
  // Increment failed attempts
  attempts.count++;
  attempts.lastAttempt = now;
  
  // Lock account after max attempts
  if (attempts.count >= MAX_FAILED_ATTEMPTS) {
    attempts.lockUntil = now + LOCK_TIME;
    loginAttempts.set(identifier, attempts);
    return {
      locked: true,
      remainingTime: 15,
      message: `Too many failed login attempts. Account locked for 15 minutes.`
    };
  }
  
  loginAttempts.set(identifier, attempts);
  return {
    locked: false,
    attempts: attempts.count,
    remaining: MAX_FAILED_ATTEMPTS - attempts.count
  };
}

/**
 * Reset login attempts on successful login
 */
function resetLoginAttempts(identifier) {
  loginAttempts.delete(identifier);
}

/**
 * Check if account is locked
 */
function isAccountLocked(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) return { locked: false };
  
  if (attempts.lockUntil && now < attempts.lockUntil) {
    const remainingTime = Math.ceil((attempts.lockUntil - now) / 1000 / 60);
    return {
      locked: true,
      remainingTime,
      message: `Account temporarily locked. Try again in ${remainingTime} minutes.`
    };
  }
  
  // Clear expired lock
  if (attempts.lockUntil && now >= attempts.lockUntil) {
    loginAttempts.delete(identifier);
  }
  
  return { locked: false };
}

/**
 * Clean up old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [identifier, attempts] of loginAttempts.entries()) {
    if (attempts.lockUntil && now >= attempts.lockUntil) {
      loginAttempts.delete(identifier);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

module.exports = {
  apiLimiter,
  authLimiter,
  createAccountLimiter,
  passwordResetLimiter,
  orderLimiter,
  helmetConfig,
  mongoSanitize: mongoSanitize(),
  hpp: hpp(),
  trackFailedLogin,
  resetLoginAttempts,
  isAccountLocked
};
