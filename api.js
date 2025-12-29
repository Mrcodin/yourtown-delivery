/* ===================================
   API CONFIGURATION & UTILITY
   Hometown Delivery - Frontend
   =================================== */

// API Configuration
const API_CONFIG = {
    // Change this to your deployed API URL for production
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://yourtown-delivery-api.onrender.com/api',
    
    // Stripe publishable key
    STRIPE_KEY: 'pk_test_your_stripe_publishable_key', // Replace with your key
    
    // Socket.io URL
    SOCKET_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://yourtown-delivery-api.onrender.com'
};

// API Utility Class
class API {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    // Get auth token
    getToken() {
        return localStorage.getItem('authToken');
    }

    // Set auth token
    setToken(token) {
        localStorage.setItem('authToken', token);
        this.token = token;
    }

    // Remove auth token
    removeToken() {
        localStorage.removeItem('authToken');
        this.token = null;
    }

    // Get default headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic fetch wrapper with loading state management
    async request(endpoint, options = {}) {
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers
            }
        };

        // Generate request ID for tracking
        const requestId = `${endpoint}-${Date.now()}`;
        
        // Show loading if enabled (default true)
        const showLoading = options.showLoading !== false;
        const showOverlay = options.showOverlay === true;
        const loadingMessage = options.loadingMessage || 'Loading...';

        try {
            // Track request start
            if (typeof loading !== 'undefined' && showLoading) {
                loading.startRequest(requestId);
                if (showOverlay) {
                    loading.showOverlay(loadingMessage);
                }
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            // Try to parse response
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = { success: response.ok };
            }

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401 && options.auth !== false) {
                    this.removeToken();
                    if (window.location.pathname.includes('admin')) {
                        window.location.href = '/admin-login.html';
                    }
                }
                
                // Create error object with status
                const error = new Error(data.message || 'Request failed');
                error.status = response.status;
                error.statusCode = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            // Add status code if network error
            if (!error.status && !error.statusCode) {
                error.status = 0;
                error.statusCode = 0;
            }
            
            console.error('API Error:', error);
            throw error;
        } finally {
            // Track request end and hide loading
            if (typeof loading !== 'undefined' && showLoading) {
                loading.endRequest(requestId);
                if (showOverlay) {
                    loading.hideOverlay();
                }
            }
        }
    }

    // GET request
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    // POST request
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    // PUT request
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    // DELETE request
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    // ========== AUTH ENDPOINTS ==========
    async login(username, password) {
        const response = await this.post('/auth/login', { username, password }, { auth: false });
        if (response.success && response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    async logout() {
        const response = await this.post('/auth/logout');
        this.removeToken();
        return response;
    }

    async verifyToken() {
        return this.get('/auth/verify');
    }

    async refreshToken() {
        const response = await this.post('/auth/refresh');
        if (response.success && response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    // ========== PRODUCT ENDPOINTS ==========
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.get(`/products?${params}`, { auth: false });
    }

    async getProduct(id) {
        return this.get(`/products/${id}`, { auth: false });
    }

    async createProduct(productData) {
        return this.post('/products', productData);
    }

    async updateProduct(id, productData) {
        return this.put(`/products/${id}`, productData);
    }

    async deleteProduct(id) {
        return this.delete(`/products/${id}`);
    }

    // ========== ORDER ENDPOINTS ==========
    async getOrders(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.get(`/orders?${params}`);
    }

    async getOrder(id) {
        return this.get(`/orders/${id}`);
    }

    async trackOrder(phone) {
        return this.get(`/orders/track/${phone}`, { auth: false });
    }

    async createOrder(orderData) {
        return this.post('/orders', orderData, { auth: false });
    }

    async updateOrderStatus(id, status) {
        return this.put(`/orders/${id}/status`, { status });
    }

    async assignDriver(orderId, driverId) {
        return this.put(`/orders/${orderId}/assign-driver`, { driverId });
    }

    async cancelOrder(id, reason) {
        return this.delete(`/orders/${id}`, {
            body: JSON.stringify({ reason }),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // ========== CUSTOMER ENDPOINTS ==========
    async getCustomers(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.get(`/customers?${params}`);
    }

    async getCustomer(id) {
        return this.get(`/customers/${id}`);
    }

    async getCustomerByPhone(phone) {
        return this.get(`/customers/by-phone/${phone}`, { auth: false });
    }

    async updateCustomer(id, customerData) {
        return this.put(`/customers/${id}`, customerData);
    }

    async exportCustomers() {
        window.open(`${this.baseURL}/customers/export/csv?token=${this.token}`, '_blank');
    }

    // ========== DRIVER ENDPOINTS ==========
    async getDrivers(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.get(`/drivers?${params}`);
    }

    async getDriver(id) {
        return this.get(`/drivers/${id}`);
    }

    async getDriverOrders(id, filters = {}) {
        const params = new URLSearchParams(filters);
        return this.get(`/drivers/${id}/orders?${params}`);
    }

    async createDriver(driverData) {
        return this.post('/drivers', driverData);
    }

    async updateDriver(id, driverData) {
        return this.put(`/drivers/${id}`, driverData);
    }

    async updateDriverStatus(id, status) {
        return this.put(`/drivers/${id}/status`, { status });
    }

    async deleteDriver(id) {
        return this.delete(`/drivers/${id}`);
    }

    // ========== REPORT ENDPOINTS ==========
    async getSummary(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.get(`/reports/summary?${params}`);
    }

    async getDailyRevenue(days = 7) {
        return this.get(`/reports/daily-revenue?days=${days}`);
    }

    async getTopProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.get(`/reports/top-products?${params}`);
    }

    async getDriverPerformance() {
        return this.get('/reports/driver-performance');
    }

    async getCustomerInsights() {
        return this.get('/reports/customer-insights');
    }

    // ========== ACTIVITY LOG ENDPOINTS ==========
    async getActivityLogs(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.get(`/activity-logs?${params}`);
    }

    // ========== PAYMENT ENDPOINTS ==========
    async createPaymentIntent(orderId, amount) {
        return this.post('/payments/create-intent', { orderId, amount }, { auth: false });
    }

    async confirmPayment(orderId, paymentIntentId) {
        return this.post('/payments/confirm', { orderId, paymentIntentId }, { auth: false });
    }

    async getPaymentStatus(paymentIntentId) {
        return this.get(`/payments/status/${paymentIntentId}`, { auth: false });
    }

    async createRefund(paymentIntentId, amount, reason) {
        return this.post('/payments/refund', { paymentIntentId, amount, reason });
    }
}

// Create singleton instance
const api = new API();

// Socket.io Connection Manager
class SocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect() {
        if (this.socket) return;

        // Load Socket.io from CDN if not already loaded
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
            script.onload = () => this.initSocket();
            document.head.appendChild(script);
        } else {
            this.initSocket();
        }
    }

    initSocket() {
        this.socket = io(API_CONFIG.SOCKET_URL, {
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            // console.log('✅ Socket.io connected');
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            // console.log('❌ Socket.io disconnected');
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.io connection error:', error);
        });
    }

    joinAdmin() {
        if (this.socket) {
            this.socket.emit('join-admin');
        }
    }

    joinDriver(driverId) {
        if (this.socket) {
            this.socket.emit('join-driver', driverId);
        }
    }

    joinTracking(phone) {
        if (this.socket) {
            this.socket.emit('join-tracking', phone);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }
}

// Create singleton instance
const socketManager = new SocketManager();

// Utility functions
const utils = {
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Format date and time
    formatDateTime(date) {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    },

    // Show loading spinner
    showLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = '<div class="spinner">Loading...</div>';
        }
    },

    // Show error message
    showError(message, element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = `<div class="error-message">${message}</div>`;
        } else {
            alert(message);
        }
    },

    // Show success message
    showSuccess(message, element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = `<div class="success-message">${message}</div>`;
        } else {
            alert(message);
        }
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, socketManager, utils, API_CONFIG };
}
