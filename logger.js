/**
 * Production-safe logger utility
 * Only shows debug logs in development environment
 */

const isDevelopment = () => {
    // Check if running in browser
    if (typeof window !== 'undefined') {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '';
    }
    // Check if running in Node.js
    if (typeof process !== 'undefined') {
        return process.env.NODE_ENV === 'development';
    }
    return false;
};

/**
 * Logger class with environment-aware logging
 */
class Logger {
    constructor(context = '') {
        this.context = context;
    }

    /**
     * Debug logs - only shown in development
     * @param {...any} args - Arguments to log
     */
    debug(...args) {
        if (isDevelopment()) {
            const prefix = this.context ? `[${this.context}]` : '';
            console.log(prefix, ...args);
        }
    }

    /**
     * Info logs - shown in all environments
     * @param {...any} args - Arguments to log
     */
    info(...args) {
        const prefix = this.context ? `[${this.context}]` : '';
        console.log(prefix, ...args);
    }

    /**
     * Warning logs - shown in all environments
     * @param {...any} args - Arguments to log
     */
    warn(...args) {
        const prefix = this.context ? `[${this.context}]` : '';
        console.warn(prefix, ...args);
    }

    /**
     * Error logs - shown in all environments
     * @param {...any} args - Arguments to log
     */
    error(...args) {
        const prefix = this.context ? `[${this.context}]` : '';
        console.error(prefix, ...args);
    }

    /**
     * Table logs - only shown in development
     * @param {any} data - Data to display in table
     */
    table(data) {
        if (isDevelopment() && console.table) {
            console.table(data);
        }
    }

    /**
     * Group logs - only shown in development
     * @param {string} label - Group label
     */
    group(label) {
        if (isDevelopment()) {
            const prefix = this.context ? `[${this.context}]` : '';
            console.group(prefix, label);
        }
    }

    /**
     * Group end - only shown in development
     */
    groupEnd() {
        if (isDevelopment()) {
            console.groupEnd();
        }
    }

    /**
     * Time start - only shown in development
     * @param {string} label - Timer label
     */
    time(label) {
        if (isDevelopment()) {
            console.time(label);
        }
    }

    /**
     * Time end - only shown in development
     * @param {string} label - Timer label
     */
    timeEnd(label) {
        if (isDevelopment()) {
            console.timeEnd(label);
        }
    }
}

// Export default logger instance
const logger = new Logger();

// Export Logger class for creating context-specific loggers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logger, Logger, isDevelopment };
}
