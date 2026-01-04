/* ===================================
   ADMIN PAGE ENTRY - CODE SPLIT
   Loads admin modules on-demand
   =================================== */

(async function initAdminPage() {
    'use strict';

    // Critical path - verify authentication
    const criticalInit = async () => {
        // Wait for auth module
        while (!window.auth) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Check authentication
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '/admin-login.html';
            return false;
        }

        // Show loading overlay
        if (window.loading) {
            window.loading.showOverlay('Loading admin dashboard...');
        }

        return true;
    };

    // Load admin modules
    const loadAdminModules = async () => {
        try {
            // Load admin functionality
            await window.LazyFeatures.loadAdminModules();

            // Hide loading overlay
            if (window.loading) {
                window.loading.hideOverlay();
            }

            // Initialize admin page
            if (window.initializePage) {
                window.initializePage();
            }

            // Load performance monitoring in background
            setTimeout(async () => {
                try {
                    await window.LazyFeatures.loadPerformanceMonitoring();
                } catch (error) {
                    console.warn('Performance monitoring unavailable:', error.message);
                }
            }, 2000);

        } catch (error) {
            console.error('Failed to load admin modules:', error);
            
            if (window.loading) {
                window.loading.hideOverlay();
            }

            if (window.message) {
                window.message.showError(
                    'Failed to load admin dashboard. Please refresh the page.',
                    'Loading Error'
                );
            }
        }
    };

    // Execute initialization
    const isAuthenticated = await criticalInit();
    
    if (!isAuthenticated) {
        return; // Redirected to login
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAdminModules);
    } else {
        loadAdminModules();
    }
})();
