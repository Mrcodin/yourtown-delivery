/* ===================================
   CART MODULE
   Handles shopping cart functionality
   =================================== */

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
    const countElements = document.querySelectorAll('#cart-count');
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    countElements.forEach(el => (el.textContent = itemCount));

    updateCartPreview();

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

    updateOrderSummary();
}

// Update order summary
function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const delivery = 6.99;

    const tip = parseFloat(document.getElementById('custom-tip')?.value || 0) || 0;

    let discount = 0;
    if (typeof getValidatedPromoCode === 'function') {
        const promoCode = getValidatedPromoCode();
        if (promoCode && promoCode.discount) {
            discount = promoCode.discount;
        }
    }

    const taxableItemsSubtotal = cart.reduce((sum, item) => {
        return sum + (item.isTaxable ? item.price * item.quantity : 0);
    }, 0);

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

// Tip handling
function selectTip(amount) {
    const customTipInput = document.getElementById('custom-tip');
    if (customTipInput) {
        customTipInput.value = amount;
    }

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

    updateTipDisplay(amount);
    updateOrderSummary();
}

function selectCustomTip() {
    const customTipInput = document.getElementById('custom-tip');
    const amount = parseFloat(customTipInput.value) || 0;

    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = '#713f12';
        btn.style.borderColor = '#d97706';
    });

    updateTipDisplay(amount);
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cart,
        loadCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        updateOrderSummary,
    };
}
