# Frontend Integration Guide

## Quick Start

### 1. Add API Script to All HTML Files

Add this line before your existing script tags in ALL HTML files:

```html
<script src="api.js"></script>
```

**Files to update:**
- index.html ✅ (Already done)
- shop.html
- cart.html
- track.html
- admin-login.html
- admin.html
- admin-orders.html
- admin-products.html
- admin-drivers.html
- admin-customers.html
- admin-reports.html

### 2. Add Socket.io CDN (for real-time updates)

Add this in the `<head>` section of admin HTML files:

```html
<script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
```

### 3. Add Stripe SDK (for payments)

Add this in cart.html before the closing `</body>` tag:

```html
<script src="https://js.stripe.com/v3/"></script>
```

## Configuration

### Update API URLs

In `api.js`, update these values:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://your-deployed-api.onrender.com/api', // Your Render URL
    STRIPE_KEY: 'pk_live_your_actual_stripe_key',           // Your Stripe key
    SOCKET_URL: 'https://your-deployed-api.onrender.com'    // Your Render URL
};
```

## Code Changes by File

### main.js - Replace localStorage with API calls

#### 1. Load Products from API (Line ~8-44)

Replace the hardcoded `groceries` array:

```javascript
// OLD: const groceries = [...]

// NEW: Load from API
let groceries = [];

async function loadProducts() {
    try {
        const response = await api.getProducts();
        if (response.success) {
            groceries = response.products.map(p => ({
                id: p._id,
                name: p.name,
                price: p.price,
                category: p.category,
                emoji: p.emoji
            }));
            
            // Render products if on shop page
            if (document.getElementById('products-grid')) {
                renderProducts();
            }
        }
    } catch (error) {
        console.error('Error loading products:', error);
        utils.showError('Failed to load products. Please refresh the page.');
    }
}

// Call on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProducts);
} else {
    loadProducts();
}
```

#### 2. Update Checkout Function (Line ~350-450)

Replace localStorage order creation with API call:

```javascript
async function checkout(event) {
    event.preventDefault();
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Get form data
    const formData = new FormData(event.target);
    const orderData = {
        customerInfo: {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address')
        },
        items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity
        })),
        payment: {
            method: formData.get('payment')
        },
        delivery: {
            timePreference: formData.get('delivery-time'),
            instructions: formData.get('instructions')
        },
        notes: formData.get('instructions')
    };
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        
        // If card payment, process with Stripe
        if (orderData.payment.method === 'card') {
            await processStripePayment(orderData);
        } else {
            // Cash or check payment
            const response = await api.createOrder(orderData);
            
            if (response.success) {
                // Clear cart
                cart = [];
                saveCart();
                
                // Show success and redirect
                alert(`Order placed successfully! Order ID: ${response.order.orderId}`);
                window.location.href = 'track.html';
            }
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Error placing order: ' + error.message);
    } finally {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}
```

#### 3. Update Track Order Function

Replace localStorage lookup with API call:

```javascript
async function trackOrder() {
    const phone = document.getElementById('track-phone').value;
    
    if (!phone) {
        alert('Please enter your phone number');
        return;
    }
    
    try {
        utils.showLoading('#tracking-result');
        
        // Connect to socket for real-time updates
        socketManager.connect();
        socketManager.joinTracking(phone);
        
        // Get order from API
        const response = await api.trackOrder(phone);
        
        if (response.success && response.order) {
            displayOrderTracking(response.order);
            
            // Listen for real-time updates
            socketManager.on('order-status-changed', (data) => {
                if (data.orderId === response.order.orderId) {
                    // Reload order data
                    trackOrder();
                }
            });
        } else {
            utils.showError('No order found for this phone number', '#tracking-result');
        }
    } catch (error) {
        console.error('Track order error:', error);
        utils.showError('Error tracking order: ' + error.message, '#tracking-result');
    }
}
```

### auth.js - Update Authentication

#### Replace Session Management (Line ~1-100)

```javascript
// Update login function
async function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    try {
        const response = await api.login(username, password);
        
        if (response.success) {
            // Store user info
            localStorage.setItem('adminSession', JSON.stringify({
                username: response.user.username,
                name: response.user.name,
                role: response.user.role,
                expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
            }));
            
            if (remember) {
                localStorage.setItem('rememberedUser', username);
            }
            
            // Log activity
            logActivity('login', `${response.user.name} logged in`);
            
            // Redirect to dashboard
            window.location.href = 'admin.html';
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Update checkAuth function
async function checkAuth() {
    const session = JSON.parse(localStorage.getItem('adminSession') || '{}');
    const token = api.getToken();
    
    if (!token || !session.username) {
        redirectToLogin();
        return null;
    }
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
        api.removeToken();
        localStorage.removeItem('adminSession');
        redirectToLogin();
        return null;
    }
    
    // Verify token with server
    try {
        const response = await api.verifyToken();
        if (response.success) {
            // Extend session
            session.expiresAt = Date.now() + (8 * 60 * 60 * 1000);
            localStorage.setItem('adminSession', JSON.stringify(session));
            return session;
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        redirectToLogin();
        return null;
    }
}

// Update logout function
async function logout() {
    try {
        await api.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        api.removeToken();
        localStorage.removeItem('adminSession');
        window.location.href = 'admin-login.html';
    }
}
```

### admin.js - Update Dashboard Functions

#### 1. Initialize Socket.io Connection

Add this at the top after page load:

```javascript
// Initialize Socket.io for real-time updates
document.addEventListener('DOMContentLoaded', () => {
    socketManager.connect();
    socketManager.joinAdmin();
    
    // Listen for real-time events
    socketManager.on('new-order', (data) => {
        showNotification(`New Order: ${data.orderId} - $${data.total}`);
        loadDashboardData(); // Reload dashboard
    });
    
    socketManager.on('order-updated', (data) => {
        showNotification(`Order ${data.orderId} status: ${data.status}`);
        if (window.location.pathname.includes('admin-orders')) {
            loadOrders(); // Reload orders page
        }
    });
    
    socketManager.on('driver-status-changed', (data) => {
        showNotification(`Driver ${data.name} is now ${data.status}`);
        if (window.location.pathname.includes('admin-drivers')) {
            loadDrivers(); // Reload drivers page
        }
    });
});
```

#### 2. Replace Order Functions

```javascript
// Load orders from API
async function loadOrders(filters = {}) {
    try {
        utils.showLoading('#orders-table');
        
        const response = await api.getOrders(filters);
        
        if (response.success) {
            renderOrders(response.orders);
            updateOrderStats(response.orders);
        }
    } catch (error) {
        console.error('Load orders error:', error);
        utils.showError('Failed to load orders', '#orders-table');
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await api.updateOrderStatus(orderId, newStatus);
        
        if (response.success) {
            showNotification('Order status updated successfully');
            loadOrders(); // Reload orders
        }
    } catch (error) {
        console.error('Update status error:', error);
        alert('Failed to update order status');
    }
}

// Assign driver to order
async function assignDriverToOrder(orderId, driverId) {
    try {
        const response = await api.assignDriver(orderId, driverId);
        
        if (response.success) {
            showNotification('Driver assigned successfully');
            loadOrders();
        }
    } catch (error) {
        console.error('Assign driver error:', error);
        alert('Failed to assign driver');
    }
}
```

#### 3. Replace Product Functions

```javascript
// Load products
async function loadProducts() {
    try {
        const response = await api.getProducts({ status: 'all' }); // Admin sees all
        
        if (response.success) {
            renderProductsGrid(response.products);
        }
    } catch (error) {
        console.error('Load products error:', error);
        utils.showError('Failed to load products');
    }
}

// Create product
async function createProduct(productData) {
    try {
        const response = await api.createProduct(productData);
        
        if (response.success) {
            showNotification('Product created successfully');
            closeProductModal();
            loadProducts();
        }
    } catch (error) {
        console.error('Create product error:', error);
        alert('Failed to create product: ' + error.message);
    }
}

// Update product
async function updateProduct(productId, productData) {
    try {
        const response = await api.updateProduct(productId, productData);
        
        if (response.success) {
            showNotification('Product updated successfully');
            closeProductModal();
            loadProducts();
        }
    } catch (error) {
        console.error('Update product error:', error);
        alert('Failed to update product: ' + error.message);
    }
}
```

#### 4. Replace Driver Functions

```javascript
// Load drivers
async function loadDrivers() {
    try {
        const response = await api.getDrivers();
        
        if (response.success) {
            renderDriversGrid(response.drivers);
            updateDriverStats(response.drivers);
        }
    } catch (error) {
        console.error('Load drivers error:', error);
        utils.showError('Failed to load drivers');
    }
}

// Create driver
async function createDriver(driverData) {
    try {
        const response = await api.createDriver(driverData);
        
        if (response.success) {
            showNotification(`Driver created! Login: ${response.credentials.username}`);
            closeDriverModal();
            loadDrivers();
        }
    } catch (error) {
        console.error('Create driver error:', error);
        alert('Failed to create driver: ' + error.message);
    }
}

// Update driver status
async function updateDriverStatus(driverId, status) {
    try {
        const response = await api.updateDriverStatus(driverId, status);
        
        if (response.success) {
            loadDrivers();
        }
    } catch (error) {
        console.error('Update driver status error:', error);
    }
}
```

#### 5. Replace Reports Functions

```javascript
// Load dashboard summary
async function loadDashboardData() {
    try {
        const [summary, revenue, topProducts, driverPerf] = await Promise.all([
            api.getSummary({ startDate: getTodayStart(), endDate: getTodayEnd() }),
            api.getDailyRevenue(7),
            api.getTopProducts({ limit: 5 }),
            api.getDriverPerformance()
        ]);
        
        if (summary.success) {
            updateDashboardStats(summary.summary);
        }
        
        if (revenue.success) {
            renderRevenueChart(revenue.dailyRevenue);
        }
        
        if (topProducts.success) {
            renderTopProducts(topProducts.topProducts);
        }
        
        if (driverPerf.success) {
            renderDriverPerformance(driverPerf.drivers);
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}
```

### Add Stripe Payment Processing (cart.html)

Create new file: `stripe-checkout.js`

```javascript
// Initialize Stripe
const stripe = Stripe(API_CONFIG.STRIPE_KEY);
let elements;
let paymentIntent;

// Initialize payment form
async function initStripePayment(amount, orderId) {
    try {
        // Create payment intent
        const response = await api.createPaymentIntent(orderId, amount);
        
        if (response.success) {
            paymentIntent = response.clientSecret;
            
            // Create Stripe Elements
            elements = stripe.elements({ clientSecret: response.clientSecret });
            
            // Create and mount payment element
            const paymentElement = elements.create('payment');
            paymentElement.mount('#payment-element');
        }
    } catch (error) {
        console.error('Stripe init error:', error);
        alert('Failed to initialize payment');
    }
}

// Process Stripe payment
async function processStripePayment(orderData) {
    try {
        // First create the order to get order ID
        const orderResponse = await api.createOrder({
            ...orderData,
            payment: { method: 'card', status: 'pending' }
        });
        
        if (!orderResponse.success) {
            throw new Error('Failed to create order');
        }
        
        const orderId = orderResponse.order.orderId;
        const amount = orderResponse.order.pricing.total;
        
        // Create payment intent
        await initStripePayment(amount, orderId);
        
        // Confirm payment
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/track.html?order=${orderId}`
            }
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        // Clear cart
        cart = [];
        saveCart();
        
        // Payment successful, redirect happens automatically
    } catch (error) {
        console.error('Payment error:', error);
        throw error;
    }
}
```

Add to cart.html:

```html
<!-- Stripe Payment Element Container -->
<div id="payment-element" style="display: none;">
    <!-- Stripe.js will insert the Payment Element here -->
</div>

<!-- Include Stripe SDK and checkout script -->
<script src="https://js.stripe.com/v3/"></script>
<script src="stripe-checkout.js"></script>
```

## Testing Checklist

### Local Development

1. **Start Backend:**
   ```bash
   cd server
   npm install
   npm run seed
   npm run dev
   ```

2. **Start Frontend:**
   Use Live Server or similar to serve HTML files

3. **Test Features:**
   - [ ] Products load from API
   - [ ] Can add items to cart
   - [ ] Checkout creates order in database
   - [ ] Order tracking works with phone number
   - [ ] Admin login works
   - [ ] Admin can view/update orders
   - [ ] Admin can manage products
   - [ ] Admin can manage drivers
   - [ ] Reports show real data
   - [ ] Real-time updates work (Socket.io)
   - [ ] Stripe payment test (use 4242 4242 4242 4242)

### Production Deployment

1. **Deploy Backend to Render:**
   - Create Web Service
   - Set environment variables
   - Run seed script

2. **Deploy Frontend:**
   - Update API_CONFIG with production URLs
   - Deploy to Netlify/Vercel/GitHub Pages

3. **Configure Stripe Webhooks:**
   - Add webhook URL in Stripe dashboard
   - Update STRIPE_WEBHOOK_SECRET

## Helper Functions

Add these utility functions to api.js or create utils.js:

```javascript
// Show notification toast
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Format date helpers
function getTodayStart() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}

function getTodayEnd() {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
}

// Phone number formatter
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phone;
}
```

## CSS for Notifications

Add to styles.css or admin.css:

```css
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
}

.notification-success {
    border-left: 4px solid #22c55e;
}

.notification-error {
    border-left: 4px solid #ef4444;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.spinner {
    text-align: center;
    padding: 40px;
    color: #666;
}

.error-message {
    padding: 20px;
    background: #fee;
    color: #c00;
    border-radius: 8px;
    text-align: center;
}

.success-message {
    padding: 20px;
    background: #efe;
    color: #0a0;
    border-radius: 8px;
    text-align: center;
}
```

## Environment Variables Reference

Create `.env` file in server directory:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yourtown-delivery
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=8h
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=http://localhost:5500
```

## Next Steps

1. Complete HTML file updates (add api.js script tag)
2. Update JavaScript functions to use API
3. Test all features locally
4. Deploy backend to Render
5. Deploy frontend to your hosting
6. Configure production environment variables
7. Test production deployment
8. Set up Stripe webhooks
9. Monitor logs and errors

## Support

If you encounter issues:
- Check browser console for errors
- Check server logs in Render dashboard
- Verify MongoDB Atlas connection
- Test API endpoints with Postman
- Check Socket.io connection in Network tab
