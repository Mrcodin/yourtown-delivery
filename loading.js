/* ===================================
   LOADING & ERROR UTILITIES
   Hometown Delivery - Frontend
   =================================== */

/**
 * Loading Manager - Handles all loading states and user feedback
 */
class LoadingManager {
    constructor() {
        this.activeRequests = new Set();
        this.overlay = null;
    }

    /**
     * Show full-screen loading overlay
     */
    showOverlay(message = 'Loading...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="spinner spinner-large"></div>
                <div class="loading-text">${message}</div>
            `;
            document.body.appendChild(this.overlay);
        }
        
        this.overlay.querySelector('.loading-text').textContent = message;
        
        // Force reflow to enable transition
        setTimeout(() => {
            this.overlay.classList.add('active');
        }, 10);
    }

    /**
     * Hide full-screen loading overlay
     */
    hideOverlay() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            setTimeout(() => {
                if (this.overlay && !this.overlay.classList.contains('active')) {
                    this.overlay.remove();
                    this.overlay = null;
                }
            }, 300);
        }
    }

    /**
     * Show inline loading spinner in a container
     */
    showInline(container, message = 'Loading...') {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;

        container.innerHTML = `
            <div class="loading-inline">
                <div class="spinner spinner-primary spinner-medium"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
    }

    /**
     * Show skeleton screen in a container
     */
    showSkeleton(container, type = 'card', count = 1) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;

        let skeletonHTML = '';
        
        switch (type) {
            case 'product':
                skeletonHTML = this._getProductSkeleton(count);
                break;
            case 'table':
                skeletonHTML = this._getTableSkeleton(count);
                break;
            case 'card':
            default:
                skeletonHTML = this._getCardSkeleton(count);
                break;
        }
        
        container.innerHTML = skeletonHTML;
    }

    /**
     * Set button to loading state
     */
    buttonLoading(button, isLoading = true) {
        if (typeof button === 'string') {
            button = document.querySelector(button);
        }
        
        if (!button) return;

        if (isLoading) {
            button.classList.add('btn-loading');
            button.disabled = true;
            
            // Wrap text if not already wrapped
            if (!button.querySelector('.btn-text')) {
                const text = button.textContent;
                button.innerHTML = `<span class="btn-text">${text}</span>`;
            }
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }

    /**
     * Track API request
     */
    startRequest(requestId) {
        this.activeRequests.add(requestId);
    }

    /**
     * Complete API request
     */
    endRequest(requestId) {
        this.activeRequests.delete(requestId);
    }

    /**
     * Check if any requests are active
     */
    hasActiveRequests() {
        return this.activeRequests.size > 0;
    }

    // Private skeleton generators
    _getProductSkeleton(count) {
        const skeleton = `
            <div class="skeleton-card">
                <div class="skeleton-product">
                    <div class="skeleton skeleton-product-image"></div>
                    <div class="skeleton skeleton-product-title"></div>
                    <div class="skeleton skeleton-product-description"></div>
                    <div class="skeleton skeleton-product-price"></div>
                </div>
            </div>
        `;
        
        return `<div class="skeleton-grid">${skeleton.repeat(count)}</div>`;
    }

    _getTableSkeleton(count) {
        const row = `
            <div class="skeleton-table-row">
                <div class="skeleton skeleton-table-cell"></div>
                <div class="skeleton skeleton-table-cell"></div>
                <div class="skeleton skeleton-table-cell"></div>
                <div class="skeleton skeleton-table-cell"></div>
            </div>
        `;
        
        return `<div class="skeleton-table">${row.repeat(count)}</div>`;
    }

    _getCardSkeleton(count) {
        const skeleton = `
            <div class="skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
            </div>
        `;
        
        return skeleton.repeat(count);
    }
}

/**
 * Message Manager - Handles user-friendly notifications
 */
class MessageManager {
    /**
     * Show error message
     */
    showError(message, title = 'Error', container = null, duration = 0) {
        return this._showMessage('error', message, title, container, duration);
    }

    /**
     * Show success message
     */
    showSuccess(message, title = 'Success', container = null, duration = 5000) {
        return this._showMessage('success', message, title, container, duration);
    }

    /**
     * Show warning message
     */
    showWarning(message, title = 'Warning', container = null, duration = 5000) {
        return this._showMessage('warning', message, title, container, duration);
    }

    /**
     * Show info message
     */
    showInfo(message, title = 'Info', container = null, duration = 5000) {
        return this._showMessage('info', message, title, container, duration);
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyError(error) {
        // Parse error object
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const statusCode = error?.status || error?.statusCode;

        // Map technical errors to user-friendly messages
        const errorMap = {
            // Network errors
            'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
            'NetworkError': 'Network error occurred. Please check your internet connection.',
            'TypeError: Failed to fetch': 'Unable to connect to the server. Please try again.',
            
            // Authentication errors
            'Invalid credentials': 'The username or password you entered is incorrect.',
            'Unauthorized': 'You need to log in to access this feature.',
            'Token expired': 'Your session has expired. Please log in again.',
            'Authentication required': 'Please log in to continue.',
            
            // Validation errors
            'Validation failed': 'Please check the information you entered and try again.',
            'Invalid input': 'Some of the information you entered is invalid.',
            'Required field': 'Please fill in all required fields.',
            
            // Not found errors
            'Not found': 'The requested item could not be found.',
            'Product not found': 'This product is no longer available.',
            'Order not found': 'We couldn\'t find that order.',
            
            // Server errors
            'Internal server error': 'Something went wrong on our end. Please try again later.',
            'Service unavailable': 'The service is temporarily unavailable. Please try again later.',
            
            // Specific business logic errors
            'Insufficient stock': 'Sorry, we don\'t have enough of this item in stock.',
            'Out of stock': 'This item is currently out of stock.',
            'Invalid quantity': 'Please enter a valid quantity.',
            'Minimum order': 'The minimum order amount has not been met.',
            'Delivery zone': 'We don\'t currently deliver to your area.',
        };

        // Check for mapped errors
        for (const [key, value] of Object.entries(errorMap)) {
            if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
                return value;
            }
        }

        // Status code based messages
        if (statusCode) {
            switch (statusCode) {
                case 400:
                    return 'Invalid request. Please check your input and try again.';
                case 401:
                    return 'Please log in to continue.';
                case 403:
                    return 'You don\'t have permission to perform this action.';
                case 404:
                    return 'The requested item was not found.';
                case 409:
                    return 'This item already exists or there\'s a conflict.';
                case 422:
                    return 'Please check the information you entered.';
                case 429:
                    return 'Too many requests. Please slow down and try again.';
                case 500:
                    return 'Something went wrong on our end. Please try again later.';
                case 502:
                case 503:
                    return 'The service is temporarily unavailable. Please try again later.';
                case 504:
                    return 'The request timed out. Please try again.';
            }
        }

        // If no mapping found, return a generic message but include original for debugging
        if (errorMessage.length < 100) {
            return errorMessage;
        }
        
        return 'An unexpected error occurred. Please try again.';
    }

    /**
     * Clear all messages from a container
     */
    clearMessages(container = null) {
        const target = container 
            ? (typeof container === 'string' ? document.querySelector(container) : container)
            : document.body;
        
        if (!target) return;
        
        const messages = target.querySelectorAll('.error-message, .success-message, .warning-message, .info-message');
        messages.forEach(msg => msg.remove());
    }

    // Private method to show message
    _showMessage(type, message, title, container, duration) {
        const icons = {
            error: '⚠️',
            success: '✓',
            warning: '⚠',
            info: 'ℹ'
        };

        const messageEl = document.createElement('div');
        messageEl.className = `${type}-message error-message`;
        messageEl.innerHTML = `
            <div class="error-message-icon">${icons[type]}</div>
            <div class="error-message-content">
                <div class="error-message-title">${title}</div>
                <div class="error-message-text">${message}</div>
            </div>
            <button class="error-message-close" aria-label="Close">&times;</button>
        `;

        // Add close handler
        const closeBtn = messageEl.querySelector('.error-message-close');
        closeBtn.addEventListener('click', () => {
            messageEl.remove();
        });

        // Add to container
        const target = container 
            ? (typeof container === 'string' ? document.querySelector(container) : container)
            : document.body;
        
        if (!target) return null;

        // Insert at the beginning of container
        target.insertBefore(messageEl, target.firstChild);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, duration);
        }

        return messageEl;
    }
}

/**
 * Progress Manager - Handles progress indicators
 */
class ProgressManager {
    /**
     * Create a step progress indicator
     */
    createStepProgress(container, steps, currentStep = 0) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;

        const stepElements = steps.map((step, index) => `
            <div class="progress-step ${index <= currentStep ? (index === currentStep ? 'active' : 'completed') : ''}">
                <div class="progress-step-circle">${index < currentStep ? '' : index + 1}</div>
                <div class="progress-step-label">${step}</div>
            </div>
        `).join('');

        const progress = (currentStep / (steps.length - 1)) * 100;

        container.innerHTML = `
            <div class="progress-container">
                <div class="progress-steps">
                    <div class="progress-line" style="width: ${progress}%"></div>
                    ${stepElements}
                </div>
            </div>
        `;
    }

    /**
     * Update step progress
     */
    updateStepProgress(container, currentStep) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;

        const steps = container.querySelectorAll('.progress-step');
        const progressLine = container.querySelector('.progress-line');
        
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index < currentStep) {
                step.classList.add('completed');
            } else if (index === currentStep) {
                step.classList.add('active');
            }
        });

        const progress = (currentStep / (steps.length - 1)) * 100;
        if (progressLine) {
            progressLine.style.width = `${progress}%`;
        }
    }

    /**
     * Create a linear progress bar
     */
    createLinearProgress(container, indeterminate = false) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;

        container.innerHTML = `
            <div class="progress-bar">
                <div class="progress-bar-fill ${indeterminate ? 'progress-bar-indeterminate' : ''}" style="width: 0%"></div>
            </div>
        `;
    }

    /**
     * Update linear progress
     */
    updateLinearProgress(container, percent) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;

        const fill = container.querySelector('.progress-bar-fill');
        if (fill && !fill.classList.contains('progress-bar-indeterminate')) {
            fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }
}

/**
 * Empty State Manager
 */
class EmptyStateManager {
    show(container, options = {}) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;

        const {
            icon = '📦',
            title = 'No items found',
            message = 'There are no items to display.',
            actionText = null,
            actionCallback = null
        } = options;

        const actionHTML = actionText && actionCallback 
            ? `<button class="btn btn-primary empty-state-action">${actionText}</button>`
            : '';

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-title">${title}</div>
                <div class="empty-state-text">${message}</div>
                ${actionHTML}
            </div>
        `;

        if (actionText && actionCallback) {
            const btn = container.querySelector('.empty-state-action');
            btn.addEventListener('click', actionCallback);
        }
    }
}

// Create global instances
const loading = new LoadingManager();
const message = new MessageManager();
const progress = new ProgressManager();
const emptyState = new EmptyStateManager();

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoadingManager, MessageManager, ProgressManager, EmptyStateManager, loading, message, progress, emptyState };
}
