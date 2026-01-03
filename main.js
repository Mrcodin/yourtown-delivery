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
                emoji: p.emoji || '📦',
                imageUrl: p.imageUrl || null,
                isTaxable: p.isTaxable || false,
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
        message.showError(message.getUserFriendlyError(error), 'Connection Error', gridContainer);
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
    countElements.forEach(el => (el.textContent = itemCount));

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
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
            imageUrl: product.imageUrl,
            quantity: 1,
            isTaxable: product.isTaxable || false,
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
                    quantity: 1,
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

    grid.innerHTML = items
        .map(item => {
            const imageHtml = item.imageUrl
                ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                : item.emoji;

            return `
        <div class="grocery-item" data-category="${item.category}">
            <div class="item-image" onclick="openQuickView('${item.id}')" style="cursor: pointer;">${imageHtml}</div>
            <div class="item-content">
                <h3 class="item-name">${item.name}</h3>
                <div class="item-price">$${item.price.toFixed(2)}</div>
                <div style="display: flex; gap: 8px;">
                    <button class="add-btn" onclick="addToCart('${item.id}')" style="flex: 1;">
                        Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="openQuickView('${item.id}')" style="padding: 12px; width: 44px;" title="Quick View">
                        👁️
                    </button>
                </div>
            </div>
        </div>
        `;
        })
        .join('');
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

    const filtered = groceries.filter(
        item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
    );

    renderGroceryGrid(filtered);
}

// Sort products
function sortProducts() {
    const sortValue = document.getElementById('sort-select')?.value;
    if (!sortValue) return;

    let sortedGroceries = [...groceries];

    switch (sortValue) {
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
            '🥤 Beverages': 'beverages',
        };
        const category = categoryMap[activeCategory];
        if (category) {
            filtered = filtered.filter(item => item.category === category);
        }
    }

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(
            item =>
                item.name.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
        );
    }

    // Apply price filter
    if (priceFilter !== 'all') {
        const [min, max] = priceFilter.split('-').map(Number);
        filtered = filtered.filter(item => item.price >= min && item.price <= max);
    }

    // Apply stock filter (for now, all items are in stock, but ready for future)
    if (inStockOnly) {
        // When we add stock field to products, filter here
        // filtered = filtered.filter(item => item.inStock !== false);
    }

    renderGroceryGrid(filtered);
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

// Update filter category to work with new filter system
function filterCategory(category, btn) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Use the new filter system
    applyFilters();
}

// Update search to work with new filter system
function searchItems() {
    applyFilters();
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

    cartContainer.innerHTML = cart
        .map(item => {
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
        })
        .join('');

    // Update summary
    updateOrderSummary();
}

// Update order summary
function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
        message.showError(
            'Please fill in all required fields (name, phone, and address).',
            'Missing Information'
        );
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
        progress.createStepProgress(
            progressContainer,
            ['Validating', 'Processing', 'Confirming', 'Complete'],
            0
        );
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
                address,
            },
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
            })),
            delivery: {
                timePreference: deliveryTime,
                instructions: notes,
            },
            payment: {
                method: paymentMethod.value,
            },
            notes,
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
            stack: error.stack,
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

        message.showError(errorMessage, 'Order Failed');

        loading.buttonLoading(submitBtn, false);
    }
}

// ============ ORDER TRACKING ============
async function trackOrder() {
    const phoneInput = document.getElementById('track-phone');
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if (!phone) {
        toast.error('Please enter your phone number');
        return;
    }

    const statusContainer = document.getElementById('order-status');
    const noOrderMessage = document.getElementById('no-order');

    loading.showOverlay('Finding your order...');

    try {
        // Call API to track order
        const response = await fetch(
            `${API_CONFIG.BASE_URL}/orders/track/${encodeURIComponent(phone)}`
        );
        const data = await response.json();

        if (!response.ok || !data.success || !data.order) {
            if (statusContainer) statusContainer.style.display = 'none';
            if (noOrderMessage) {
                noOrderMessage.style.display = 'block';
            } else {
                toast.info('No recent orders found for this phone number');
            }
            loading.hideOverlay();
            return;
        }

        const order = data.order;

        if (noOrderMessage) noOrderMessage.style.display = 'none';
        if (statusContainer) statusContainer.style.display = 'block';

        // Fill in order details
        const orderIdEl = document.getElementById('order-id');
        if (orderIdEl) {
            orderIdEl.textContent = order.orderId || order._id.substring(0, 8);
            orderIdEl.dataset.mongoId = order._id; // Store MongoDB ID
        }

        const orderDateEl = document.getElementById('order-date');
        if (orderDateEl) {
            orderDateEl.textContent = new Date(order.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        }

        const orderTotalEl = document.getElementById('order-total');
        if (orderTotalEl) {
            const total = order.pricing?.total || order.totalAmount || order.total || 0;
            orderTotalEl.textContent = total.toFixed(2);
        }

        const placedTimeEl = document.getElementById('placed-time');
        if (placedTimeEl) {
            placedTimeEl.textContent = new Date(order.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
            });
        }

        // Display driver info if available
        if (order.delivery && order.delivery.driverId) {
            const driverInfo = document.getElementById('driver-info');
            if (driverInfo) {
                const driver = order.delivery.driverId;
                const driverName =
                    `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Your Driver';

                const driverNameEl = document.getElementById('driver-full-name');
                if (driverNameEl) driverNameEl.textContent = driverName;

                const driverVehicleEl = document.getElementById('driver-vehicle');
                if (driverVehicleEl) {
                    driverVehicleEl.textContent = driver.vehicle || 'On the way';
                }

                // Show driver info if order is picked up
                if (order.delivery.pickedUpAt) {
                    driverInfo.style.display = 'block';

                    // Show driver phone if available
                    const contactBtn = driverInfo.querySelector('a[href^="tel:"]');
                    if (contactBtn && driver.phone) {
                        contactBtn.href = `tel:${driver.phone}`;
                    }
                }
            }
        }

        // Update status timeline
        updateStatusTimeline(order.status, order);

        // Handle cancel button visibility
        updateCancelButton(order);

        // Connect to Socket.io for real-time updates
        connectOrderTracking(order);

        loading.hideOverlay();
        toast.success('Order found!');
    } catch (error) {
        console.error('Track order error:', error);
        loading.hideOverlay();
        toast.error('Error tracking order. Please try again.');
    }
}

// Update cancel button based on order status
function updateCancelButton(order) {
    const cancelSection = document.getElementById('cancel-order-section');
    if (!cancelSection) return;

    // Allow cancellation only for placed and confirmed orders
    const cancelableStatuses = ['placed', 'confirmed'];
    if (cancelableStatuses.includes(order.status) && !order.delivery?.pickedUpAt) {
        cancelSection.style.display = 'block';
    } else {
        cancelSection.style.display = 'none';
    }
}

// Connect to Socket.io for real-time tracking
function connectOrderTracking(order) {
    if (!window.io) return;

    try {
        const socket = io(API_CONFIG.SOCKET_URL || 'http://localhost:3000');

        socket.on('connect', () => {
            console.log('Connected to order tracking');
            // Join tracking room for this phone number
            socket.emit('track-order', { phone: order.customerInfo?.phone });
        });

        socket.on('order-status-changed', data => {
            if (data.orderId === order.orderId || data._id === order._id) {
                console.log('Order status updated:', data.status);
                updateStatusTimeline(data.status, data);
                toast.success(`Order status updated: ${formatStatus(data.status)}`);

                // Reload if status changed significantly
                if (window.location.pathname.includes('track.html')) {
                    setTimeout(() => trackOrder(), 1000);
                }
            }
        });

        socket.on('driver-assigned', data => {
            if (data.orderId === order.orderId || data._id === order._id) {
                toast.success('A driver has been assigned to your order!');
                setTimeout(() => trackOrder(), 1000);
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from order tracking');
        });
    } catch (error) {
        console.error('Socket.io connection error:', error);
    }
}

function updateStatusTimeline(status, order) {
    // Map API status to timeline elements
    const statusMapping = {
        placed: ['status-confirmed'],
        confirmed: ['status-confirmed'],
        shopping: ['status-confirmed', 'status-shopping'],
        delivering: ['status-confirmed', 'status-shopping', 'status-delivering'],
        delivered: ['status-confirmed', 'status-shopping', 'status-delivering', 'status-delivered'],
        cancelled: [], // Don't mark any as completed if cancelled
    };

    const completedStatuses = statusMapping[status] || [];

    // Reset all statuses first
    ['status-confirmed', 'status-shopping', 'status-delivering', 'status-delivered'].forEach(
        statusId => {
            const statusEl = document.getElementById(statusId);
            if (statusEl) {
                statusEl.classList.remove('completed');
                const marker = statusEl.querySelector('.timeline-marker');
                const markerNumbers = {
                    'status-confirmed': '2',
                    'status-shopping': '3',
                    'status-delivering': '4',
                    'status-delivered': '5',
                };
                if (marker) marker.textContent = markerNumbers[statusId] || '';
            }
        }
    );

    // Mark completed statuses
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

    // Show/hide cancel button based on order status
    const cancelSection = document.getElementById('cancel-order-section');
    if (cancelSection) {
        if (status === 'placed' || status === 'confirmed') {
            cancelSection.style.display = 'block';
        } else {
            cancelSection.style.display = 'none';
        }
    }
}

function formatStatus(status) {
    const statusLabels = {
        placed: 'Order Placed',
        confirmed: 'Order Confirmed',
        shopping: 'Shopping in Progress',
        delivering: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
    };
    return statusLabels[status] || status;
}

// ============ ORDER CANCELLATION ============
let currentOrderId = null;

function showCancelModal() {
    const modal = document.getElementById('cancel-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeCancelModal() {
    const modal = document.getElementById('cancel-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Reset form
        document.getElementById('cancel-reason').value = '';
        document.getElementById('other-reason').value = '';
        document.getElementById('other-reason-container').style.display = 'none';
    }
}

// Expose functions globally for onclick attributes
window.showCancelModal = showCancelModal;
window.closeCancelModal = closeCancelModal;

// Show/hide custom reason textarea
document.addEventListener('DOMContentLoaded', function () {
    const cancelReasonSelect = document.getElementById('cancel-reason');
    if (cancelReasonSelect) {
        cancelReasonSelect.addEventListener('change', function () {
            const otherContainer = document.getElementById('other-reason-container');
            if (this.value === 'other') {
                otherContainer.style.display = 'block';
            } else {
                otherContainer.style.display = 'none';
            }
        });
    }
});

async function confirmCancelOrder() {
    const reasonSelect = document.getElementById('cancel-reason');
    const otherReasonInput = document.getElementById('other-reason');
    const phone = document.getElementById('track-phone').value.trim();

    let reason = reasonSelect.value;

    if (!reason) {
        showToast('Please select a cancellation reason', 'error');
        return;
    }

    if (reason === 'other') {
        const otherReason = otherReasonInput.value.trim();
        if (!otherReason) {
            showToast('Please specify your reason', 'error');
            return;
        }
        reason = otherReason;
    }

    // Get order ID from the page
    const orderIdEl = document.getElementById('order-id');
    if (!orderIdEl) {
        showToast('Order information not found', 'error');
        return;
    }

    // Need to store the MongoDB _id when tracking, for now we'll use the orderId
    // We need to modify trackOrder to store the _id
    const orderId = orderIdEl.dataset.mongoId;

    if (!orderId) {
        showToast('Order ID not available', 'error');
        return;
    }

    try {
        loading.showOverlay('Cancelling your order...');

        const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason, phone }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to cancel order');
        }

        // Close modal
        closeCancelModal();

        // Show prominent success message
        showToast('✅ Order Cancelled Successfully', 'success');

        // Update status display immediately
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = '❌ CANCELLED';
            statusBadge.style.background = '#dc2626';
            statusBadge.style.color = 'white';
        }

        // Hide cancel button
        const cancelBtn = document.querySelector('button[onclick="showCancelModal()"]');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }

        // Add cancellation notice
        const orderInfo = document.querySelector('.order-info-card');
        if (orderInfo) {
            const notice = document.createElement('div');
            notice.style.cssText =
                'background: #fee2e2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin-top: 20px; text-align: center;';
            notice.innerHTML = `
                <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 22px;">
                    ✅ Your order has been cancelled
                </h3>
                <p style="font-size: 18px; margin: 0; color: #1f2937;">
                    No charges will be made to your account. You will receive a confirmation email shortly.
                </p>
            `;
            orderInfo.appendChild(notice);
        }

        // Refresh order status after showing immediate feedback
        setTimeout(() => {
            trackOrder();
        }, 2000);
    } catch (error) {
        console.error('Cancel order error:', error);
        showToast(error.message || 'Failed to cancel order. Please contact us directly.', 'error');
    } finally {
        loading.hideOverlay();
    }
}

// Expose globally for onclick attribute
window.confirmCancelOrder = confirmCancelOrder;

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
document.addEventListener('DOMContentLoaded', function () {
    // Load cart
    loadCart();

    // Render grocery grid if on shop page
    if (document.getElementById('grocery-grid')) {
        renderGroceryGrid();
    }

    // Attach checkout handler ONLY if cart-checkout.js is not loaded
    // cart-checkout.js handles the modern Stripe payment flow
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm && typeof handleCheckoutSubmit === 'undefined') {
        // Only attach if cart-checkout.js (which defines handleCheckoutSubmit) is NOT present
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
// ============ TIP HANDLING ============
function selectTip(amount) {
    // Update custom tip input
    const customTipInput = document.getElementById('custom-tip');
    if (customTipInput) {
        customTipInput.value = amount;
    }

    // Update button states
    document.querySelectorAll('.tip-btn').forEach(btn => {
        if (parseInt(btn.dataset.tip) === amount) {
            btn.style.background = '#f59e0b';
            btn.style.color = 'white';
            btn.style.borderColor = '#d97706';
        } else {
            btn.style.background = 'white';
            btn.style.color = '#713f12';
            btn.style.borderColor = '#d97706';
        }
    });

    // Update tip display
    updateTipDisplay(amount);

    // Update order total
    updateOrderSummary();
}

function selectCustomTip() {
    const customTipInput = document.getElementById('custom-tip');
    const amount = parseFloat(customTipInput.value) || 0;

    // Reset preset buttons
    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = '#713f12';
        btn.style.borderColor = '#d97706';
    });

    // Update tip display
    updateTipDisplay(amount);

    // Update order total
    updateOrderSummary();
}

function updateTipDisplay(amount) {
    const tipDisplay = document.getElementById('tip-display');
    const tipAmount = document.getElementById('selected-tip-amount');

    if (tipDisplay && tipAmount) {
        if (amount > 0) {
            tipAmount.textContent = amount.toFixed(2);
            tipDisplay.style.display = 'block';
        } else {
            tipDisplay.style.display = 'none';
        }
    }
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
            console.error(
                'Quick view modal not found. This feature is only available on the shop page.'
            );
            showToast('⚠️ Quick view not available on this page', 'error');
            return;
        }

        // Check if all required elements exist
        const requiredElements = [
            'qv-image',
            'qv-name',
            'qv-price',
            'qv-category',
            'qv-quantity',
            'qv-add-btn',
        ];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));

        if (missingElements.length > 0) {
            console.error('Missing quick view elements:', missingElements);
            showToast('⚠️ Quick view is not properly configured', 'error');
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
            showToast(`✅ Added ${quantity} ${item.name} to cart!`, 'success');
        };

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Close on ESC
        const escHandler = e => {
            if (e.key === 'Escape') {
                closeQuickView();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Close on outside click
        modal.onclick = e => {
            if (e.target === modal) {
                closeQuickView();
            }
        };
    } catch (error) {
        console.error('Error opening quick view:', error);
        showToast('⚠️ Unable to open quick view', 'error');
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

    searchInput.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();

        if (query.length < 2) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => {
            const matches = groceries
                .filter(
                    item =>
                        item.name.toLowerCase().includes(query) ||
                        item.category.toLowerCase().includes(query)
                )
                .slice(0, 5);

            if (matches.length === 0) {
                autocompleteContainer.innerHTML = '';
                autocompleteContainer.style.display = 'none';
                return;
            }

            autocompleteContainer.innerHTML = matches
                .map(item => {
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
                })
                .join('');

            autocompleteContainer.style.display = 'block';
        }, 300);
    });

    // Close on outside click
    document.addEventListener('click', e => {
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

// Initialize autocomplete on shop page
if (document.getElementById('search-input') && groceries.length === 0) {
    // Wait for products to load
    setTimeout(() => {
        if (groceries.length > 0) {
            setupSearchAutocomplete();
        }
    }, 1000);
} else if (document.getElementById('search-input')) {
    setupSearchAutocomplete();
}
