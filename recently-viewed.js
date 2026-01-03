/**
 * Recently Viewed Products Tracker
 * Tracks and displays recently viewed products using localStorage
 */

class RecentlyViewedTracker {
    constructor(maxItems = 12) {
        this.storageKey = 'recentlyViewed';
        this.maxItems = maxItems;
        this.recentlyViewed = this.loadRecentlyViewed();
    }

    /**
     * Load recently viewed from localStorage
     */
    loadRecentlyViewed() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading recently viewed:', error);
            return [];
        }
    }

    /**
     * Save recently viewed to localStorage
     */
    saveRecentlyViewed() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.recentlyViewed));
        } catch (error) {
            console.error('Error saving recently viewed:', error);
        }
    }

    /**
     * Add product to recently viewed
     */
    addProduct(product) {
        if (!product || !product._id) {
            return;
        }

        // Remove if already exists (we'll re-add at the front)
        this.recentlyViewed = this.recentlyViewed.filter(item => item._id !== product._id);

        // Add to front with timestamp
        this.recentlyViewed.unshift({
            _id: product._id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            category: product.category,
            imageUrl: product.imageUrl,
            emoji: product.emoji,
            viewedAt: new Date().toISOString()
        });

        // Keep only max items
        if (this.recentlyViewed.length > this.maxItems) {
            this.recentlyViewed = this.recentlyViewed.slice(0, this.maxItems);
        }

        this.saveRecentlyViewed();
    }

    /**
     * Get recently viewed products
     */
    getRecentlyViewed(limit = null) {
        const items = limit ? this.recentlyViewed.slice(0, limit) : this.recentlyViewed;
        return items;
    }

    /**
     * Clear recently viewed
     */
    clearRecentlyViewed() {
        this.recentlyViewed = [];
        this.saveRecentlyViewed();
    }

    /**
     * Remove specific product
     */
    removeProduct(productId) {
        this.recentlyViewed = this.recentlyViewed.filter(item => item._id !== productId);
        this.saveRecentlyViewed();
    }
}

// Initialize tracker
const recentlyViewedTracker = new RecentlyViewedTracker();

/**
 * Display recently viewed products section
 */
async function displayRecentlyViewed(containerId = 'recently-viewed-container', limit = 6) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    const recentProducts = recentlyViewedTracker.getRecentlyViewed(limit);

    if (recentProducts.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    const html = `
        <div class="recently-viewed-section">
            <div class="section-header">
                <h2>👀 Recently Viewed</h2>
                <button class="clear-recent-btn" onclick="clearRecentlyViewed()">Clear All</button>
            </div>
            <div class="products-grid">
                ${recentProducts.map(product => `
                    <div class="product-card" data-product-id="${product._id}">
                        <div class="product-image">
                            ${product.imageUrl 
                                ? `<img src="${product.imageUrl}" alt="${product.name}" loading="lazy">`
                                : `<div class="product-emoji">${product.emoji || '📦'}</div>`
                            }
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-price">$${product.price.toFixed(2)}${product.unit ? '/' + product.unit : ''}</p>
                            <div class="product-actions">
                                <button class="btn-primary btn-small" onclick="quickAddToCart('${product._id}')">
                                    🛒 Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Clear recently viewed
 */
function clearRecentlyViewed() {
    if (confirm('Clear your recently viewed products?')) {
        recentlyViewedTracker.clearRecentlyViewed();
        displayRecentlyViewed();
        showToast('Recently viewed cleared', 'success');
    }
}

/**
 * Quick add to cart from recently viewed
 */
async function quickAddToCart(productId) {
    try {
        // Fetch full product details
        const response = await api.get(`/products/${productId}`);
        const product = response.data;

        // Add to cart
        if (typeof addToCart === 'function') {
            addToCart(product);
        } else if (typeof window.addToCart === 'function') {
            window.addToCart(product);
        } else {
            showToast('Cart function not available', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Failed to add to cart', 'error');
    }
}
