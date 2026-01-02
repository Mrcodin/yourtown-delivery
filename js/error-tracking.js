/* ===================================
   ERROR TRACKING MODULE
   Simple error tracking and reporting
   =================================== */

const ErrorTracker = {
    // Configuration
    config: {
        enabled: true,
        logToConsole: true,
        maxErrors: 100,
        endpoint: null // Can be set to send to a backend endpoint
    },
    
    // Error storage
    errors: [],
    
    // Initialize error tracking
    init(options = {}) {
        this.config = { ...this.config, ...options };
        
        // Global error handler
        window.addEventListener('error', (event) => {
            this.captureError(event.error || new Error(event.message), {
                type: 'uncaught',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError(
                event.reason || new Error('Unhandled Promise Rejection'),
                { type: 'promise_rejection' }
            );
        });
        
        console.log('✅ Error Tracking initialized');
    },
    
    // Capture an error
    captureError(error, context = {}) {
        if (!this.config.enabled) return;
        
        const errorData = {
            timestamp: new Date().toISOString(),
            message: error.message || String(error),
            stack: error.stack || '',
            context: context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
        
        // Add to storage
        this.errors.push(errorData);
        
        // Keep only last N errors
        if (this.errors.length > this.config.maxErrors) {
            this.errors.shift();
        }
        
        // Log to console
        if (this.config.logToConsole) {
            console.error('🔴 Error captured:', errorData);
        }
        
        // Send to backend if endpoint configured
        if (this.config.endpoint) {
            this.sendError(errorData);
        }
        
        // Store in localStorage for persistence
        this.saveToStorage();
    },
    
    // Send error to backend
    async sendError(errorData) {
        try {
            await fetch(this.config.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorData)
            });
        } catch (err) {
            console.error('Failed to send error to backend:', err);
        }
    },
    
    // Save errors to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('error_log', JSON.stringify(this.errors.slice(-20)));
        } catch (err) {
            console.error('Failed to save errors to storage:', err);
        }
    },
    
    // Load errors from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('error_log');
            if (stored) {
                this.errors = JSON.parse(stored);
            }
        } catch (err) {
            console.error('Failed to load errors from storage:', err);
        }
    },
    
    // Get all errors
    getErrors() {
        return this.errors;
    },
    
    // Get recent errors
    getRecentErrors(count = 10) {
        return this.errors.slice(-count);
    },
    
    // Clear all errors
    clearErrors() {
        this.errors = [];
        localStorage.removeItem('error_log');
    },
    
    // Get error statistics
    getStats() {
        const now = Date.now();
        const last24h = this.errors.filter(e => 
            now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
        );
        
        const errorsByContext = {};
        this.errors.forEach(e => {
            const ctx = e.context.context || 'unknown';
            errorsByContext[ctx] = (errorsByContext[ctx] || 0) + 1;
        });
        
        return {
            total: this.errors.length,
            last24h: last24h.length,
            byContext: errorsByContext,
            oldestError: this.errors[0]?.timestamp,
            newestError: this.errors[this.errors.length - 1]?.timestamp
        };
    },
    
    // Display error dashboard (for testing)
    showDashboard() {
        const stats = this.getStats();
        console.log('📊 Error Tracking Dashboard');
        console.log('─'.repeat(50));
        console.log(`Total Errors: ${stats.total}`);
        console.log(`Last 24 Hours: ${stats.last24h}`);
        console.log('\nErrors by Context:');
        Object.entries(stats.byContext).forEach(([ctx, count]) => {
            console.log(`  ${ctx}: ${count}`);
        });
        console.log('\nRecent Errors:');
        this.getRecentErrors(5).forEach((err, i) => {
            console.log(`\n${i + 1}. ${err.message}`);
            console.log(`   Context: ${err.context.context || 'unknown'}`);
            console.log(`   Time: ${new Date(err.timestamp).toLocaleString()}`);
        });
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ErrorTracker.init({
            logToConsole: true,
            endpoint: null // Set to '/api/errors' if you want backend logging
        });
        ErrorTracker.loadFromStorage();
    });
} else {
    ErrorTracker.init({
        logToConsole: true,
        endpoint: null
    });
    ErrorTracker.loadFromStorage();
}

// Expose globally
window.ErrorTracker = ErrorTracker;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorTracker;
}
