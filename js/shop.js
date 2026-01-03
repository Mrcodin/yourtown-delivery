// ============================================
// SHOP.JS - Product Display & Filtering
// ============================================
// Handles product rendering, filtering, sorting,
// search autocomplete, and quick view modal

// ============ RENDER FUNCTIONS ============

// Render grocery grid
function renderGroceryGrid(items = groceries) {
    const grid = document.getElementById('grocery-grid');
    const emptyState = document.getElementById('empty-state');
    const resultsInfo = document.getElementById('results-count');
    
    if (!grid) return;
    
    if (items.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    if (resultsInfo) {
        resultsInfo.textContent = `Showing ${items.length} item${items.length !== 1 ? 's' : ''}`;
    }
    
    grid.innerHTML = items.map(item => {
        const imageHtml = item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">`
            : item.emoji;
        
        const inWishlist = wishlistManager.isInWishlist(item._id || item.id);
        const heartIcon = inWishlist ? '❤️' : '🤍';
        
        return `
        <div class="grocery-item" data-category="${item.category}" data-product-id="${item._id || item.id}">
            <button class="wishlist-btn ${inWishlist ? 'active' : ''}" 
                    onclick="toggleWishlist(event, '${item._id || item.id}')"
                    title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                ${heartIcon}
            </button>
            <div class="item-image" onclick="viewProduct('${item._id || item.id}')" style="cursor: pointer;">${imageHtml}</div>
            <div class="item-content">
                <h3 class="item-name">${item.name}</h3>
                <div class="item-price">$${item.price.toFixed(2)}</div>
                <div style="display: flex; gap: 8px;">
                    <button class="add-btn" onclick="addToCart('${item._id || item.id}')" style="flex: 1;">
                        Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="viewProduct('${item._id || item.id}')" style="padding: 12px; width: 44px;" title="Quick View">
                        👁️
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Render cart items
function renderCartItems() {
    const cartContainer = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const orderSummary = document.getElementById('order-summary');
    const cartActions = document.getElementById('cart-actions');
    
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '';
        if (emptyCart) emptyCart.style.display = 'block';
        if (orderSummary) orderSummary.style.display = 'none';
        if (cartActions) cartActions.style.display = 'none';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (orderSummary) orderSummary.style.display = 'block';
    if (cartActions) cartActions.style.display = 'flex';
    
    cartContainer.innerHTML = cart.map(item => {
        const imageHtml = item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
            : item.emoji;
        
        return `
        <div class="cart-item">
            <div class="cart-item-image">${imageHtml}</div>
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
            </div>
            <div class="quantity-controls">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                <span class="qty-number">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
            <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
            <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">×</button>
        </div>
        `;
    }).join('');
    
    // Update summary
    updateOrderSummary();
}

// Update order summary
function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = 6.99;
    
    // Get tip amount
    const tip = parseFloat(document.getElementById('custom-tip')?.value || 0) || 0;
    
    // Get discount from validated promo code (if available)
    let discount = 0;
    if (typeof getValidatedPromoCode === 'function') {
        const promoCode = getValidatedPromoCode();
        if (promoCode && promoCode.discount) {
            discount = promoCode.discount;
        }
    }
    
    // Calculate taxable items subtotal (non-food items like soap, paper products)
    const taxableItemsSubtotal = cart.reduce((sum, item) => {
        return sum + (item.isTaxable ? item.price * item.quantity : 0);
    }, 0);
    
    // Calculate Washington state sales tax - Chelan County 8.4%
    // NOTE: Groceries are tax-exempt in WA (RCW 82.08.0293)
    // Taxable: delivery fee + non-food items only
    const taxRate = 0.084;
    const taxableAmount = delivery + taxableItemsSubtotal;
    const tax = taxableAmount * taxRate;
    
    const total = subtotal + delivery + tip + tax - discount;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const summaryItemCount = document.getElementById('summary-item-count');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTax = document.getElementById('summary-tax');
    const summaryTotal = document.getElementById('summary-total');
    
    if (summaryItemCount) summaryItemCount.textContent = itemCount;
    if (summarySubtotal) summarySubtotal.textContent = subtotal.toFixed(2);
    if (summaryTax) summaryTax.textContent = tax.toFixed(2);
    if (summaryTotal) summaryTotal.textContent = total.toFixed(2);
}

// ============ FILTERING & SORTING ============

// Filter by category
function filterCategory(category, btn) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    // Use the new filter system
    applyFilters();
}

// Search items
function searchItems() {
    applyFilters();
}

// Sort products
function sortProducts() {
    const sortValue = document.getElementById('sort-select')?.value;
    if (!sortValue) return;
    
    let sortedGroceries = [...groceries];
    
    switch(sortValue) {
        case 'name-asc':
            sortedGroceries.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sortedGroceries.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            sortedGroceries.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sortedGroceries.sort((a, b) => b.price - a.price);
            break;
        case 'default':
        default:
            // Keep original order (as loaded from API)
            break;
    }
    
    applyFilters(sortedGroceries);
}

// Apply all filters (price, stock, search, category)
function applyFilters(productsToFilter) {
    try {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase().trim();
        const priceFilter = document.getElementById('price-filter')?.value || 'all';
        const inStockOnly = document.getElementById('in-stock-filter')?.checked;
        const activeCategory = document.querySelector('.category-btn.active')?.textContent.trim();
        
        // Start with provided products or all groceries
        let filtered = productsToFilter || [...groceries];
        
        // Apply category filter
        if (activeCategory && !activeCategory.includes('All Items')) {
            const categoryMap = {
                '🥬 Produce': 'produce',
                '🥛 Dairy & Eggs': 'dairy',
                '🍞 Bakery': 'bakery',
                '🥩 Meat': 'meat',
                '🥫 Pantry': 'pantry',
                '🧊 Frozen': 'frozen',
                '🥤 Beverages': 'beverages'
            };
            const category = categoryMap[activeCategory];
            if (category) {
                filtered = filtered.filter(item => item.category === category);
            }
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply price filter
        if (priceFilter !== 'all') {
            const [min, max] = priceFilter.split('-').map(Number);
            filtered = filtered.filter(item => 
                item.price >= min && item.price <= max
            );
        }
        
        // Apply stock filter (for now, all items are in stock, but ready for future)
        if (inStockOnly) {
            // When we add stock field to products, filter here
            // filtered = filtered.filter(item => item.inStock !== false);
        }
        
        renderGroceryGrid(filtered);
    } catch (error) {
        if (typeof ErrorTracker !== 'undefined') {
            ErrorTracker.captureError(error, {
                context: 'Shop',
                action: 'applyFilters'
            });
        }
        console.error('Error applying filters:', error);
    }
}

// Clear all filters
function clearFilters() {
    // Reset sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'default';
    
    // Reset price filter
    const priceFilter = document.getElementById('price-filter');
    if (priceFilter) priceFilter.value = 'all';
    
    // Reset stock filter
    const stockFilter = document.getElementById('in-stock-filter');
    if (stockFilter) stockFilter.checked = false;
    
    // Reset search
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // Reset category to "All Items"
    const allButton = document.querySelector('.category-btn');
    if (allButton) {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        allButton.classList.add('active');
    }
    
    // Show all products
    renderGroceryGrid(groceries);
}

// ============ QUICK VIEW MODAL ============

function openQuickView(itemId) {
    try {
        const item = groceries.find(g => g.id === itemId);
        if (!item) {
            console.error('Product not found:', itemId);
            return;
        }
        
        const modal = document.getElementById('quick-view-modal');
        if (!modal) {
            console.error('Quick view modal not found. This feature is only available on the shop page.');
            if (typeof showToast !== 'undefined') {
                showToast('⚠️ Quick view not available on this page', 'error');
            }
            return;
        }
        
        // Check if all required elements exist
        const requiredElements = ['qv-image', 'qv-name', 'qv-price', 'qv-category', 'qv-quantity', 'qv-add-btn'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Missing quick view elements:', missingElements);
            if (typeof showToast !== 'undefined') {
                showToast('⚠️ Quick view is not properly configured', 'error');
            }
            return;
        }
        
        // Populate modal
        const imageHtml = item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.name}">`
            : item.emoji;
        
        document.getElementById('qv-image').innerHTML = imageHtml;
        document.getElementById('qv-name').textContent = item.name;
        document.getElementById('qv-price').textContent = `$${item.price.toFixed(2)}`;
        document.getElementById('qv-category').textContent = item.category;
        document.getElementById('qv-quantity').value = 1;
        
        // Set up add to cart button
        const addBtn = document.getElementById('qv-add-btn');
        addBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('qv-quantity').value);
            for (let i = 0; i < quantity; i++) {
                addToCart(itemId);
            }
            closeQuickView();
            if (typeof showToast !== 'undefined') {
                showToast(`✅ Added ${quantity} ${item.name} to cart!`, 'success');
            }
        };
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Close on ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeQuickView();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeQuickView();
            }
        };
    } catch (error) {
        if (typeof ErrorTracker !== 'undefined') {
            ErrorTracker.captureError(error, {
                context: 'Shop',
                action: 'openQuickView',
                itemId: itemId
            });
        }
        console.error('Error opening quick view:', error);
        if (typeof showToast !== 'undefined') {
            showToast('⚠️ Unable to open quick view', 'error');
        }
        // Ensure scrolling is restored even if there's an error
        document.body.style.overflow = 'auto';
    }
}

function closeQuickView() {
    const modal = document.getElementById('quick-view-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    // Always restore scrolling, even if modal doesn't exist
    document.body.style.overflow = 'auto';
}

function adjustQvQuantity(delta) {
    const input = document.getElementById('qv-quantity');
    const current = parseInt(input.value);
    const newValue = Math.max(1, Math.min(99, current + delta));
    input.value = newValue;
}

// ============ SEARCH AUTOCOMPLETE ============

let searchTimeout;
function setupSearchAutocomplete() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    // Create autocomplete container
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.id = 'search-autocomplete';
    autocompleteContainer.className = 'search-autocomplete';
    searchInput.parentNode.style.position = 'relative';
    searchInput.parentNode.appendChild(autocompleteContainer);
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            const matches = groceries
                .filter(item => 
                    item.name.toLowerCase().includes(query) ||
                    item.category.toLowerCase().includes(query)
                )
                .slice(0, 5);
            
            if (matches.length === 0) {
                autocompleteContainer.innerHTML = '';
                autocompleteContainer.style.display = 'none';
                return;
            }
            
            autocompleteContainer.innerHTML = matches.map(item => {
                const imageHtml = item.imageUrl 
                    ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px;">`
                    : `<span style="font-size: 32px;">${item.emoji}</span>`;
                
                return `
                    <div class="autocomplete-item" onclick="selectSearchItem('${item.id}', '${item.name.replace(/'/g, "\\'")}')">
                        <div class="autocomplete-image">${imageHtml}</div>
                        <div class="autocomplete-details">
                            <div class="autocomplete-name">${highlightMatch(item.name, query)}</div>
                            <div class="autocomplete-meta">${item.category} • $${item.price.toFixed(2)}</div>
                        </div>
                        <button class="autocomplete-add" onclick="event.stopPropagation(); addToCart('${item.id}'); closeAutocomplete();">+</button>
                    </div>
                `;
            }).join('');
            
            autocompleteContainer.style.display = 'block';
        }, 300);
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            autocompleteContainer.style.display = 'none';
        }
    });
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

function selectSearchItem(itemId, itemName) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = itemName;
        applyFilters();
        closeAutocomplete();
    }
}

function closeAutocomplete() {
    const autocomplete = document.getElementById('search-autocomplete');
    if (autocomplete) {
        autocomplete.style.display = 'none';
    }
}

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', function() {
    // Render grocery grid if on shop page
    if (document.getElementById('grocery-grid')) {
        renderGroceryGrid();
    }
    
    // Initialize autocomplete on shop page
    if (document.getElementById('search-input')) {
        if (groceries.length === 0) {
            // Wait for products to load
            setTimeout(() => {
                if (groceries.length > 0) {
                    setupSearchAutocomplete();
                }
            }, 1000);
        } else {
            setupSearchAutocomplete();
        }
    }
});

// ============ EXPORTS ============

// Wishlist toggle helper
function toggleWishlist(event, productId) {
    event.stopPropagation();
    
    const product = groceries.find(p => (p._id || p.id) === productId);
    if (!product) return;
    
    if (wishlistManager.isInWishlist(productId)) {
        wishlistManager.removeFromWishlist(productId);
    } else {
        wishlistManager.addToWishlist(product);
    }
    
    // Re-render to update heart icons
    const currentFilters = {
        search: document.getElementById('search-input')?.value,
        price: document.getElementById('price-filter')?.value,
        inStock: document.getElementById('in-stock-filter')?.checked,
        category: document.querySelector('.category-btn.active')?.textContent
    };
    applyFilters();
}

// View product (tracks view and opens quick view)
function viewProduct(productId) {
    const product = groceries.find(p => (p._id || p.id) === productId);
    if (product && recentlyViewedTracker) {
        recentlyViewedTracker.addProduct(product);
    }
    openQuickView(productId);
}

// Expose functions globally for onclick handlers
window.renderGroceryGrid = renderGroceryGrid;
window.renderCartItems = renderCartItems;
window.updateOrderSummary = updateOrderSummary;
window.filterCategory = filterCategory;
window.searchItems = searchItems;
window.sortProducts = sortProducts;
window.applyFilters = applyFilters;
window.toggleWishlist = toggleWishlist;
window.viewProduct = viewProduct;
window.clearFilters = clearFilters;
window.openQuickView = openQuickView;
window.closeQuickView = closeQuickView;
window.adjustQvQuantity = adjustQvQuantity;
window.setupSearchAutocomplete = setupSearchAutocomplete;
window.selectSearchItem = selectSearchItem;
window.closeAutocomplete = closeAutocomplete;
