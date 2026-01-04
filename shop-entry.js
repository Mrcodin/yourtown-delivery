/* ===================================
   SHOP PAGE ENTRY - CODE SPLIT
   Loads only shop-specific modules
   =================================== */

(async function initShopPage() {
    'use strict';

    // Critical path - load immediately
    const criticalInit = async () => {
        // Wait for core dependencies
        while (!window.api || !window.loading) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Show initial loading state
        const gridContainer = document.getElementById('grocery-grid');
        if (gridContainer) {
            window.loading.showSkeleton(gridContainer, 'product', 6);
        }
    };

    // Non-critical path - load after initial render
    const loadNonCritical = async () => {
        try {
            // Load main shop functionality
            if (!window.groceries) {
                await window.moduleLoader.loadModule('/main.js', 'shopMain');
            }

            // Lazy load enhancement features after main content
            setTimeout(async () => {
                try {
                    // Load these in background
                    await Promise.all([
                        window.LazyFeatures.loadFrequentlyBought().catch(e => 
                            console.warn('Frequently bought feature unavailable:', e.message)
                        ),
                        window.LazyFeatures.loadRecentlyViewed().catch(e =>
                            console.warn('Recently viewed feature unavailable:', e.message)
                        ),
                        window.LazyFeatures.loadPerformanceMonitoring().catch(e =>
                            console.warn('Performance monitoring unavailable:', e.message)
                        )
                    ]);
                } catch (error) {
                    // Non-critical features, just log
                    console.warn('Some enhancement features could not be loaded:', error);
                }
            }, 1000);

        } catch (error) {
            console.error('Failed to initialize shop page:', error);
            window.message?.showError(
                'Failed to load shop features. Please refresh the page.',
                'Initialization Error'
            );
        }
    };

    // Execute initialization
    await criticalInit();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadNonCritical);
    } else {
        loadNonCritical();
    }
})();
