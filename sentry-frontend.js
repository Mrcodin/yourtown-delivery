/**
 * Sentry Frontend Error Tracking
 * Monitors client-side errors and performance
 */

import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry for frontend error tracking
 * Call this as early as possible in your application
 */
export function initSentry() {
    // Get DSN from config or meta tag
    const sentryDsn = window.SENTRY_DSN || 
                     document.querySelector('meta[name="sentry-dsn"]')?.content;

    if (!sentryDsn) {
        console.log('⚠️  Sentry DSN not configured. Frontend error tracking disabled.');
        return;
    }

    const environment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1'
        ? 'development'
        : 'production';

    Sentry.init({
        dsn: sentryDsn,
        environment,
        
        // Set tracesSampleRate based on environment
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        
        integrations: [
            new BrowserTracing({
                // Trace all fetch/XHR requests
                traceFetch: true,
                traceXHR: true,
                
                // Automatically instrument navigation
                routingInstrumentation: Sentry.browserTracingIntegration,
            }),
        ],
        
        // Filter out sensitive data
        beforeSend(event, hint) {
            // Remove auth tokens from request headers
            if (event.request && event.request.headers) {
                delete event.request.headers.Authorization;
                delete event.request.headers.authorization;
            }
            
            // Remove localStorage data that might contain tokens
            if (event.contexts && event.contexts.localStorage) {
                delete event.contexts.localStorage.token;
                delete event.contexts.localStorage.refreshToken;
            }
            
            return event;
        },
        
        // Ignore certain errors
        ignoreErrors: [
            // Network errors that are expected
            'NetworkError',
            'Failed to fetch',
            'Load failed',
            // Browser extensions
            'top.GLOBALS',
            'originalCreateNotification',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
            'fb_xd_fragment',
            // Random plugins/extensions
            'Can\'t find variable: ZiteReader',
            'jigsaw is not defined',
            'ComboSearch is not defined',
            'atomicFindClose',
            'fb_xd_fragment',
            'bmi_SafeAddOnload',
            'EBCallBackMessageReceived',
            // Generic script errors
            'Script error',
        ],
    });

    console.log('✅ Sentry frontend tracking initialized');
    console.log(`   Environment: ${environment}`);
    console.log(`   Sample Rate: ${environment === 'production' ? '10%' : '100%'}`);
}

/**
 * Capture an error manually
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export function captureException(error, context = {}) {
    if (!Sentry.getCurrentHub().getClient()) {
        console.error('Sentry Error:', error);
        return;
    }
    
    Sentry.captureException(error, {
        contexts: context,
    });
}

/**
 * Capture a message
 * @param {string} message - The message to capture
 * @param {string} level - Severity level
 * @param {Object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
    if (!Sentry.getCurrentHub().getClient()) {
        console.log(`Sentry Message (${level}):`, message);
        return;
    }
    
    Sentry.captureMessage(message, {
        level,
        contexts: context,
    });
}

/**
 * Set user context
 * @param {Object} user - User information
 */
export function setUser(user) {
    if (!Sentry.getCurrentHub().getClient()) return;
    
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
export function clearUser() {
    if (!Sentry.getCurrentHub().getClient()) return;
    Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 * @param {string} message - Breadcrumb message
 * @param {string} category - Category (navigation, ui.click, etc)
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(message, category = 'user-action', data = {}) {
    if (!Sentry.getCurrentHub().getClient()) return;
    
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}

/**
 * Track page view
 * @param {string} pageName - Name of the page
 */
export function trackPageView(pageName) {
    addBreadcrumb(`Viewed ${pageName}`, 'navigation', { page: pageName });
}

/**
 * Track user action
 * @param {string} action - Action description
 * @param {Object} data - Additional data
 */
export function trackAction(action, data = {}) {
    addBreadcrumb(action, 'user-action', data);
}

/**
 * Global error handler for unhandled errors
 */
window.addEventListener('error', (event) => {
    if (Sentry.getCurrentHub().getClient()) {
        // Sentry will automatically capture this
        // But we can add extra context if needed
        Sentry.withScope((scope) => {
            scope.setContext('error-event', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            });
        });
    }
});

/**
 * Global handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    if (Sentry.getCurrentHub().getClient()) {
        captureException(event.reason, {
            unhandledRejection: {
                promise: event.promise,
                reason: event.reason,
            },
        });
    }
});

// Export Sentry instance for advanced usage
export { Sentry };
