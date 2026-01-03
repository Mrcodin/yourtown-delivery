/* ===================================
   PRODUCT MANAGEMENT MODULE
   Handles product loading from API
   =================================== */

// Global product data - directly on window for global access
window.groceries = [];
window.USUAL_ORDER_IDS = [];

// Reference for easier access in this file
let groceries = window.groceries;
let USUAL_ORDER_IDS = window.USUAL_ORDER_IDS;

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
            window.groceries = response.products.map(p => ({
                _id: p._id,  // Use _id to match MongoDB format
                id: p._id,   // Keep id as alias for compatibility
                name: p.name,
                price: p.price,
                category: p.category,
                emoji: p.emoji || '📦',
                imageUrl: p.imageUrl || null,
                isTaxable: p.isTaxable || false
            }));
            groceries = window.groceries;
            
            // Set usual order IDs (first 6 products)
            window.USUAL_ORDER_IDS = window.groceries.slice(0, 6).map(p => p.id);
            USUAL_ORDER_IDS = window.USUAL_ORDER_IDS;
            
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

// Window references are already set at the top
// They will be updated when loadProducts() runs

// Initialize product loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProducts);
} else {
    loadProducts();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { groceries: window.groceries, USUAL_ORDER_IDS: window.USUAL_ORDER_IDS, loadProducts };
}
