/* ===================================
   MODULE LOADER - CODE SPLITTING
   Dynamic imports for faster initial load
   =================================== */

/**
 * Module Loader - Loads JavaScript modules on-demand
 * Reduces initial bundle size and improves Time to Interactive (TTI)
 */
class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Load a JavaScript module dynamically
     * @param {string} modulePath - Path to the module
     * @param {string} moduleName - Name for caching
     * @returns {Promise<any>} Module exports
     */
    async loadModule(modulePath, moduleName) {
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        // Return existing loading promise if in progress
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        // Start loading
        const loadPromise = this._loadScript(modulePath, moduleName);
        this.loadingPromises.set(moduleName, loadPromise);

        try {
            const module = await loadPromise;
            this.loadedModules.set(moduleName, module);
            this.loadingPromises.delete(moduleName);
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }

    /**
     * Load script via script tag (for non-ES6 modules)
     */
    async _loadScript(src, name) {
        return new Promise((resolve, reject) => {
            // Check if already in DOM
            const existing = document.querySelector(`script[data-module="${name}"]`);
            if (existing) {
                resolve(window[name] || {});
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.dataset.module = name;
            script.async = true;

            script.onload = () => {
                resolve(window[name] || {});
            };

            script.onerror = () => {
                reject(new Error(`Failed to load module: ${name} from ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Preload a module (low priority) for better performance
     */
    preloadModule(modulePath, moduleName) {
        // Use link rel="preload" for better performance
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = modulePath;
        document.head.appendChild(link);
    }

    /**
     * Check if module is loaded
     */
    isLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Unload a module from cache
     */
    unloadModule(moduleName) {
        this.loadedModules.delete(moduleName);
    }
}

// Create global instance
window.moduleLoader = new ModuleLoader();

/**
 * Feature-specific lazy loaders
 */
const LazyFeatures = {
    /**
     * Load Stripe payment module
     */
    async loadStripePayment() {
        if (window.stripeCheckout) {
            return window.stripeCheckout;
        }

        try {
            // Load Stripe.js first if not loaded
            if (!window.Stripe) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://js.stripe.com/v3/';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            // Load checkout module
            await moduleLoader.loadModule('/checkout.js', 'stripeCheckout');
            return window.stripeCheckout;
        } catch (error) {
            console.error('Failed to load Stripe payment module:', error);
            throw error;
        }
    },

    /**
     * Load frequently bought items module
     */
    async loadFrequentlyBought() {
        if (window.frequentlyBought) {
            return window.frequentlyBought;
        }

        return moduleLoader.loadModule('/frequently-bought.js', 'frequentlyBought');
    },

    /**
     * Load recently viewed module
     */
    async loadRecentlyViewed() {
        if (window.recentlyViewed) {
            return window.recentlyViewed;
        }

        return moduleLoader.loadModule('/recently-viewed.js', 'recentlyViewed');
    },

    /**
     * Load customer account management
     */
    async loadCustomerAccount() {
        if (window.customerAuth) {
            return window.customerAuth;
        }

        return moduleLoader.loadModule('/customer-auth.js', 'customerAuth');
    },

    /**
     * Load admin modules
     */
    async loadAdminModules() {
        const modules = await Promise.all([
            moduleLoader.loadModule('/admin.js', 'adminModule'),
            moduleLoader.loadModule('/admin-mobile.js', 'adminMobile')
        ]);
        return modules;
    },

    /**
     * Load cart and checkout
     */
    async loadCartCheckout() {
        if (window.cartCheckout) {
            return window.cartCheckout;
        }

        return moduleLoader.loadModule('/cart-checkout.js', 'cartCheckout');
    },

    /**
     * Load performance monitoring
     */
    async loadPerformanceMonitoring() {
        if (window.performanceMonitor) {
            return window.performanceMonitor;
        }

        return moduleLoader.loadModule('/performance.js', 'performanceMonitor');
    }
};

/**
 * Page-specific loader
 * Loads only modules needed for current page
 */
async function loadPageModules() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    // Core modules (loaded on all pages)
    const coreModules = [
        'config.js',
        'page-config.js',
        'api.js',
        'loading.js'
    ];

    // Page-specific modules
    const pageModules = {
        'index.html': ['main.js', 'lazy-load.js'],
        'shop.html': ['main.js', 'lazy-load.js', 'back-to-top.js'],
        'cart.html': ['main.js', 'cart-checkout.js'],
        'checkout.html': ['main.js', 'cart-checkout.js', 'checkout.js'],
        'customer-account.html': ['customer-auth.js'],
        'customer-login.html': ['customer-auth.js'],
        'customer-register.html': ['customer-auth.js'],
        'admin.html': ['admin.js', 'admin-mobile.js'],
        'admin-orders.html': ['admin.js', 'admin-mobile.js'],
        'admin-customers.html': ['admin.js', 'admin-mobile.js'],
        'admin-drivers.html': ['admin.js', 'admin-mobile.js'],
        'admin-products.html': ['admin.js', 'admin-mobile.js'],
        'admin-settings.html': ['admin.js', 'admin-mobile.js'],
        'admin-reports.html': ['admin.js', 'admin-mobile.js'],
        'admin-email.html': ['admin.js', 'admin-mobile.js']
    };

    // Get modules for current page
    const modulesToLoad = pageModules[page] || [];

    // Preload optional modules (low priority)
    if (page.includes('shop') || page === 'index.html') {
        moduleLoader.preloadModule('/frequently-bought.js', 'frequentlyBought');
        moduleLoader.preloadModule('/recently-viewed.js', 'recentlyViewed');
    }

    return {
        core: coreModules,
        page: modulesToLoad
    };
}

// Export for use in other modules
window.LazyFeatures = LazyFeatures;
window.loadPageModules = loadPageModules;
