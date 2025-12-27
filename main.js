/* ===================================
   HOMETOWN DELIVERY - COMPLETE JS
   Version 3.0
   =================================== */

// ============ GROCERY DATABASE ============
const groceries = [
    // BAKERY
    { id: 1, name: "White Bread (Loaf)", price: 2.99, category: "bakery", emoji: "🍞" },
    { id: 2, name: "Whole Wheat Bread", price: 3.49, category: "bakery", emoji: "🍞" },
    { id: 3, name: "Dinner Rolls (12 pack)", price: 3.99, category: "bakery", emoji: "🥖" },
    { id: 4, name: "Bagels (6 pack)", price: 4.49, category: "bakery", emoji: "🥯" },
    
    // DAIRY & EGGS
    { id: 5, name: "Whole Milk (1 gallon)", price: 3.49, category: "dairy", emoji: "🥛" },
    { id: 6, name: "2% Milk (1 gallon)", price: 3.49, category: "dairy", emoji: "🥛" },
    { id: 7, name: "Large Eggs (1 dozen)", price: 3.29, category: "dairy", emoji: "🥚" },
    { id: 8, name: "Butter (1 lb)", price: 4.99, category: "dairy", emoji: "🧈" },
    { id: 9, name: "Cheddar Cheese (8 oz)", price: 4.49, category: "dairy", emoji: "🧀" },
    { id: 10, name: "Orange Juice (64 oz)", price: 4.99, category: "dairy", emoji: "🍊" },
    { id: 11, name: "Yogurt (32 oz)", price: 5.49, category: "dairy", emoji: "🥛" },
    
    // PRODUCE
    { id: 12, name: "Bananas (1 lb)", price: 0.69, category: "produce", emoji: "🍌" },
    { id: 13, name: "Apples (3 lb bag)", price: 4.99, category: "produce", emoji: "🍎" },
    { id: 14, name: "Oranges (4 lb bag)", price: 5.99, category: "produce", emoji: "🍊" },
    { id: 15, name: "Lettuce (Head)", price: 1.99, category: "produce", emoji: "🥬" },
    { id: 16, name: "Tomatoes (1 lb)", price: 2.49, category: "produce", emoji: "🍅" },
    { id: 17, name: "Potatoes (5 lb bag)", price: 4.99, category: "produce", emoji: "🥔" },
    { id: 18, name: "Onions (3 lb bag)", price: 2.99, category: "produce", emoji: "🧅" },
    { id: 19, name: "Carrots (2 lb bag)", price: 2.49, category: "produce", emoji: "🥕" },
    
    // MEAT
    { id: 20, name: "Chicken Breast (1 lb)", price: 5.99, category: "meat", emoji: "🍗" },
    { id: 21, name: "Ground Beef (1 lb)", price: 6.99, category: "meat", emoji: "🥩" },
    { id: 22, name: "Bacon (16 oz)", price: 7.99, category: "meat", emoji: "🥓" },
    { id: 23, name: "Deli Turkey (1 lb)", price: 8.99, category: "meat", emoji: "🦃" },
    { id: 24, name: "Deli Ham (1 lb)", price: 7.99, category: "meat", emoji: "🍖" },
    
    // PANTRY
    { id: 25, name: "Peanut Butter (16 oz)", price: 3.99, category: "pantry", emoji: "🥜" },
    { id: 26, name: "Grape Jelly (18 oz)", price: 2.99, category: "pantry", emoji: "🍇" },
    { id: 27, name: "Canned Soup (10 oz)", price: 1.99, category: "pantry", emoji: "🥫" },
    { id: 28, name: "Pasta (16 oz)", price: 1.49, category: "pantry", emoji: "🍝" },
    { id: 29, name: "Pasta Sauce (24 oz)", price: 2.99, category: "pantry", emoji: "🍅" },
    { id: 30, name: "Rice (2 lb bag)", price: 3.99, category: "pantry", emoji: "🍚" },
    { id: 31, name: "Coffee (12 oz)", price: 8.99, category: "pantry", emoji: "☕" },
    { id: 32, name: "Sugar (4 lb)", price: 3.49, category: "pantry", emoji: "🍬" },
    
    // FROZEN
    { id: 33, name: "Frozen Pizza", price: 5.99, category: "frozen", emoji: "🍕" },
    { id: 34, name: "Ice Cream (1.5 qt)", price: 4.99, category: "frozen", emoji: "🍨" },
    { id: 35, name: "Frozen Vegetables (16 oz)", price: 2.49, category: "frozen", emoji: "🥦" },
    { id: 36, name: "Frozen Dinners", price: 3.99, category: "frozen", emoji: "🍱" },
    
    // BEVERAGES
    { id: 37, name: "Bottled Water (24 pack)", price: 4.99, category: "beverages", emoji: "💧" },
    { id: 38, name: "Soda (12 pack)", price: 5.99, category: "beverages", emoji: "🥤" },
    { id: 39, name: "Apple Juice (64 oz)", price: 3.99, category: "beverages", emoji: "🧃" },
    { id: 40, name: "Tea Bags (100 count)", price: 4.99, category: "beverages", emoji: "🍵" },
];

// Usual order items (for seniors)
const USUAL_ORDER_IDS = [1, 5, 7, 12, 17, 27];

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
                <button class="add-btn" onclick="addToCart(${item.id})">
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
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span class="qty-number">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})">×</button>
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
function handleCheckout(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const email = document.getElementById('email').value.trim();
    const deliveryTime = document.getElementById('delivery-time').value;
    const notes = document.getElementById('notes').value.trim();
    const payment = document.querySelector('input[name="payment"]:checked').value;
    
    // Validate
    if (!name || !phone || !address) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Create order
    const order = {
        id: 'ORD-' + Date.now().toString().slice(-6),
        name,
        phone,
        address,
        email,
        deliveryTime,
        notes,
        payment,
        items: cart,
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        delivery: 6.99,
        total: (cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 6.99).toFixed(2),
        timestamp: Date.now(),
        status: 'placed',
        shopper: 'Mary J.',
        driver: 'Tom R.'
    };
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('hometownOrders') || '[]');
    orders.push(order);
    localStorage.setItem('hometownOrders', JSON.stringify(orders));
    
    // Show confirmation
    alert(`🎉 Order Placed Successfully!\n\nOrder #${order.id}\nTotal: $${order.total}\n\nWe'll call ${phone} within 30 minutes to confirm your order.\n\nThank you for using Hometown Delivery!`);
    
    // Clear cart and redirect
    cart = [];
    saveCart();
    window.location.href = 'track.html';
}

// ============ ORDER TRACKING ============
function trackOrder() {
    const phone = document.getElementById('track-phone').value.trim();
    
    if (!phone) {
        showToast('Please enter your phone number', 'error');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('hometownOrders') || '[]');
    const order = orders.find(o => o.phone === phone);
    
    const statusContainer = document.getElementById('order-status');
    const noOrderMessage = document.getElementById('no-order');
    
    if (!order) {
        if (statusContainer) statusContainer.style.display = 'none';
        if (noOrderMessage) noOrderMessage.style.display = 'block';
        return;
    }
    
    if (noOrderMessage) noOrderMessage.style.display = 'none';
    if (statusContainer) statusContainer.style.display = 'block';
    
    // Fill in order details
    document.getElementById('order-id').textContent = order.id;
    document.getElementById('order-date').textContent = new Date(order.timestamp).toLocaleDateString();
    document.getElementById('order-total').textContent = order.total;
    document.getElementById('placed-time').textContent = new Date(order.timestamp).toLocaleTimeString();
    document.getElementById('shopper-name').textContent = order.shopper || 'Your shopper';
    document.getElementById('driver-name').textContent = order.driver || 'Your driver';
    
    // Simulate status progression
    simulateOrderProgress(order);
}

function simulateOrderProgress(order) {
    const statuses = ['status-confirmed', 'status-shopping', 'status-delivering', 'status-delivered'];
    
    statuses.forEach((statusId, index) => {
        setTimeout(() => {
            const statusEl = document.getElementById(statusId);
            if (statusEl) {
                statusEl.classList.add('completed');
                statusEl.querySelector('.timeline-marker').textContent = '✓';
            }
            
            // Show driver info when out for delivery
            if (statusId === 'status-delivering') {
                const driverInfo = document.getElementById('driver-info');
                if (driverInfo) {
                    driverInfo.style.display = 'block';
                    document.getElementById('driver-full-name').textContent = order.driver;
                    document.getElementById('driver-vehicle').textContent = 'Blue Honda Civic';
                }
                
                // Set ETA
                const eta = new Date(Date.now() + 15 * 60000);
                document.getElementById('eta-time').textContent = eta.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            }
            
            if (statusId === 'status-delivered') {
                document.getElementById('delivered-time').textContent = 'Just now!';
            }
        }, (index + 1) * 1500);
    });
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
