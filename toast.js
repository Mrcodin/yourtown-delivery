/* ===================================
   TOAST NOTIFICATION SYSTEM
   Modern, accessible toasts
   =================================== */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        // Don't init immediately, wait for DOM
        if (document.body) {
            this.init();
        } else {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }
        }
    }

    init() {
        // Create container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.setAttribute('role', 'region');
            this.container.setAttribute('aria-label', 'Notifications');
            // Ensure it's absolutely on top with inline styles
            this.container.style.position = 'fixed';
            this.container.style.top = '160px';
            this.container.style.right = '20px';
            this.container.style.zIndex = '999999';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
            // Ensure z-index is set
            this.container.style.zIndex = '999999';
        }
    }

    /**
     * Show a toast notification
     * @param {Object} options - Toast options
     * @param {string} options.message - Main message (required)
     * @param {string} options.title - Title (optional)
     * @param {string} options.type - Type: success, error, warning, info (default: info)
     * @param {number} options.duration - Duration in ms (default: 5000, 0 = no auto-close)
     * @param {boolean} options.dismissible - Can be closed manually (default: true)
     * @param {Function} options.onClose - Callback when toast closes
     */
    show(options) {
        // Ensure container is initialized
        if (!this.container) {
            this.init();
        }

        const {
            message,
            title = '',
            type = 'info',
            duration = 5000,
            dismissible = true,
            onClose = null,
        } = typeof options === 'string' ? { message: options } : options;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

        // Icon mapping
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
        };

        // Build toast HTML
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ''}
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            ${dismissible ? '<button class="toast-close" aria-label="Close notification">×</button>' : ''}
            ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
        `;

        // Add to container
        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Progress bar animation
        if (duration > 0) {
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.width = '100%';
                setTimeout(() => {
                    progress.style.width = '0%';
                    progress.style.transition = `width ${duration}ms linear`;
                }, 10);
            }
        }

        // Close button handler
        if (dismissible) {
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.close(toast, onClose);
                });
            }
        }

        // Auto-close
        if (duration > 0) {
            setTimeout(() => {
                this.close(toast, onClose);
            }, duration);
        }

        // Track toast
        this.toasts.push(toast);

        return toast;
    }

    /**
     * Close a toast
     */
    close(toast, callback) {
        if (!toast || !toast.parentElement) return;

        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);

            if (callback) callback();
        }, 300);
    }

    /**
     * Convenience methods
     */
    success(message, title = '') {
        return this.show({
            message,
            title: title || 'Success',
            type: 'success',
        });
    }

    error(message, title = '') {
        return this.show({
            message,
            title: title || 'Error',
            type: 'error',
            duration: 7000, // Errors stay longer
        });
    }

    warning(message, title = '') {
        return this.show({
            message,
            title: title || 'Warning',
            type: 'warning',
            duration: 6000,
        });
    }

    info(message, title = '') {
        return this.show({
            message,
            title: title || 'Info',
            type: 'info',
        });
    }

    /**
     * Close all toasts
     */
    closeAll() {
        this.toasts.forEach(toast => this.close(toast));
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
const toast = new ToastManager();

// Make available globally
if (typeof window !== 'undefined') {
    window.toast = toast;
}
