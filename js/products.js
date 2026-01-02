/* ===================================
   PRODUCT MANAGEMENT MODULE
   Handles product loading from API
   =================================== */

// Global product data
let groceries = [];
let USUAL_ORDER_IDS = [];

// Load products from API
async function loadProducts() {
    const gridContainer = document.getElementById('grocery-grid');
    const emptyState = document.getElementById('empty-state');
    
    // Show skeleton loading if on shop page
    if (gridContainer) {
        loading.showSkeleton(gridContainer, 'product', 6);
    }
    
    try {
        const response = await api.getProducts({ showLoading: false });
        
        if (response.success && response.products) {
            groceries = response.products.map(p => ({
                id: p._id,
                name: p.name,
                price: p.price,
                category: p.category,
                emoji: p.emoji || '📦',
                imageUrl: p.imageUrl || null,
                isTaxable: p.isTaxable || false
            }));
            
            // Set usual order IDs (first 6 products)
            USUAL_ORDER_IDS = groceries.slice(0, 6).map(p => p.id);
            
            // Render products if on shop page
            if (gridContainer) {
                if (groceries.length === 0) {
                    gridContainer.innerHTML = '';
                    emptyState && emptyState.removeAttribute('style');
                } else {
                    emptyState && (emptyState.style.display = 'none');
                    renderGroceryGrid();
                }
            }
            
            return { success: true, count: groceries.length };
        } else {
            throw new Error('Failed to load products from server');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Report error
        if (typeof ErrorTracker !== 'undefined') {
            ErrorTracker.captureError(error, {
                context: 'Product Loading',
                action: 'loadProducts'
            });
        }
        
        if (gridContainer) {
            gridContainer.innerHTML = '';
            message.showError(
                message.getUserFriendlyError(error),
                'Connection Error',
                gridContainer
            );
        }
        
        return { success: false, error: error.message };
    }
}

// Initialize product loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProducts);
} else {
    loadProducts();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { groceries, USUAL_ORDER_IDS, loadProducts };
}
