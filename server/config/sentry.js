/**
 * Sentry Error Tracking Configuration
 * Monitors server-side errors and performance
 */

const Sentry = require('@sentry/node');

/**
 * Initialize Sentry error tracking
 * Call this before any other app middleware
 */
function initSentry(app) {
    // Only initialize if DSN is configured
    if (!process.env.SENTRY_DSN) {
        console.log('⚠️  Sentry DSN not configured. Error tracking disabled.');
        console.log('   Set SENTRY_DSN in .env to enable error tracking.');
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        
        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
        // We recommend adjusting this value in production
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        // Enable debug mode in development only
        debug: process.env.NODE_ENV !== 'production',
        
        // No additional integrations needed - Sentry auto-instruments Node.js
        
        // Filter out sensitive data
        beforeSend(event, hint) {
            // Remove sensitive headers
            if (event.request && event.request.headers) {
                delete event.request.headers.authorization;
                delete event.request.headers.cookie;
            }
            
            // Remove password fields from request data
            if (event.request && event.request.data) {
                if (typeof event.request.data === 'string') {
                    try {
                        const data = JSON.parse(event.request.data);
                        if (data.password) delete data.password;
                        if (data.currentPassword) delete data.currentPassword;
                        if (data.newPassword) delete data.newPassword;
                        event.request.data = JSON.stringify(data);
                    } catch (e) {
                        // Not JSON, ignore
                    }
                }
            }
            
            return event;
        },
        
        // Ignore certain errors
        ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            // Random plugins/extensions
            'originalCreateNotification',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
            // Facebook borked
            'fb_xd_fragment',
            // ISP optimizing proxy - `Cache-Control: no-transform` seems to reduce this
            'bmi_SafeAddOnload',
            'EBCallBackMessageReceived',
            // See https://blog.sentry.io/2016/05/17/what-is-script-error
            'Script error',
        ],
    });

    console.log('✅ Sentry error tracking initialized');
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Sample Rate: ${process.env.NODE_ENV === 'production' ? '10%' : '100%'}`);
}

/**
 * Get Sentry request handler middleware
 * Must be added BEFORE all other middleware
 */
function getRequestHandler() {
    // Return empty middleware - Sentry v8+ doesn't need explicit handlers
    return (req, res, next) => next();
}

/**
 * Get Sentry tracing handler middleware
 * Must be added BEFORE all routes
 */
function getTracingHandler() {
    // Return empty middleware - Sentry v8+ auto-instruments
    return (req, res, next) => next();
}

/**
 * Get Sentry error handler middleware
 * Must be added AFTER all routes but BEFORE other error handlers
 */
function getErrorHandler() {
    // Custom error handler that captures errors to Sentry
    return (err, req, res, next) => {
        const statusCode = err.statusCode || err.status;
        
        console.log('Error handler called:', {
            hasStatus: !!statusCode,
            status: statusCode,
            message: err.message,
            hasDSN: !!process.env.SENTRY_DSN
        });
        
        if (process.env.SENTRY_DSN && (!statusCode || statusCode >= 500)) {
            console.log('📤 Capturing error to Sentry...');
            Sentry.captureException(err, {
                contexts: {
                    request: {
                        method: req.method,
                        url: req.url,
                        headers: req.headers,
                    },
                },
            });
            
            // Flush to ensure the event is sent immediately
            Sentry.flush(2000).then(() => {
                console.log('✅ Error sent to Sentry');
            }).catch(e => {
                console.error('❌ Failed to send error to Sentry:', e.message);
            });
        }
        next(err);
    };
}

/**
 * Manually capture an exception
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
    if (!process.env.SENTRY_DSN) {
        console.error('Sentry Error:', error);
        return;
    }
    
    Sentry.captureException(error, {
        contexts: context,
    });
}

/**
 * Manually capture a message
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (fatal, error, warning, info, debug)
 * @param {Object} context - Additional context
 */
function captureMessage(message, level = 'info', context = {}) {
    if (!process.env.SENTRY_DSN) {
        console.log(`Sentry Message (${level}):`, message);
        return;
    }
    
    Sentry.captureMessage(message, {
        level,
        contexts: context,
    });
}

/**
 * Set user context for error tracking
 * @param {Object} user - User information
 */
function setUser(user) {
    if (!process.env.SENTRY_DSN) return;
    
    Sentry.setUser({
        id: user._id || user.id,
        email: user.email,
        username: user.name,
        role: user.role,
    });
}

/**
 * Clear user context
 */
function clearUser() {
    if (!process.env.SENTRY_DSN) return;
    Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 * @param {Object} breadcrumb - Breadcrumb data
 */
function addBreadcrumb(breadcrumb) {
    if (!process.env.SENTRY_DSN) return;
    Sentry.addBreadcrumb(breadcrumb);
}

module.exports = {
    initSentry,
    getRequestHandler,
    getTracingHandler,
    getErrorHandler,
    captureException,
    captureMessage,
    setUser,
    clearUser,
    addBreadcrumb,
    Sentry, // Export Sentry instance for advanced usage
};
