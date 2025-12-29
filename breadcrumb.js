/* ===================================
   BREADCRUMB NAVIGATION UTILITY
   Hometown Delivery
   =================================== */

/**
 * Breadcrumb Manager - Automatically generates breadcrumb navigation
 */
class BreadcrumbManager {
    constructor() {
        this.init();
    }

    /**
     * Initialize breadcrumb for current page
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.render());
        } else {
            this.render();
        }
    }

    /**
     * Generate breadcrumb based on current page
     */
    getBreadcrumbData() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        // Define breadcrumb mappings
        const breadcrumbs = {
            'index.html': [
                { label: 'Home', url: null, current: true }
            ],
            'shop.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Shop Groceries', url: null, current: true }
            ],
            'cart.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Shop', url: 'shop.html' },
                { label: 'Shopping Cart', url: null, current: true }
            ],
            'track.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Track Order', url: null, current: true }
            ],
            'about.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'About Us', url: null, current: true }
            ],
            'admin-login.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Admin Login', url: null, current: true }
            ],
            'admin.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Admin', url: null, current: true },
                { label: 'Dashboard', url: null, current: true }
            ],
            'admin-orders.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Admin', url: 'admin.html' },
                { label: 'Orders', url: null, current: true }
            ],
            'admin-products.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Admin', url: 'admin.html' },
                { label: 'Products', url: null, current: true }
            ],
            'admin-customers.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Admin', url: 'admin.html' },
                { label: 'Customers', url: null, current: true }
            ],
            'admin-drivers.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Admin', url: 'admin.html' },
                { label: 'Drivers', url: null, current: true }
            ],
            'admin-reports.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Admin', url: 'admin.html' },
                { label: 'Reports', url: null, current: true }
            ],
            'admin-settings.html': [
                { label: 'Home', url: 'index.html' },
                { label: 'Admin', url: 'admin.html' },
                { label: 'Settings', url: null, current: true }
            ]
        };

        return breadcrumbs[filename] || [
            { label: 'Home', url: 'index.html' },
            { label: 'Page', url: null, current: true }
        ];
    }

    /**
     * Render breadcrumb navigation
     */
    render() {
        const container = document.getElementById('breadcrumb-container');
        if (!container) return;

        const breadcrumbData = this.getBreadcrumbData();
        
        const breadcrumbHTML = breadcrumbData.map((item, index) => {
            const isLast = index === breadcrumbData.length - 1;
            const separator = !isLast ? '<span class="breadcrumb-separator">›</span>' : '';
            
            if (item.current || !item.url) {
                return `
                    <div class="breadcrumb-item">
                        <span class="breadcrumb-current">${item.label}</span>
                    </div>
                    ${separator}
                `;
            } else {
                return `
                    <div class="breadcrumb-item">
                        <a href="${item.url}" class="breadcrumb-link">${item.label}</a>
                    </div>
                    ${separator}
                `;
            }
        }).join('');

        container.innerHTML = `
            <div class="breadcrumb">
                <span class="breadcrumb-icon">🏠</span>
                ${breadcrumbHTML}
            </div>
        `;
    }

    /**
     * Update breadcrumb programmatically (for dynamic pages)
     */
    update(breadcrumbData) {
        const container = document.getElementById('breadcrumb-container');
        if (!container || !breadcrumbData) return;

        const breadcrumbHTML = breadcrumbData.map((item, index) => {
            const isLast = index === breadcrumbData.length - 1;
            const separator = !isLast ? '<span class="breadcrumb-separator">›</span>' : '';
            
            if (item.current || !item.url) {
                return `
                    <div class="breadcrumb-item">
                        <span class="breadcrumb-current">${item.label}</span>
                    </div>
                    ${separator}
                `;
            } else {
                return `
                    <div class="breadcrumb-item">
                        <a href="${item.url}" class="breadcrumb-link">${item.label}</a>
                    </div>
                    ${separator}
                `;
            }
        }).join('');

        container.innerHTML = `
            <div class="breadcrumb">
                <span class="breadcrumb-icon">🏠</span>
                ${breadcrumbHTML}
            </div>
        `;
    }
}

// Initialize breadcrumb manager
const breadcrumbManager = new BreadcrumbManager();

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BreadcrumbManager, breadcrumbManager };
}
