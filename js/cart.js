/* ===================================
   CART MANAGEMENT MODULE
   Handles shopping cart operations
   =================================== */

// Global cart data
let cart = [];

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('hometownCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (error) {
            console.error('Error loading cart:', error);
            if (typeof ErrorTracker !== 'undefined') {
                ErrorTracker.captureError(error, {
                    context: 'Cart Loading',
                    action: 'loadCart'
                });
            }
            cart = [];
        }
    }
    updateCartDisplay();
}

// Save cart to localStorage
function saveCart() {
    try {
        localStorage.setItem('hometownCart', JSON.stringify(cart));
        updateCartDisplay();
    } catch (error) {
        console.error('Error saving cart:', error);
        if (typeof ErrorTracker !== 'undefined') {
            ErrorTracker.captureError(error, {
                context: 'Cart Saving',
                action: 'saveCart'
            });
        }
    }
}

// Update all cart displays
function updateCartDisplay() {
    // Update cart count badges
    const countElements = document.querySelectorAll('#cart-count');
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    countElements.forEach(el => el.textContent = itemCount);
    
    // Update cart preview
    updateCartPreview();
    
    // Update cart page if on it
    if (document.getElementById('cart-items')) {
        renderCartItems();
    }
}

// Update floating cart preview
function updateCartPreview() {
    const preview = document.getElementById('cart-preview');
    if (!preview) return;
    
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (itemCount > 0) {
        preview.classList.add('active');
        const previewCount = document.getElementById('preview-count');
        const previewTotal = document.getElementById('preview-total');
        if (previewCount) previewCount.textContent = itemCount;
        if (previewTotal) previewTotal.textContent = total.toFixed(2);
    } else {
        preview.classList.remove('active');
    }
}

// Render cart items on cart page
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

// Add item to cart
function addToCart(productId) {
    const product = groceries.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            emoji: product.emoji,
            imageUrl: product.imageUrl,
            quantity: 1,
            isTaxable: product.isTaxable || false
        });
    }
    
    saveCart();
    showToast(`✅ ${product.name} added to cart!`, 'success');
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

// Update item quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
    }
}

// Clear entire cart
function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        showToast('Cart cleared', 'success');
    }
}

// Load usual order
function loadUsualOrder() {
    if (typeof USUAL_ORDER_IDS === 'undefined' || USUAL_ORDER_IDS.length === 0) {
        showToast('No usual order available', 'info');
        return;
    }
    
    USUAL_ORDER_IDS.forEach(id => {
        const product = groceries.find(p => p.id === id);
        if (product) {
            const existingItem = cart.find(item => item.id === id);
            if (!existingItem) {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    emoji: product.emoji,
                    imageUrl: product.imageUrl,
                    quantity: 1,
                    isTaxable: product.isTaxable || false
                });
            }
        }
    });
    saveCart();
    showToast('✅ Your usual order has been loaded!', 'success');
}

// Get cart total
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Get cart item count
function getCartItemCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Initialize cart on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCart);
} else {
    loadCart();
}

// Expose functions globally for onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.loadUsualOrder = loadUsualOrder;
window.getCartTotal = getCartTotal;
window.getCartItemCount = getCartItemCount;
window.renderCartItems = renderCartItems;
window.updateOrderSummary = updateOrderSummary;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cart,
        loadCart,
        saveCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadUsualOrder,
        getCartTotal,
        getCartItemCount
    };
}
