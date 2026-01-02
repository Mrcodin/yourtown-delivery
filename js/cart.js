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
