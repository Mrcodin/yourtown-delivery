/* ===================================
   HOMETOWN DELIVERY - COMPLETE JS
   Version 4.0 - API Integration
   =================================== */

// ============ GROCERY DATABASE (Loaded from API) ============
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
        // console.log('Loading products from API...');
        const response = await api.getProducts({ showLoading: false }); // We handle loading manually
        
        if (response.success && response.products) {
            groceries = response.products.map(p => ({
                id: p._id,
                name: p.name,
                price: p.price,
                category: p.category,
                emoji: p.emoji || '📦'
            }));
            
            // console.log(`✅ Loaded ${groceries.length} products from API`);
            
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
        } else {
            console.error('Failed to load products:', response);
            if (gridContainer) {
                gridContainer.innerHTML = '';
            }
            message.showError(
                'Unable to load products from the server. Please refresh the page to try again.',
                'Failed to Load Products',
                gridContainer
            );
        }
    } catch (error) {
        console.error('Error loading products:', error);
        if (gridContainer) {
            gridContainer.innerHTML = '';
        }
        message.showError(
            message.getUserFriendlyError(error),
            'Connection Error',
            gridContainer
        );
    }
}

// Call loadProducts when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProducts);
} else {
    loadProducts();
}

// Show error message
function showError(message) {
    showToast(message, 'error');
}

// ============ CART MANAGEMENT ============
let cart = [];

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('hometownCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartDisplay();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('hometownCart', JSON.stringify(cart));
    updateCartDisplay();
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
        document.getElementById('preview-count').textContent = itemCount;
        document.getElementById('preview-total').textContent = total.toFixed(2);
    } else {
        preview.classList.remove('active');
    }
}

// Add item to cart
function addToCart(productId) {
    const product = groceries.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            emoji: product.emoji,
            quantity: 1
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
                    quantity: 1
                });
            }
        }
    });
    saveCart();
    showToast('✅ Your usual order has been loaded!', 'success');
}

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
    
    grid.innerHTML = items.map(item => `
        <div class="grocery-item" data-category="${item.category}">
            <div class="item-image">${item.emoji}</div>
            <div class="item-content">
                <h3 class="item-name">${item.name}</h3>
                <div class="item-price">$${item.price.toFixed(2)}</div>
                <button class="add-btn" onclick="addToCart('${item.id}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Filter by category
function filterCategory(category, btn) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    // Filter items
    let filtered = groceries;
    if (category !== 'all') {
        filtered = groceries.filter(item => item.category === category);
    }
    
    renderGroceryGrid(filtered);
}

// Search items
function searchItems() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderGroceryGrid(groceries);
        return;
    }
    
    const filtered = groceries.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
    
    renderGroceryGrid(filtered);
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
    
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">${item.emoji}</div>
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
    `).join('');
    
    // Update summary
    updateOrderSummary();
}

// Update order summary
function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = 6.99;
    const total = subtotal + delivery;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const summaryItemCount = document.getElementById('summary-item-count');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotal = document.getElementById('summary-total');
    
    if (summaryItemCount) summaryItemCount.textContent = itemCount;
    if (summarySubtotal) summarySubtotal.textContent = subtotal.toFixed(2);
    if (summaryTotal) summaryTotal.textContent = total.toFixed(2);
}

// ============ CHECKOUT ============
async function handleCheckout(e) {
    e.preventDefault();
    
    // Check if user is logged in and if email is verified
    if (customerAuth.isLoggedIn() && !customerAuth.isEmailVerified()) {
        message.showError(
            'Please verify your email address before placing an order. Check your inbox for the verification link or go to your account to resend it.',
            'Email Verification Required'
        );
        return;
    }
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const email = document.getElementById('email').value.trim();
    const deliveryTime = document.getElementById('delivery-time').value;
    const notes = document.getElementById('notes').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    
    // Validate
    if (!name || !phone || !address) {
        message.showError('Please fill in all required fields (name, phone, and address).', 'Missing Information');
        return;
    }
    
    if (!paymentMethod) {
        message.showError('Please select a payment method.', 'Payment Method Required');
        return;
    }
    
    // Show loading on button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    loading.buttonLoading(submitBtn, true);
    
    // Show progress indicator
    const progressContainer = document.getElementById('checkout-progress');
    if (progressContainer) {
        progress.createStepProgress(progressContainer, [
            'Validating',
            'Processing',
            'Confirming',
            'Complete'
        ], 0);
    }
    
    try {
        // Step 1: Validating
        if (progressContainer) {
            progress.updateStepProgress(progressContainer, 0);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX
        
        // Step 2: Processing
        if (progressContainer) {
            progress.updateStepProgress(progressContainer, 1);
        }
        
        // Prepare order data
        const orderData = {
            customerInfo: {
                name,
                phone,
                email,
                address
            },
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            })),
            delivery: {
                timePreference: deliveryTime,
                instructions: notes
            },
            payment: {
                method: paymentMethod.value
            },
            notes
        };
        
        // Call API to create order
        const response = await api.createOrder(orderData, { showLoading: false });
        
        // Step 3: Confirming
        if (progressContainer) {
            progress.updateStepProgress(progressContainer, 2);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (response.success && response.order) {
            const order = response.order;
            
            // Step 4: Complete
            if (progressContainer) {
                progress.updateStepProgress(progressContainer, 3);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Show success message
            message.showSuccess(
                `Your order #${order.orderId} has been placed successfully! Total: $${order.pricing.total.toFixed(2)}. We'll call ${phone} within 30 minutes to confirm.`,
                'Order Placed! 🎉',
                null,
                8000
            );
            
            // Clear cart and redirect
            cart = [];
            saveCart();
            
            setTimeout(() => {
                window.location.href = `track.html?phone=${encodeURIComponent(phone)}`;
            }, 2000);
        } else {
            throw new Error(response.message || 'Failed to place order');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response,
            stack: error.stack
        });
        
        // Hide progress on error
        if (progressContainer) {
            progressContainer.innerHTML = '';
        }
        
        // Show specific error message
        let errorMessage = 'Something went wrong. Please try again.';
        if (error.message && error.message !== 'Failed to place order') {
            errorMessage = error.message;
        }
        
        message.showError(
            errorMessage,
            'Order Failed'
        );
        
        loading.buttonLoading(submitBtn, false);
    }
}

// ============ ORDER TRACKING ============
async function trackOrder() {
    const phone = document.getElementById('track-phone').value.trim();
    const trackBtn = document.querySelector('.track-form button[type="submit"]');
    
    if (!phone) {
        message.showError('Please enter your phone number to track your order.', 'Phone Number Required');
        return;
    }
    
    const statusContainer = document.getElementById('order-status');
    const noOrderMessage = document.getElementById('no-order');
    
    // Show loading state
    if (trackBtn) {
        loading.buttonLoading(trackBtn, true);
    }
    
    // Clear previous messages
    message.clearMessages();
    
    try {
        // Call API to track order
        const response = await api.trackOrder(phone, { showLoading: false });
        
        if (!response.success || !response.order) {
            if (statusContainer) statusContainer.style.display = 'none';
            if (noOrderMessage) {
                noOrderMessage.style.display = 'block';
            } else {
                message.showInfo(
                    'We couldn\'t find any recent orders for this phone number. Please check the number and try again.',
                    'No Orders Found'
                );
            }
            return;
        }
        
        const order = response.order;
        
        if (noOrderMessage) noOrderMessage.style.display = 'none';
        if (statusContainer) statusContainer.style.display = 'block';
        
        // Fill in order details
        document.getElementById('order-id').textContent = order.orderId;
        document.getElementById('order-date').textContent = new Date(order.createdAt).toLocaleDateString();
        document.getElementById('order-total').textContent = `$${order.total.toFixed(2)}`;
        document.getElementById('placed-time').textContent = new Date(order.createdAt).toLocaleTimeString();
        
        // Display assigned staff if available
        if (order.assignedShopper) {
            document.getElementById('shopper-name').textContent = order.assignedShopper.name || 'Your shopper';
        }
        if (order.assignedDriver) {
            document.getElementById('driver-name').textContent = order.assignedDriver.name || 'Your driver';
            
            // Show driver info if out for delivery
            if (order.status === 'out_for_delivery' || order.status === 'delivered') {
                const driverInfo = document.getElementById('driver-info');
                if (driverInfo) {
                    driverInfo.style.display = 'block';
                    document.getElementById('driver-full-name').textContent = order.assignedDriver.name;
                    document.getElementById('driver-vehicle').textContent = order.assignedDriver.vehicle || 'Vehicle';
                    
                    // Calculate ETA
                    const eta = new Date(Date.now() + 15 * 60000);
                    document.getElementById('eta-time').textContent = eta.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                }
            }
        }
        
        // Update status timeline
        updateStatusTimeline(order.status);
        
        // Connect to Socket.io for real-time updates
        if (window.socketManager) {
            socketManager.connect();
            socketManager.joinTracking(phone);
            
            // Listen for status updates
            socketManager.on('order-status-changed', (data) => {
                if (data.orderId === order.orderId) {
                    updateStatusTimeline(data.status);
                    message.showSuccess(`Your order status has been updated to: ${formatStatus(data.status)}`, 'Order Updated');
                }
            });
        }
    } catch (error) {
        console.error('Track order error:', error);
        message.showError(
            message.getUserFriendlyError(error),
            'Tracking Error'
        );
    } finally {
        // Always remove loading state
        if (trackBtn) {
            loading.buttonLoading(trackBtn, false);
        }
    }
}

function updateStatusTimeline(status) {
    // Map API status to timeline elements
    const statusMapping = {
        'placed': ['status-confirmed'],
        'confirmed': ['status-confirmed'],
        'in_progress': ['status-confirmed', 'status-shopping'],
        'ready': ['status-confirmed', 'status-shopping'],
        'out_for_delivery': ['status-confirmed', 'status-shopping', 'status-delivering'],
        'delivered': ['status-confirmed', 'status-shopping', 'status-delivering', 'status-delivered']
    };
    
    const completedStatuses = statusMapping[status] || [];
    
    completedStatuses.forEach(statusId => {
        const statusEl = document.getElementById(statusId);
        if (statusEl) {
            statusEl.classList.add('completed');
            const marker = statusEl.querySelector('.timeline-marker');
            if (marker) marker.textContent = '✓';
        }
    });
    
    if (status === 'delivered') {
        document.getElementById('delivered-time').textContent = 'Just now!';
    }
}

function formatStatus(status) {
    const statusLabels = {
        'placed': 'Order Placed',
        'confirmed': 'Order Confirmed',
        'in_progress': 'Being Prepared',
        'ready': 'Ready for Pickup',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusLabels[status] || status;
}

// ============ ACCESSIBILITY ============
function toggleLargeText() {
    document.body.classList.toggle('large-text');
    const btn = document.getElementById('text-size-btn');
    if (btn) {
        btn.textContent = document.body.classList.contains('large-text') 
            ? '🔤 Normal Text' 
            : '🔤 Larger Text';
    }
    localStorage.setItem('largeText', document.body.classList.contains('large-text'));
}

function toggleContrast() {
    document.body.classList.toggle('high-contrast');
    localStorage.setItem('highContrast', document.body.classList.contains('high-contrast'));
}

function speakPage() {
    if (!('speechSynthesis' in window)) {
        showToast('Text-to-speech not supported in your browser', 'error');
        return;
    }
    
    speechSynthesis.cancel();
    
    const mainContent = document.querySelector('main') || document.body;
    const text = mainContent.innerText;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    speechSynthesis.speak(utterance);
    showToast('🔊 Reading page aloud...', 'success');
}

// ============ MOBILE MENU ============
function toggleMobileMenu() {
    const nav = document.getElementById('main-nav');
    if (nav) {
        nav.classList.toggle('active');
    }
}

// ============ TOAST NOTIFICATIONS ============
function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    // Load cart
    loadCart();
    
    // Render grocery grid if on shop page
    if (document.getElementById('grocery-grid')) {
        renderGroceryGrid();
    }
    
    // Attach checkout handler
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
    
    // Load accessibility preferences
    if (localStorage.getItem('largeText') === 'true') {
        document.body.classList.add('large-text');
        const btn = document.getElementById('text-size-btn');
        if (btn) btn.textContent = '🔤 Normal Text';
    }
    
    if (localStorage.getItem('highContrast') === 'true') {
        document.body.classList.add('high-contrast');
    }
});
