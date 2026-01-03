/**
 * Frequently Bought Together
 * Analyzes purchase patterns and suggests complementary products
 */

class FrequentlyBoughtTogether {
    constructor() {
        this.cacheKey = 'fbtCache';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        this.cache = this.loadCache();
    }

    /**
     * Load cache from localStorage
     */
    loadCache() {
        try {
            const data = localStorage.getItem(this.cacheKey);
            if (!data) return {};

            const cache = JSON.parse(data);
            const now = Date.now();

            // Remove expired entries
            Object.keys(cache).forEach(key => {
                if (cache[key].expiry < now) {
                    delete cache[key];
                }
            });

            return cache;
        } catch (error) {
            console.error('Error loading FBT cache:', error);
            return {};
        }
    }

    /**
     * Save cache to localStorage
     */
    saveCache() {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
        } catch (error) {
            console.error('Error saving FBT cache:', error);
        }
    }

    /**
     * Get suggestions from cache or API
     */
    async getSuggestions(productId, limit = 4) {
        // Check cache first
        if (this.cache[productId] && this.cache[productId].expiry > Date.now()) {
            return this.cache[productId].suggestions;
        }

        // Fetch from API
        try {
            const response = await api.get(
                `/reports/frequently-bought-together/${productId}?limit=${limit}`
            );
            const suggestions = response.data;

            // Cache the results
            this.cache[productId] = {
                suggestions,
                expiry: Date.now() + this.cacheExpiry,
            };
            this.saveCache();

            return suggestions;
        } catch (error) {
            console.error('Error fetching FBT suggestions:', error);
            return [];
        }
    }

    /**
     * Analyze local patterns (fallback if API not available)
     */
    analyzeLocalPatterns(productId, allOrders) {
        const patterns = {};

        // Find all orders containing this product
        const ordersWithProduct = allOrders.filter(order =>
            order.items.some(item => item.product._id === productId)
        );

        // Count co-occurrences
        ordersWithProduct.forEach(order => {
            order.items.forEach(item => {
                if (item.product._id !== productId) {
                    const id = item.product._id;
                    if (!patterns[id]) {
                        patterns[id] = {
                            product: item.product,
                            count: 0,
                            confidence: 0,
                        };
                    }
                    patterns[id].count++;
                }
            });
        });

        // Calculate confidence scores
        const totalOrders = ordersWithProduct.length;
        Object.values(patterns).forEach(pattern => {
            pattern.confidence = (pattern.count / totalOrders) * 100;
        });

        // Sort by confidence and return top results
        return Object.values(patterns)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 4);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache = {};
        localStorage.removeItem(this.cacheKey);
    }
}

// Initialize
const frequentlyBought = new FrequentlyBoughtTogether();

/**
 * Display frequently bought together section
 */
async function displayFrequentlyBought(productId, containerId = 'frequently-bought-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    try {
        const suggestions = await frequentlyBought.getSuggestions(productId);

        if (!suggestions || suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        const html = `
            <div class="frequently-bought-section">
                <h3>🤝 Frequently Bought Together</h3>
                <div class="fbt-grid">
                    ${suggestions
                        .map(
                            item => `
                        <div class="fbt-item" data-product-id="${item.product._id}">
                            <div class="fbt-image">
                                ${
                                    item.product.imageUrl
                                        ? `<img src="${item.product.imageUrl}" alt="${item.product.name}" loading="lazy">`
                                        : `<div class="product-emoji">${item.product.emoji || '📦'}</div>`
                                }
                            </div>
                            <div class="fbt-info">
                                <h4>${item.product.name}</h4>
                                <p class="fbt-price">$${item.product.price.toFixed(2)}</p>
                                ${item.confidence ? `<p class="fbt-confidence">${item.confidence.toFixed(0)}% buy together</p>` : ''}
                            </div>
                            <button class="btn-secondary btn-small" onclick="addFBTToCart('${item.product._id}')">
                                Add +
                            </button>
                        </div>
                    `
                        )
                        .join('')}
                </div>
                <div class="fbt-actions">
                    <button class="btn-primary" onclick="addAllFBTToCart('${productId}')">
                        🛒 Add All to Cart
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Error displaying FBT:', error);
        container.style.display = 'none';
    }
}

/**
 * Add FBT item to cart
 */
async function addFBTToCart(productId) {
    try {
        const response = await api.get(`/products/${productId}`);
        const product = response.data;

        if (typeof addToCart === 'function') {
            addToCart(product);
        } else if (typeof window.addToCart === 'function') {
            window.addToCart(product);
        }
    } catch (error) {
        console.error('Error adding FBT to cart:', error);
        showToast('Failed to add to cart', 'error');
    }
}

/**
 * Add all FBT items to cart
 */
async function addAllFBTToCart(mainProductId) {
    try {
        const suggestions = await frequentlyBought.getSuggestions(mainProductId);

        let added = 0;
        for (const item of suggestions) {
            try {
                const response = await api.get(`/products/${item.product._id}`);
                const product = response.data;

                if (typeof addToCart === 'function') {
                    addToCart(product, false); // Don't show individual toasts
                } else if (typeof window.addToCart === 'function') {
                    window.addToCart(product, false);
                }
                added++;
            } catch (error) {
                console.error(`Error adding product ${item.product._id}:`, error);
            }
        }

        if (added > 0) {
            showToast(`Added ${added} items to cart`, 'success');
        }
    } catch (error) {
        console.error('Error adding all FBT:', error);
        showToast('Failed to add items', 'error');
    }
}
