/* ===================================
   ADMIN DASHBOARD - JAVASCRIPT
   Version 2.0 - API Integration
   =================================== */

// ============ STATE MANAGEMENT ============
let drivers = [];
let customers = [];
let adminOrders = [];
let products = [];
let dashboardStats = {};

// Socket.io connection
let socket = null;

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', async function () {
    // Connect to Socket.io for real-time updates
    initializeSocketIO();

    // Load initial data from API
    await loadInitialData();

    // Initialize page-specific content
    initializePage();

    // Set current date
    setCurrentDate();

    // Start auto-refresh
    setInterval(refreshDashboard, 60000); // Refresh every minute
});

async function initializeSocketIO() {
    try {
        if (window.socketManager) {
            socket = socketManager.connect();
            socketManager.joinAdmin();

            // Listen for real-time events
            socketManager.on('new-order', order => {
                // console.log('New order received:', order);
                showNotification('New Order', `Order ${order.orderId} placed`);
                adminOrders.unshift(order);
                refreshCurrentPage();
            });

            socketManager.on('order-updated', order => {
                // console.log('Order updated:', order);
                const index = adminOrders.findIndex(o => o._id === order._id);
                if (index !== -1) {
                    adminOrders[index] = order;
                }
                refreshCurrentPage();
            });

            socketManager.on('driver-status-changed', data => {
                // console.log('Driver status changed:', data);
                const driver = drivers.find(d => d._id === data.driverId);
                if (driver) {
                    driver.status = data.status;
                    refreshCurrentPage();
                }
            });

            // console.log('✅ Socket.io connected for admin');
        }
    } catch (error) {
        console.error('Socket.io connection failed:', error);
    }
}

async function loadInitialData() {
    // Show loading overlay
    loading.showOverlay('Loading dashboard data...');

    try {
        // Load all data in parallel
        const [ordersRes, driversRes, customersRes, productsRes] = await Promise.all([
            api.getOrders({ showLoading: false }),
            api.getDrivers({ showLoading: false }),
            api.getCustomers({ showLoading: false }),
            api.getProducts({ showLoading: false }),
        ]);

        if (ordersRes.success) {
            adminOrders = ordersRes.orders || [];
            // console.log(`✅ Loaded ${adminOrders.length} orders from API`);
        } else {
            message.showWarning('Failed to load orders data.', 'Data Loading');
        }

        if (driversRes.success) {
            drivers = driversRes.drivers || [];
            // console.log(`✅ Loaded ${drivers.length} drivers from API`);
        } else {
            message.showWarning('Failed to load drivers data.', 'Data Loading');
        }

        if (customersRes.success) {
            customers = customersRes.customers || [];
            // console.log(`✅ Loaded ${customers.length} customers from API`);
        } else {
            message.showWarning('Failed to load customers data.', 'Data Loading');
        }

        if (productsRes.success) {
            products = productsRes.products || [];
            // console.log(`✅ Loaded ${products.length} products from API`);
        } else {
            message.showWarning('Failed to load products data.', 'Data Loading');
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
        message.showError(message.getUserFriendlyError(error), 'Failed to Load Data');
    } finally {
        // Always hide loading overlay
        loading.hideOverlay();
    }
}

// ============ SAMPLE DATA (LEGACY - Keeping for backward compatibility) ============

// Sample Drivers (replaced by API)
const sampleDrivers = [
    {
        id: 1,
        firstName: 'Mary',
        lastName: 'Johnson',
        phone: '555-111-2222',
        email: 'mary@email.com',
        vehicle: 'Blue Honda Civic',
        vehicleType: 'car',
        licensePlate: 'ABC-1234',
        status: 'online',
        rating: 4.9,
        totalDeliveries: 156,
        earnings: 624,
        joinDate: '2023-01-15',
    },
    {
        id: 2,
        firstName: 'Tom',
        lastName: 'Rodriguez',
        phone: '555-333-4444',
        email: 'tom@email.com',
        vehicle: 'Red Toyota Camry',
        vehicleType: 'car',
        licensePlate: 'XYZ-5678',
        status: 'busy',
        rating: 4.8,
        totalDeliveries: 98,
        earnings: 392,
        joinDate: '2023-06-20',
    },
    {
        id: 3,
        firstName: 'Susan',
        lastName: 'Williams',
        phone: '555-555-6666',
        email: 'susan@email.com',
        vehicle: 'White Ford Explorer',
        vehicleType: 'suv',
        licensePlate: 'DEF-9012',
        status: 'offline',
        rating: 5.0,
        totalDeliveries: 234,
        earnings: 936,
        joinDate: '2022-08-10',
    },
    {
        id: 4,
        firstName: 'James',
        lastName: 'Brown',
        phone: '555-777-8888',
        email: 'james@email.com',
        vehicle: 'Black Chevy Malibu',
        vehicleType: 'car',
        licensePlate: 'GHI-3456',
        status: 'online',
        rating: 4.7,
        totalDeliveries: 67,
        earnings: 268,
        joinDate: '2024-01-05',
    },
];

// Sample Customers (replaced by API)
const sampleCustomers = [
    {
        id: 1,
        name: 'Margaret Roberts',
        phone: '555-100-1001',
        email: 'margaret@email.com',
        address: '123 Oak Street, Apt 2B',
        totalOrders: 24,
        totalSpent: 487.5,
        lastOrder: '2024-01-15',
        notes: 'Prefers morning deliveries',
    },
    {
        id: 2,
        name: 'Robert Thompson',
        phone: '555-100-1002',
        email: 'robert@email.com',
        address: '456 Maple Avenue',
        totalOrders: 18,
        totalSpent: 342.25,
        lastOrder: '2024-01-14',
        notes: 'Leave packages on porch',
    },
    {
        id: 3,
        name: 'Eleanor Baker',
        phone: '555-100-1003',
        email: '',
        address: '789 Pine Road',
        totalOrders: 31,
        totalSpent: 623.8,
        lastOrder: '2024-01-15',
        notes: 'Ring doorbell twice',
    },
];

// Sample Orders (Legacy - replaced by API data)

function initializePage() {
    const path = window.location.pathname;

    if (path.includes('admin.html') || path.endsWith('/admin/')) {
        initDashboard();
    } else if (path.includes('admin-orders.html')) {
        initOrdersPage();
    } else if (path.includes('admin-products.html')) {
        initProductsPage();
    } else if (path.includes('admin-drivers.html')) {
        initDriversPage();
    } else if (path.includes('admin-customers.html')) {
        initCustomersPage();
    } else if (path.includes('admin-reports.html')) {
        initReportsPage();
    }
}

function setCurrentDate() {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

function refreshCurrentPage() {
    const path = window.location.pathname;

    if (path.includes('admin.html') || path.endsWith('/admin/')) {
        updateDashboardStats();
        renderRecentOrders();
        renderActiveDeliveries();
        renderDriversStatus();
        renderActivityTimeline();
    } else if (path.includes('admin-orders.html')) {
        renderOrdersTable();
    } else if (path.includes('admin-drivers.html')) {
        renderDriversTable();
    } else if (path.includes('admin-customers.html')) {
        renderCustomersTable();
    } else if (path.includes('admin-products.html')) {
        renderProductsGrid();
        updateProductCounts();
    }
}

// ============ LOAD DATA (Updated for API) ============

async function refreshDashboard() {
    await loadInitialData();
    refreshCurrentPage();
}

// Legacy function for compatibility
function loadAdminOrders() {
    // Now handled by loadInitialData()
    // console.log('loadAdminOrders() is deprecated - using API');
}

function saveAdminOrders() {
    // No longer saving to localStorage
    // console.log('saveAdminOrders() is deprecated - data saved to API');
}

function generateSampleOrders() {
    const now = Date.now();
    const hour = 3600000;

    return [
        {
            id: 'ORD-001234',
            name: 'Margaret Roberts',
            phone: '555-100-1001',
            address: '123 Oak Street, Apt 2B',
            email: 'margaret@email.com',
            items: [
                { id: 1, name: 'White Bread', price: 2.99, quantity: 2, emoji: '🍞' },
                { id: 5, name: 'Whole Milk', price: 3.49, quantity: 1, emoji: '🥛' },
                { id: 7, name: 'Large Eggs', price: 3.29, quantity: 1, emoji: '🥚' },
            ],
            subtotal: 12.76,
            delivery: 6.99,
            total: '19.75',
            status: 'placed',
            payment: 'cash',
            deliveryTime: 'asap',
            notes: 'Ring doorbell twice',
            timestamp: now - hour * 0.5,
            driver: null,
            shopper: null,
        },
        {
            id: 'ORD-001233',
            name: 'Robert Thompson',
            phone: '555-100-1002',
            address: '456 Maple Avenue',
            email: 'robert@email.com',
            items: [
                { id: 12, name: 'Bananas', price: 0.69, quantity: 3, emoji: '🍌' },
                { id: 20, name: 'Chicken Breast', price: 5.99, quantity: 2, emoji: '🍗' },
            ],
            subtotal: 14.05,
            delivery: 6.99,
            total: '21.04',
            status: 'confirmed',
            payment: 'card',
            deliveryTime: 'morning',
            notes: '',
            timestamp: now - hour * 1,
            driver: null,
            shopper: 'Mary J.',
        },
        {
            id: 'ORD-001232',
            name: 'Eleanor Baker',
            phone: '555-100-1003',
            address: '789 Pine Road',
            email: '',
            items: [
                { id: 31, name: 'Coffee', price: 8.99, quantity: 1, emoji: '☕' },
                { id: 8, name: 'Butter', price: 4.99, quantity: 1, emoji: '🧈' },
            ],
            subtotal: 13.98,
            delivery: 6.99,
            total: '20.97',
            status: 'shopping',
            payment: 'cash',
            deliveryTime: 'afternoon',
            notes: 'Call when arriving',
            timestamp: now - hour * 2,
            driver: 'Tom R.',
            shopper: 'Tom R.',
        },
        {
            id: 'ORD-001231',
            name: 'William Davis',
            phone: '555-100-1004',
            address: '321 Elm Street',
            email: 'william@email.com',
            items: [
                { id: 17, name: 'Potatoes', price: 4.99, quantity: 1, emoji: '🥔' },
                { id: 21, name: 'Ground Beef', price: 6.99, quantity: 2, emoji: '🥩' },
            ],
            subtotal: 18.97,
            delivery: 6.99,
            total: '25.96',
            status: 'delivering',
            payment: 'check',
            deliveryTime: 'asap',
            notes: '',
            timestamp: now - hour * 3,
            driver: 'Mary J.',
            shopper: 'Mary J.',
        },
        {
            id: 'ORD-001230',
            name: 'Patricia Wilson',
            phone: '555-100-1005',
            address: '654 Birch Lane',
            email: 'patricia@email.com',
            items: [{ id: 34, name: 'Ice Cream', price: 4.99, quantity: 2, emoji: '🍨' }],
            subtotal: 9.98,
            delivery: 6.99,
            total: '16.97',
            status: 'delivered',
            payment: 'cash',
            deliveryTime: 'evening',
            notes: '',
            timestamp: now - hour * 5,
            driver: 'Susan W.',
            shopper: 'Susan W.',
        },
    ];
}

// ============ DASHBOARD (Updated for API) ============

function initDashboard() {
    updateDashboardStats();
    renderRecentOrders();
    renderActiveDeliveries();
    renderDriversStatus();
    renderActivityTimeline();
    updatePendingOrdersCount();
}

function updateDashboardStats() {
    const today = new Date().setHours(0, 0, 0, 0);

    const todayOrders = adminOrders.filter(
        o => new Date(o.createdAt).setHours(0, 0, 0, 0) === today
    );
    const pendingOrders = adminOrders.filter(o => ['placed', 'confirmed'].includes(o.status));
    const activeDrivers = drivers.filter(d => d.status === 'available' || d.status === 'busy');

    const todayRevenue = todayOrders.reduce(
        (sum, o) => sum + (o.pricing?.total || o.total || 0),
        0
    );

    setElementText('stat-orders-today', todayOrders.length);
    setElementText('stat-revenue-today', '$' + todayRevenue.toFixed(2));
    setElementText('stat-pending', pendingOrders.length);
    setElementText('stat-active-drivers', activeDrivers.length);
}

function renderRecentOrders() {
    const container = document.getElementById('recent-orders-list');
    if (!container) return;

    const recentOrders = adminOrders.slice(0, 5);

    if (recentOrders.length === 0) {
        container.innerHTML = '<p class="empty-message">No orders yet</p>';
        return;
    }

    container.innerHTML = recentOrders
        .map(
            order => `
        <div class="order-item" onclick="viewOrderDetail('${order._id}')">
            <div class="order-id">${order.orderId}</div>
            <div class="order-customer">
                <div class="order-customer-name">${order.customerInfo?.name || order.customer?.name || 'Unknown'}</div>
                <div class="order-customer-address">${truncateText(order.customerInfo?.address || order.customer?.address || '', 30)}</div>
            </div>
            <div class="order-amount">$${(order.pricing?.total || order.total || 0).toFixed(2)}</div>
            <div class="order-status ${order.status}">${formatStatus(order.status)}</div>
        </div>
    `
        )
        .join('');
}

function renderActiveDeliveries() {
    const container = document.getElementById('active-deliveries-list');
    const countBadge = document.getElementById('active-deliveries-count');
    if (!container) return;

    const activeDeliveries = adminOrders.filter(o =>
        ['in_progress', 'ready', 'out_for_delivery'].includes(o.status)
    );

    if (countBadge) countBadge.textContent = activeDeliveries.length;

    if (activeDeliveries.length === 0) {
        container.innerHTML = '<p class="empty-message">No active deliveries</p>';
        return;
    }

    container.innerHTML = activeDeliveries
        .map(
            order => `
        <div class="order-item" onclick="viewOrderDetail('${order._id}')">
            <div class="order-status ${order.status}">${formatStatus(order.status)}</div>
            <div class="order-customer">
                <div class="order-customer-name">${order.customerInfo?.name || order.customer?.name || 'Unknown'}</div>
                <div class="order-customer-address">Driver: ${order.delivery?.driverName || order.assignedDriver?.name || 'Unassigned'}</div>
            </div>
            <div class="order-amount">$${(order.pricing?.total || order.total || 0).toFixed(2)}</div>
        </div>
    `
        )
        .join('');
}

function renderDriversStatus() {
    const container = document.getElementById('drivers-status-grid');
    if (!container) return;

    if (drivers.length === 0) {
        container.innerHTML = '<p class="empty-message">No drivers available</p>';
        return;
    }

    container.innerHTML = drivers
        .map(driver => {
            const driverName = `${driver.firstName} ${driver.lastName}`;
            return `
            <div class="driver-status-card">
                <div class="driver-avatar">${getInitials(driverName)}</div>
                <div class="driver-info">
                    <div class="driver-name">${driverName}</div>
                    <div class="driver-status ${driver.status}">
                        <span class="status-dot"></span>
                        ${capitalizeFirst(driver.status)}
                    </div>
                </div>
            </div>
        `;
        })
        .join('');
}

function getInitials(name) {
    if (!name) return '??';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function renderActivityTimeline() {
    const container = document.getElementById('activity-timeline');
    if (!container) return;

    // Generate activity from orders
    const activities = adminOrders.slice(0, 6).map(order => ({
        time: formatTime(order.createdAt),
        title: `Order ${order.orderId}`,
        description: `${order.customerInfo?.name || order.customer?.name || 'Unknown'} - ${formatStatus(order.status)}`,
    }));

    if (activities.length === 0) {
        container.innerHTML = '<p class="empty-message">No activity today</p>';
        return;
    }

    container.innerHTML = activities
        .map(
            activity => `
        <div class="activity-item">
            <div class="activity-time">${activity.time}</div>
            <div class="activity-dot"></div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
        </div>
    `
        )
        .join('');
}

function refreshDashboard() {
    if (document.getElementById('recent-orders-list')) {
        loadAdminOrders();
        initDashboard();
    }
}

// ============ USER MENU ============

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    menu.classList.toggle('active');

    // Close when clicking outside
    if (menu.classList.contains('active')) {
        setTimeout(() => {
            document.addEventListener('click', closeUserMenuOnClickOutside);
        }, 0);
    }
}

function closeUserMenuOnClickOutside(e) {
    const menu = document.getElementById('user-menu');
    const userBtn = document.querySelector('.topbar-user');

    if (!menu.contains(e.target) && !userBtn.contains(e.target)) {
        menu.classList.remove('active');
        document.removeEventListener('click', closeUserMenuOnClickOutside);
    }
}

// ============ PROFILE & PASSWORD ============

function viewProfile() {
    const user = Auth.getCurrentUser();
    alert(`👤 Profile\n\nUsername: ${user.username}\nName: ${user.name}\nRole: ${user.role}`);
}

function changePassword() {
    const currentPassword = prompt('Enter current password:');
    if (!currentPassword) return;

    const newPassword = prompt('Enter new password (min 8 characters):');
    if (!newPassword || newPassword.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }

    const confirmPassword = prompt('Confirm new password:');
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // In production, send to backend
    alert(
        '✅ Password changed successfully!\n\n(Note: In demo mode, password is not actually changed)'
    );
    Auth.logActivity('password_change', 'Password changed');
}

// ============ ACTIVITY LOG VIEWER ============

function viewActivityLog() {
    const activities = Auth.getActivities(20);

    let html = `
        <div style="max-height: 400px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 10px; text-align: left;">Time</th>
                        <th style="padding: 10px; text-align: left;">User</th>
                        <th style="padding: 10px; text-align: left;">Activity</th>
                    </tr>
                </thead>
                <tbody>
    `;

    activities.forEach(activity => {
        const time = new Date(activity.timestamp).toLocaleString();
        html += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-size: 13px; color: #64748b;">${time}</td>
                <td style="padding: 10px; font-size: 13px;">${activity.user}</td>
                <td style="padding: 10px; font-size: 13px;">${activity.message}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'activity-log-modal';
    modal.innerHTML = `
        <div class="modal modal-large">
            <div class="modal-header">
                <h2>📋 Activity Log</h2>
                <button class="modal-close" onclick="closeModal('activity-log-modal')">×</button>
            </div>
            <div class="modal-body">
                ${activities.length > 0 ? html : '<p class="empty-message">No activity recorded yet.</p>'}
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="clearActivityLog()">Clear Log</button>
                <button class="btn btn-primary" onclick="closeModal('activity-log-modal')">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function clearActivityLog() {
    if (confirm('Are you sure you want to clear all activity history?')) {
        localStorage.removeItem('adminActivities');
        closeModal('activity-log-modal');
        showAdminToast('Activity log cleared', 'success');
    }
}

// ============ SESSION TIMEOUT WARNING ============

let sessionWarningShown = false;

function checkSessionTimeout() {
    // Check if user is still logged in
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Note: JWT tokens don't have client-side expiration tracking without decoding
    // This is a placeholder for future enhancement with proper session management
    // For now, the server will handle token expiration
}

function showSessionWarning(minutes) {
    const warning = document.createElement('div');
    warning.className = 'session-warning show';
    warning.id = 'session-warning';
    warning.innerHTML = `
        <span>⚠️ Your session will expire in ${minutes} minutes</span>
        <button onclick="extendSession()">Stay Logged In</button>
        <button onclick="adminLogout()" style="background: #64748b;">Logout</button>
    `;
    document.body.appendChild(warning);
}

function extendSession() {
    Auth.extendSession();
    sessionWarningShown = false;

    const warning = document.getElementById('session-warning');
    if (warning) warning.remove();

    showAdminToast('Session extended', 'success');
}

// Check session every minute
setInterval(checkSessionTimeout, 60000);

// ============ SECURE ACTIONS ============

function secureAction(action, requiredRole = 'admin') {
    if (!Auth.hasRole(requiredRole)) {
        showAdminToast('You do not have permission for this action', 'error');
        return false;
    }

    Auth.logActivity(action.name || 'action', action.description || 'Performed action');
    return true;
}

// ============ ORDERS PAGE ============

function initOrdersPage() {
    renderOrdersTable();
    updateOrderCounts();
    updatePendingOrdersCount();
    populateDriverSelect();
}

function renderOrdersTable() {
    const tbody = document.getElementById('orders-table-body');
    const emptyState = document.getElementById('orders-empty');
    if (!tbody) return;

    let filteredOrders = getFilteredOrders();

    if (filteredOrders.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = filteredOrders
        .map(order => {
            const orderId = order.orderId || order.id;
            const customerName =
                order.customerInfo?.name || order.customer?.name || order.name || 'Unknown';
            const customerPhone =
                order.customerInfo?.phone || order.customer?.phone || order.phone || '';
            const itemCount = order.items?.length || 0;
            const total = order.pricing?.total || order.total || 0;
            const driver =
                order.delivery?.driverName || order.assignedDriver?.name || order.driver || '—';
            const timestamp = order.createdAt || order.timestamp;
            const id = order._id || order.id;

            return `
            <tr>
                <td><strong>${orderId}</strong></td>
                <td>
                    <div>${customerName}</div>
                    <small style="color: #64748b;">${customerPhone}</small>
                </td>
                <td>${itemCount} items</td>
                <td><strong>$${total.toFixed(2)}</strong></td>
                <td><span class="order-status ${order.status}">${formatStatus(order.status)}</span></td>
                <td>${driver}</td>
                <td>${formatTime(timestamp)}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn view" onclick="viewOrderDetail('${id}')">View</button>
                        <button class="table-btn edit" onclick="quickUpdateStatus('${id}')">Update</button>
                    </div>
                </td>
            </tr>
        `;
        })
        .join('');
}

function getFilteredOrders() {
    let filtered = [...adminOrders];

    const statusFilter = document.getElementById('filter-status')?.value;
    const dateFilter = document.getElementById('filter-date')?.value;
    const searchFilter = document.getElementById('filter-search')?.value?.toLowerCase();

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Date filter
    if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));

        filtered = filtered.filter(o => {
            const orderDate = new Date(o.createdAt || o.timestamp);

            switch (dateFilter) {
                case 'today':
                    return orderDate >= today;
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    return orderDate >= yesterday && orderDate < today;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return orderDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return orderDate >= monthAgo;
                default:
                    return true;
            }
        });
    }

    // Search filter
    if (searchFilter) {
        filtered = filtered.filter(
            o =>
                (o.orderId || o.id || '').toLowerCase().includes(searchFilter) ||
                (o.customerInfo?.name || o.name || '').toLowerCase().includes(searchFilter) ||
                (o.customerInfo?.phone || o.phone || '').includes(searchFilter) ||
                (o.customerInfo?.address || o.address || '').toLowerCase().includes(searchFilter)
        );
    }

    // Sort by most recent
    filtered.sort((a, b) => {
        const aTime = new Date(a.createdAt || a.timestamp || 0).getTime();
        const bTime = new Date(b.createdAt || b.timestamp || 0).getTime();
        return bTime - aTime;
    });

    return filtered;
}

function filterOrders() {
    renderOrdersTable();
    updateOrderCounts();
}

function resetFilters() {
    const statusFilter = document.getElementById('filter-status');
    const dateFilter = document.getElementById('filter-date');
    const searchFilter = document.getElementById('filter-search');

    if (statusFilter) statusFilter.value = 'all';
    if (dateFilter) dateFilter.value = 'all'; // Changed from 'today' to 'all'
    if (searchFilter) searchFilter.value = '';

    filterOrders();
}

function updateOrderCounts() {
    const all = adminOrders.length;
    const newOrders = adminOrders.filter(o => o.status === 'placed').length;
    const inProgress = adminOrders.filter(o =>
        ['confirmed', 'shopping', 'delivering'].includes(o.status)
    ).length;
    const delivered = adminOrders.filter(o => o.status === 'delivered').length;

    setElementText('count-all', all);
    setElementText('count-new', newOrders);
    setElementText('count-progress', inProgress);
    setElementText('count-delivered', delivered);
}

function updatePendingOrdersCount() {
    const pending = adminOrders.filter(o => ['placed', 'confirmed'].includes(o.status)).length;
    document.querySelectorAll('#pending-orders-count').forEach(el => {
        el.textContent = pending;
        el.style.display = pending > 0 ? 'inline' : 'none';
    });
}

// ============ ORDER DETAIL MODAL ============

let adminCurrentOrderId = null;

function viewOrderDetail(orderId) {
    const order = adminOrders.find(o => o._id === orderId || o.id === orderId);
    if (!order) return;

    adminCurrentOrderId = order._id || orderId;

    // Populate modal
    setElementText('modal-order-id', order.orderId || order.id);
    setElementText(
        'detail-name',
        order.customerInfo?.name || order.customer?.name || order.name || '—'
    );
    setElementText(
        'detail-address',
        order.customerInfo?.address || order.customer?.address || order.address || '—'
    );
    setElementText(
        'detail-email',
        order.customerInfo?.email || order.customer?.email || order.email || '—'
    );
    setElementText('detail-time', formatDateTime(order.createdAt || order.timestamp));
    setElementText(
        'detail-delivery-time',
        capitalizeFirst(order.delivery?.timePreference || order.deliveryTime || 'ASAP')
    );
    setElementText(
        'detail-payment',
        capitalizeFirst(order.payment?.method || order.paymentMethod || order.payment || 'cash')
    );
    setElementText('detail-notes', order.notes || '—');

    const phoneLink = document.getElementById('detail-phone-link');
    if (phoneLink) {
        const phone = order.customerInfo?.phone || order.customer?.phone || order.phone || '';
        phoneLink.textContent = phone;
        phoneLink.href = 'tel:' + phone;
    }

    // Populate items
    const itemsContainer = document.getElementById('detail-items');
    if (itemsContainer) {
        const items = order.items || [];
        itemsContainer.innerHTML = items
            .map(item => {
                const name = item.name || 'Unknown Item';
                const emoji = item.emoji || '📦';
                const price = item.price || 0;
                const quantity = item.quantity || 1;

                return `
                <tr>
                    <td>${emoji} ${name}</td>
                    <td>$${price.toFixed(2)}</td>
                    <td>${quantity}</td>
                    <td>$${(price * quantity).toFixed(2)}</td>
                </tr>
            `;
            })
            .join('');
    }

    const subtotal = order.pricing?.subtotal || order.subtotal || order.pricing?.total - 6.99 || 0;
    const total = order.pricing?.total || order.total || 0;
    setElementText('detail-subtotal', '$' + subtotal.toFixed(2));
    setElementText('detail-total', '$' + total.toFixed(2));

    // Set current status in dropdown
    const statusSelect = document.getElementById('update-status');
    if (statusSelect) statusSelect.value = order.status;

    // Set current driver
    const driverSelect = document.getElementById('assign-driver');
    if (driverSelect && order.delivery?.driverId) {
        driverSelect.value = order.delivery.driverId;
    }

    openModal('order-detail-modal');
}

async function updateOrderStatus() {
    if (!adminCurrentOrderId) return;

    const order = adminOrders.find(
        o => o._id === adminCurrentOrderId || o.id === adminCurrentOrderId
    );
    if (!order) return;

    const newStatus = document.getElementById('update-status').value;
    const driverSelect = document.getElementById('assign-driver');
    const driverId = driverSelect?.value;

    try {
        // Update order status
        const statusResponse = await api.updateOrderStatus(order._id, newStatus);

        if (!statusResponse.success) {
            throw new Error(statusResponse.message || 'Failed to update status');
        }

        // If driver is selected and different from current, update that separately
        if (
            driverId &&
            driverId !== '' &&
            driverId !== 'none' &&
            driverId !== order.delivery?.driverId
        ) {
            try {
                const driverResponse = await api.assignDriver(order._id, driverId);
                if (!driverResponse.success) {
                    // console.warn('Failed to assign driver:', driverResponse.message);
                    showAdminToast('Status updated but driver assignment failed', 'warning');
                }
            } catch (driverError) {
                console.error('Error assigning driver:', driverError);
                // Don't fail the whole operation if just driver assignment fails
            }
        }

        showAdminToast('Order updated successfully!', 'success');
        closeModal('order-detail-modal');

        // Refresh the page content
        await loadInitialData();
        refreshCurrentPage();
        updatePendingOrdersCount();
    } catch (error) {
        console.error('Error updating order:', error);
        showAdminToast('Failed to update order: ' + (error.message || 'Unknown error'), 'error');
    }
}

function quickUpdateStatus(orderId) {
    viewOrderDetail(orderId);
}

async function cancelOrder() {
    if (!adminCurrentOrderId) return;

    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
        const response = await api.updateOrderStatus(adminCurrentOrderId, 'cancelled');

        if (response.success) {
            showAdminToast('Order cancelled', 'warning');
            closeModal('order-detail-modal');

            // Refresh data and page
            await loadInitialData();
            refreshCurrentPage();
            updatePendingOrdersCount();
        } else {
            throw new Error(response.message || 'Failed to cancel order');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        showAdminToast('Failed to cancel order: ' + (error.message || 'Unknown error'), 'error');
    }
}

function printOrder() {
    window.print();
}

function callCustomer() {
    const order = adminOrders.find(o => o._id === adminCurrentOrderId);
    if (order) {
        const phone = order.customerInfo?.phone || order.phone;
        if (phone) {
            window.location.href = 'tel:' + phone;
        }
    }
}

function populateDriverSelect() {
    const selects = document.querySelectorAll('#assign-driver');
    const activeDrivers = drivers.filter(d => d.status !== 'inactive');

    selects.forEach(select => {
        select.innerHTML =
            '<option value="">Assign Driver...</option>' +
            activeDrivers
                .map(
                    d => `
                <option value="${d.id}">${d.firstName} ${d.lastName} (${d.status})</option>
            `
                )
                .join('');
    });
}

// ============ PRODUCTS PAGE ============

function initProductsPage() {
    // console.log('Initializing products page, products count:', products.length);
    renderProductsGrid();
    updateProductCounts();
}

function renderProductsGrid() {
    const container = document.getElementById('products-grid');
    if (!container) {
        console.error('Products grid container not found!');
        return;
    }

    let filteredProducts = getFilteredProducts();
    // console.log('Rendering products grid, filtered products:', filteredProducts.length);

    if (filteredProducts.length === 0) {
        container.innerHTML =
            '<div style="padding: 40px; text-align: center; color: #666;">No products found</div>';
        return;
    }

    container.innerHTML = filteredProducts
        .map(
            product => `
        <div class="product-admin-card">
            <div class="product-admin-image">${product.emoji}</div>
            <div class="product-admin-content">
                <div class="product-admin-name">${product.name}</div>
                <div class="product-admin-category">${capitalizeFirst(product.category)}</div>
                <div class="product-admin-price">$${product.price.toFixed(2)}</div>
                <div class="product-admin-status ${product.status || 'active'}">${formatProductStatus(product.status || 'active')}</div>
                <div class="product-admin-actions">
                    <button class="btn btn-outline btn-sm" onclick="editProduct('${product._id}')">✏️ Edit</button>
                    <button class="btn btn-outline btn-sm" onclick="toggleProductStatus('${product._id}')">👁️</button>
                </div>
            </div>
        </div>
    `
        )
        .join('');
}

function getFilteredProducts() {
    let filtered = [...products];

    const categoryFilter = document.getElementById('filter-category')?.value;
    const statusFilter = document.getElementById('filter-product-status')?.value;
    const searchFilter = document.getElementById('filter-product-search')?.value?.toLowerCase();

    if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(p => (p.status || 'active') === statusFilter);
    }

    if (searchFilter) {
        filtered = filtered.filter(
            p =>
                p.name.toLowerCase().includes(searchFilter) ||
                p.category.toLowerCase().includes(searchFilter)
        );
    }

    return filtered;
}

function filterProducts() {
    renderProductsGrid();
}

function updateProductCounts() {
    setElementText('count-total-products', products.length);
    setElementText(
        'count-active-products',
        products.filter(p => (p.status || 'active') === 'active').length
    );
    setElementText('count-out-of-stock', products.filter(p => p.status === 'out-of-stock').length);
}

function openAddProductModal() {
    // console.log('Opening add product modal');
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    openModal('product-modal');
}

function editProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-id').value = product._id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-emoji').value = product.emoji;
    document.getElementById('product-status').value = product.status || 'active';

    openModal('product-modal');
}

async function saveProduct() {
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;
    const emoji = document.getElementById('product-emoji').value || '📦';
    const status = document.getElementById('product-status').value;

    if (!name || !price || !category) {
        showAdminToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        const productData = { name, price, category, emoji, status };

        if (id) {
            // Edit existing
            const response = await api.updateProduct(id, productData);
            if (response.success) {
                const index = products.findIndex(p => p._id === id);
                if (index !== -1) {
                    products[index] = response.product;
                }
            } else {
                throw new Error(response.message || 'Failed to update product');
            }
        } else {
            // Add new
            const response = await api.createProduct(productData);
            if (response.success) {
                products.push(response.product);
            } else {
                throw new Error(response.message || 'Failed to create product');
            }
        }

        showAdminToast('Product saved successfully!', 'success');
        closeModal('product-modal');
        renderProductsGrid();
        updateProductCounts();
    } catch (error) {
        console.error('Error saving product:', error);
        showAdminToast('Failed to save product: ' + error.message, 'error');
    }
}

async function toggleProductStatus(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        showAdminToast('Product not found', 'error');
        return;
    }

    try {
        const currentStatus = product.status || 'active';
        const newStatus = currentStatus === 'active' ? 'hidden' : 'active';

        // console.log('Toggling product status:', productId, 'from', currentStatus, 'to', newStatus);

        // Send full product data to avoid validation errors
        const updateData = {
            name: product.name,
            price: product.price,
            category: product.category,
            emoji: product.emoji,
            status: newStatus,
        };

        const response = await api.updateProduct(productId, updateData);

        // console.log('Toggle response:', response);

        if (response.success) {
            product.status = newStatus;
            showAdminToast(`Product ${newStatus === 'active' ? 'shown' : 'hidden'}`, 'success');
            renderProductsGrid();
            updateProductCounts();
        } else {
            throw new Error(response.message || 'Failed to update product status');
        }
    } catch (error) {
        console.error('Error toggling product status:', error);
        showAdminToast('Failed to update product status: ' + error.message, 'error');
    }
}

function formatProductStatus(status) {
    const statusMap = {
        active: '✅ Active',
        'out-of-stock': '❌ Out of Stock',
        hidden: '👁️ Hidden',
    };
    return statusMap[status] || status;
}

// ============ DRIVERS PAGE ============

async function loadDrivers() {
    try {
        const response = await api.getDrivers({ showLoading: false });
        if (response.success) {
            drivers = response.drivers || [];
            renderDriversGrid();
            updateDriverStats();
        }
    } catch (error) {
        console.error('Error loading drivers:', error);
    }
}

function initDriversPage() {
    renderDriversGrid();
    updateDriverStats();
}

function renderDriversGrid() {
    const container = document.getElementById('drivers-grid');
    if (!container) return;

    if (drivers.length === 0) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <div class="empty-icon">🚗</div>
                <h3>No Drivers Yet</h3>
                <p>Add drivers to start managing deliveries.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = drivers
        .map(driver => {
            const driverName = `${driver.firstName} ${driver.lastName}`;
            const initials = getInitials(driverName);
            const totalDeliveries = driver.totalDeliveries || 0;
            const rating = driver.rating || 5.0;
            const vehicleType = driver.vehicle?.type || 'car';
            const vehicleDesc = driver.vehicle?.description || capitalizeFirst(vehicleType);

            return `
            <div class="driver-card">
                <div class="driver-card-header">
                    <div class="driver-avatar-large">${initials}</div>
                    <div class="driver-card-info">
                        <h3>${driverName}</h3>
                        <span class="driver-status-badge ${driver.status}">${capitalizeFirst(driver.status)}</span>
                    </div>
                </div>
                
                <div class="driver-card-stats">
                    <div class="driver-stat">
                        <div class="driver-stat-value">${totalDeliveries}</div>
                        <div class="driver-stat-label">Deliveries</div>
                    </div>
                    <div class="driver-stat">
                        <div class="driver-stat-value">${rating.toFixed(1)}★</div>
                        <div class="driver-stat-label">Rating</div>
                    </div>
                    <div class="driver-stat">
                        <div class="driver-stat-value">${vehicleDesc}</div>
                        <div class="driver-stat-label">Vehicle</div>
                    </div>
                </div>
                
                <div class="driver-card-details">
                    <div class="driver-detail-row">
                        <span>Phone</span>
                        <span>${driver.phone}</span>
                    </div>
                    <div class="driver-detail-row">
                        <span>Email</span>
                        <span>${driver.email || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="driver-card-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewDriverDetail('${driver._id}')">View</button>
                    <button class="btn btn-outline btn-sm" onclick="editDriver('${driver._id}')">Edit</button>
                    <button class="btn btn-outline btn-sm" onclick="callDriver('${driver.phone}')">📞</button>
                </div>
            </div>
        `;
        })
        .join('');
}

function updateDriverStats() {
    const total = drivers.length;
    const online = drivers.filter(d => d.status === 'available').length;
    const busy = drivers.filter(d => d.status === 'busy').length;
    const offline = drivers.filter(d => d.status === 'offline').length;

    setElementText('stat-total-drivers', total);
    setElementText('stat-online-drivers', online);
    setElementText('stat-busy-drivers', busy);
    setElementText('stat-offline-drivers', offline);
}

function openAddDriverModal() {
    document.getElementById('driver-modal-title').textContent = 'Add New Driver';
    document.getElementById('driver-form').reset();
    document.getElementById('driver-id').value = '';
    openModal('driver-modal');
}

function editDriver(driverId) {
    const driver = drivers.find(d => d._id === driverId);
    if (!driver) return;

    document.getElementById('driver-modal-title').textContent = 'Edit Driver';
    document.getElementById('driver-id').value = driver._id;
    document.getElementById('driver-first-name').value = driver.firstName;
    document.getElementById('driver-last-name').value = driver.lastName;
    document.getElementById('driver-phone').value = driver.phone;
    document.getElementById('driver-email').value = driver.email || '';
    document.getElementById('driver-vehicle-type').value = driver.vehicle?.type || 'car';
    document.getElementById('driver-vehicle').value = driver.vehicle?.description || '';
    document.getElementById('driver-license').value = driver.vehicle?.licensePlate || '';
    document.getElementById('driver-status').value = driver.status;

    openModal('driver-modal');
}

async function saveDriver() {
    const id = document.getElementById('driver-id').value;
    const firstName = document.getElementById('driver-first-name').value.trim();
    const lastName = document.getElementById('driver-last-name').value.trim();
    const phone = document.getElementById('driver-phone').value.trim();
    const email = document.getElementById('driver-email').value.trim();
    const vehicleType = document.getElementById('driver-vehicle-type').value;
    const vehicleDescription = document.getElementById('driver-vehicle').value.trim();
    const licensePlate = document.getElementById('driver-license').value.trim();
    const status = document.getElementById('driver-status').value;

    if (!firstName || !lastName || !phone) {
        showAdminToast('Please fill in all required fields', 'error');
        return;
    }

    const driverData = {
        firstName,
        lastName,
        phone,
        email,
        vehicle: {
            type: vehicleType,
            description: vehicleDescription,
            licensePlate,
        },
        status,
    };

    try {
        if (id) {
            // Edit existing
            await api.updateDriver(id, driverData);
            showAdminToast('Driver updated successfully!', 'success');
        } else {
            // Add new
            await api.createDriver(driverData);
            showAdminToast('Driver created successfully!', 'success');
        }

        closeModal('driver-modal');
        await loadDrivers();
    } catch (error) {
        console.error('Error saving driver:', error);
        showAdminToast('Failed to save driver: ' + (error.message || 'Unknown error'), 'error');
    }
}

function viewDriverDetail(driverId) {
    const driver = drivers.find(d => d._id === driverId);
    if (!driver) return;

    // Set driver ID for deactivate function
    const driverIdField = document.getElementById('driver-id');
    if (driverIdField) {
        driverIdField.value = driver._id;
    }

    document.getElementById('driver-detail-avatar').textContent =
        `${driver.firstName[0]}${driver.lastName[0]}`;
    document.getElementById('driver-detail-name').textContent =
        `${driver.firstName} ${driver.lastName}`;

    const statusBadge = document.getElementById('driver-detail-status-badge');
    statusBadge.textContent = capitalizeFirst(driver.status);
    statusBadge.className = `driver-status-badge ${driver.status}`;

    const vehicleDesc =
        driver.vehicle?.description || capitalizeFirst(driver.vehicle?.type || 'car');

    setElementText('driver-total-deliveries', driver.totalDeliveries);
    setElementText('driver-rating', driver.rating + '★');
    setElementText('driver-earnings', '$' + driver.earnings);
    setElementText('driver-detail-phone', driver.phone);
    setElementText('driver-detail-email', driver.email || '—');
    setElementText('driver-detail-vehicle', vehicleDesc);

    // Recent deliveries
    const recentDeliveries = document.getElementById('driver-recent-deliveries');
    const driverName = `${driver.firstName} ${driver.lastName[0]}.`;
    const driverOrders = adminOrders.filter(o => o.driver === driverName).slice(0, 3);

    if (recentDeliveries) {
        if (driverOrders.length === 0) {
            recentDeliveries.innerHTML = '<p class="empty-message">No recent deliveries</p>';
        } else {
            recentDeliveries.innerHTML = driverOrders
                .map(
                    order => `
                <div class="order-item" style="cursor: default;">
                    <div class="order-id">${order.id}</div>
                    <div class="order-customer">
                        <div class="order-customer-name">${order.name}</div>
                        <div class="order-customer-address">${formatTime(order.timestamp)}</div>
                    </div>
                    <div class="order-amount">$${order.total}</div>
                    <div class="order-status ${order.status}">${formatStatus(order.status)}</div>
                </div>
            `
                )
                .join('');
        }
    }

    openModal('driver-detail-modal');
}

function callDriver(phone) {
    if (phone) {
        window.location.href = 'tel:' + phone;
    }
}

async function deactivateDriver() {
    const driverId = document.getElementById('driver-id')?.value;
    if (!driverId) {
        showAdminToast('No driver selected', 'error');
        return;
    }

    if (!confirm('Are you sure you want to deactivate this driver?')) return;

    try {
        await api.updateDriverStatus(driverId, 'inactive');
        showAdminToast('Driver deactivated', 'warning');
        closeModal('driver-detail-modal');
        await loadDrivers();
    } catch (error) {
        console.error('Error deactivating driver:', error);
        showAdminToast('Failed to deactivate driver', 'error');
    }
}

// ============ CUSTOMERS PAGE ============

function initCustomersPage() {
    // Reset search and sort inputs
    const searchInput = document.getElementById('customer-search');
    const sortSelect = document.getElementById('customer-sort');
    
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'recent';
    
    updateCustomerStats();
    renderCustomersTable();
}

function updateCustomerStats() {
    const totalCustomers = customers.length;

    // Count repeat customers (those with more than 1 order)
    const repeatCustomers = customers.filter(c => (c.totalOrders || 0) > 1).length;

    // Calculate average order value
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Find top customer by total spent
    const topCustomer =
        customers.length > 0
            ? customers.reduce(
                  (max, c) => ((c.totalSpent || 0) > (max.totalSpent || 0) ? c : max),
                  customers[0]
              )
            : null;
    const topCustomerName = topCustomer ? (topCustomer.name || 'Unknown').split(' ')[0] : '—';

    // Update DOM
    setElementText('stat-total-customers', totalCustomers);
    setElementText('stat-repeat-customers', repeatCustomers);
    setElementText('stat-avg-order-value', '$' + avgOrderValue.toFixed(2));
    setElementText('stat-top-customer', topCustomerName);
}

function renderCustomersTable() {
    const container = document.getElementById('customers-grid');
    if (!container) {
        console.error('customers-grid container not found!');
        return;
    }

    // Get search and sort values
    const searchTerm = document.getElementById('customer-search')?.value.toLowerCase() || '';
    const sortBy = document.getElementById('customer-sort')?.value || 'recent';

    // Filter customers based on search
    let filteredCustomers = customers.filter(customer => {
        if (!searchTerm) return true;
        
        const name = (customer.name || '').toLowerCase();
        const phone = (customer.phone || '').toLowerCase();
        const email = (customer.email || '').toLowerCase();
        const address = (customer.address || customer.addresses?.[0]?.street || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               phone.includes(searchTerm) || 
               email.includes(searchTerm) || 
               address.includes(searchTerm);
    });

    // Sort customers
    filteredCustomers.sort((a, b) => {
        switch (sortBy) {
            case 'orders':
                return (b.totalOrders || 0) - (a.totalOrders || 0);
            case 'spent':
                return (b.totalSpent || 0) - (a.totalSpent || 0);
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            case 'recent':
            default:
                // Find last order date for each customer
                const getLastOrderDate = (customer) => {
                    const orders = adminOrders.filter(o => 
                        o.customerInfo?.phone === customer.phone ||
                        o.customerId?._id === customer._id ||
                        o.customerId === customer._id
                    );
                    const lastOrder = orders.sort((x, y) => 
                        new Date(y.createdAt) - new Date(x.createdAt)
                    )[0];
                    return lastOrder ? new Date(lastOrder.createdAt) : new Date(customer.createdAt || 0);
                };
                return getLastOrderDate(b) - getLastOrderDate(a);
        }
    });

    if (filteredCustomers.length === 0) {
        container.innerHTML = searchTerm ? `
            <div class="admin-empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No Customers Found</h3>
                <p>No customers match "${searchTerm}"</p>
            </div>
        ` : `
            <div class="admin-empty-state">
                <div class="empty-icon">👥</div>
                <h3>No Customers Yet</h3>
                <p>Customers will appear here after their first order.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredCustomers
        .map(customer => {
            try {
                const orderCount = customer.totalOrders || 0;
                const totalSpent = customer.totalSpent || 0;
                const defaultAddress =
                    customer.addresses?.find(a => a.isDefault) || customer.addresses?.[0];
                const addressText = defaultAddress?.street || customer.address || '—';

                // Find last order for this customer
                const customerOrders = adminOrders
                    .filter(
                        o =>
                            o.customerInfo?.phone === customer.phone ||
                            o.customerId?._id === customer._id ||
                            o.customerId === customer._id
                    )
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                const lastOrderDate = customerOrders[0]?.createdAt || customer.createdAt;

                return `
                <div class="customer-card">
                    <div class="customer-header">
                        <div class="customer-avatar">${getInitials(customer.name || 'N/A')}</div>
                        <div class="customer-info">
                            <h3>${customer.name || 'Unknown'}</h3>
                            <p>${customer.phone || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div class="customer-stats">
                        <div class="customer-stat">
                            <div class="customer-stat-value">${orderCount}</div>
                            <div class="customer-stat-label">Orders</div>
                        </div>
                        <div class="customer-stat">
                            <div class="customer-stat-value">$${totalSpent.toFixed(2)}</div>
                            <div class="customer-stat-label">Total Spent</div>
                        </div>
                    </div>
                    
                    <div class="driver-card-details">
                        <div class="driver-detail-row">
                            <span>Email</span>
                            <span>${customer.email || '—'}</span>
                        </div>
                        <div class="driver-detail-row">
                            <span>Address</span>
                            <span>${truncateText(addressText, 25)}</span>
                        </div>
                        <div class="driver-detail-row">
                            <span>Last Order</span>
                            <span>${formatDate(lastOrderDate)}</span>
                        </div>
                    </div>
                    
                    <div class="driver-card-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewCustomerOrders('${customer.phone}')">View Orders</button>
                        <button class="btn btn-outline btn-sm" onclick="callCustomerDirect('${customer.phone}')">📞 Call</button>
                    </div>
                </div>
            `;
            } catch (error) {
                console.error('Error rendering customer:', customer, error);
                return '';
            }
        })
        .join('');
}

function filterCustomers() {
    renderCustomersTable();
}

function exportCustomers() {
    // Use API export endpoint
    api.exportCustomers();
    showAdminToast('Exporting customers...', 'success');
}

function viewCustomerOrders(phone) {
    // Find all orders for this customer
    const customerOrders = adminOrders.filter(order => 
        order.customerInfo?.phone === phone ||
        order.customer?.phone === phone ||
        order.phone === phone
    );
    
    if (customerOrders.length === 0) {
        showAdminToast('No orders found for this customer', 'info');
        return;
    }
    
    // Create modal content
    const customer = customers.find(c => c.phone === phone);
    const customerName = customer?.name || customerOrders[0]?.customerInfo?.name || 'Customer';
    
    const modalHTML = `
        <div class="modal-overlay active" id="customer-orders-modal" onclick="if(event.target === this) closeCustomerOrdersModal()">
            <div class="modal modal-large" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>📦 Orders for ${customerName}</h2>
                    <button class="modal-close" onclick="closeCustomerOrdersModal()">×</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px; color: #666;">Phone: ${phone}</p>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customerOrders.map(order => `
                                <tr>
                                    <td><strong>${order.orderId || order._id}</strong></td>
                                    <td>${formatDateTime(order.createdAt || order.timestamp)}</td>
                                    <td>${(order.items || []).length} items</td>
                                    <td><strong>$${(order.pricing?.total || order.total || 0).toFixed(2)}</strong></td>
                                    <td><span class="order-status ${order.status}">${formatStatus(order.status)}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline" onclick="viewOrderReceipt('${order._id || order.id}')">📄 Receipt</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('customer-orders-modal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function closeCustomerOrdersModal() {
    const modal = document.getElementById('customer-orders-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

function viewOrderReceipt(orderId) {
    // Open receipt in new tab
    window.open(`order-receipt.html?id=${orderId}`, '_blank');
}

function callCustomerDirect(phone) {
    window.location.href = 'tel:' + phone;
}

// ============ REPORTS PAGE ============

function initReportsPage() {
    renderReportsSummary();
    renderSalesChart();
    renderTopProducts();
    renderDriverPerformance();
    renderOrderStatusBreakdown();
    renderPaymentMethods();
    renderPeakHours();
}

function renderReportsSummary() {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const monthOrders = adminOrders.filter(o => {
        const d = new Date(o.createdAt || o.timestamp);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const monthRevenue = monthOrders.reduce(
        (sum, o) => sum + parseFloat(o.pricing?.total || o.total || 0),
        0
    );
    const avgOrderValue = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0;
    const deliveredOrders = monthOrders.filter(o => o.status === 'delivered').length;
    const deliveryRate = monthOrders.length > 0 ? (deliveredOrders / monthOrders.length) * 100 : 0;

    setElementText('report-month-orders', monthOrders.length);
    setElementText('report-month-revenue', '$' + monthRevenue.toFixed(2));
    setElementText('report-avg-order', '$' + avgOrderValue.toFixed(2));
    setElementText('report-delivery-rate', deliveryRate.toFixed(1) + '%');
}

function renderSalesChart() {
    const container = document.getElementById('sales-chart');
    if (!container) return;

    // Simple text-based chart (in production, use Chart.js)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayOrders = adminOrders.filter(o => {
            const orderDate = new Date(o.createdAt || o.timestamp);
            return orderDate >= date && orderDate < nextDate;
        });

        const dayRevenue = dayOrders.reduce(
            (sum, o) => sum + parseFloat(o.pricing?.total || o.total || 0),
            0
        );

        last7Days.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            orders: dayOrders.length,
            revenue: dayRevenue,
        });
    }

    const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1);

    container.innerHTML = `
        <div class="simple-chart">
            ${last7Days
                .map(
                    day => `
                <div class="chart-bar-container">
                    <div class="chart-bar" style="height: ${(day.revenue / maxRevenue) * 150}px;">
                        <span class="chart-value">$${day.revenue.toFixed(0)}</span>
                    </div>
                    <div class="chart-label">${day.date}</div>
                </div>
            `
                )
                .join('')}
        </div>
    `;
}

function renderTopProducts() {
    const container = document.getElementById('top-products');
    if (!container) return;

    // Count product sales
    const productCounts = {};

    adminOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const itemName = item.name || 'Unknown';
                if (!productCounts[itemName]) {
                    productCounts[itemName] = {
                        name: itemName,
                        emoji: item.emoji || '📦',
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productCounts[itemName].quantity += item.quantity || 0;
                productCounts[itemName].revenue += (item.price || 0) * (item.quantity || 0);
            });
        }
    });

    const topProducts = Object.values(productCounts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    if (topProducts.length === 0) {
        container.innerHTML = '<p class="empty-message">No sales data yet</p>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${topProducts
                    .map(
                        product => `
                    <tr>
                        <td>${product.emoji} ${product.name}</td>
                        <td>${product.quantity}</td>
                        <td>$${product.revenue.toFixed(2)}</td>
                    </tr>
                `
                    )
                    .join('')}
            </tbody>
        </table>
    `;
}

function renderDriverPerformance() {
    const container = document.getElementById('driver-performance');
    if (!container) return;

    const driverStats = drivers
        .map(driver => {
            const driverFullName = `${driver.firstName} ${driver.lastName}`;
            const driverShortName = `${driver.firstName} ${driver.lastName[0]}.`;
            // Match against both full name and short name in delivery.driverName
            const driverOrders = adminOrders.filter(
                o =>
                    o.delivery?.driverName === driverFullName ||
                    o.delivery?.driverName === driverShortName ||
                    o.driver === driverFullName ||
                    o.driver === driverShortName
            );
            const deliveredOrders = driverOrders.filter(o => o.status === 'delivered');

            return {
                name: driverFullName,
                deliveries: driver.totalDeliveries || deliveredOrders.length,
                rating: driver.rating || 5.0,
                earnings: driver.earnings || deliveredOrders.length * 4, // $4 per delivery
            };
        })
        .sort((a, b) => b.deliveries - a.deliveries);

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Driver</th>
                    <th>Deliveries</th>
                    <th>Rating</th>
                    <th>Earnings</th>
                </tr>
            </thead>
            <tbody>
                ${driverStats
                    .map(
                        driver => `
                    <tr>
                        <td>${driver.name}</td>
                        <td>${driver.deliveries}</td>
                        <td>${driver.rating}★</td>
                        <td>$${driver.earnings.toFixed(2)}</td>
                    </tr>
                `
                    )
                    .join('')}
            </tbody>
        </table>
    `;
}

function renderOrderStatusBreakdown() {
    const container = document.getElementById('order-status-breakdown');
    if (!container) return;

    const statusCounts = {
        placed: 0,
        confirmed: 0,
        shopping: 0,
        delivering: 0,
        delivered: 0,
        cancelled: 0,
    };

    adminOrders.forEach(order => {
        if (statusCounts.hasOwnProperty(order.status)) {
            statusCounts[order.status]++;
        }
    });

    const total = adminOrders.length || 1;

    container.innerHTML = `
        <div style="padding: 20px;">
            ${Object.entries(statusCounts)
                .map(
                    ([status, count]) => `
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>${formatStatus(status)}</span>
                        <span>${count} (${((count / total) * 100).toFixed(0)}%)</span>
                    </div>
                    <div style="background: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="background: ${getReportStatusColor(status)}; height: 100%; width: ${(count / total) * 100}%;"></div>
                    </div>
                </div>
            `
                )
                .join('')}
        </div>
    `;
}

function renderPaymentMethods() {
    const container = document.getElementById('payment-methods');
    if (!container) return;

    const paymentCounts = { cash: 0, card: 0, check: 0 };

    adminOrders.forEach(order => {
        const paymentMethod = order.payment?.method || order.paymentMethod || 'cash';
        if (paymentCounts.hasOwnProperty(paymentMethod)) {
            paymentCounts[paymentMethod]++;
        }
    });

    const total = adminOrders.length || 1;

    container.innerHTML = `
        <div style="padding: 20px; display: flex; justify-content: space-around; text-align: center;">
            <div>
                <div style="font-size: 40px;">💵</div>
                <div style="font-size: 24px; font-weight: 700;">${paymentCounts.cash}</div>
                <div style="color: #64748b;">Cash</div>
                <div style="font-size: 14px; color: #64748b;">${((paymentCounts.cash / total) * 100).toFixed(0)}%</div>
            </div>
            <div>
                <div style="font-size: 40px;">💳</div>
                <div style="font-size: 24px; font-weight: 700;">${paymentCounts.card}</div>
                <div style="color: #64748b;">Card</div>
                <div style="font-size: 14px; color: #64748b;">${((paymentCounts.card / total) * 100).toFixed(0)}%</div>
            </div>
            <div>
                <div style="font-size: 40px;">📝</div>
                <div style="font-size: 24px; font-weight: 700;">${paymentCounts.check}</div>
                <div style="color: #64748b;">Check</div>
                <div style="font-size: 14px; color: #64748b;">${((paymentCounts.check / total) * 100).toFixed(0)}%</div>
            </div>
        </div>
    `;
}

function renderPeakHours() {
    const container = document.getElementById('peak-hours');
    if (!container) return;

    const hourCounts = {};
    for (let i = 8; i <= 19; i++) {
        hourCounts[i] = 0;
    }

    adminOrders.forEach(order => {
        const orderDate = order.createdAt || order.timestamp;
        if (!orderDate) return;
        const hour = new Date(orderDate).getHours();
        if (hourCounts.hasOwnProperty(hour)) {
            hourCounts[hour]++;
        }
    });

    const maxCount = Math.max(...Object.values(hourCounts), 1);

    container.innerHTML = `
        <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 150px; padding: 20px; gap: 5px;">
            ${Object.entries(hourCounts)
                .map(
                    ([hour, count]) => `
                <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                    <div style="
                        width: 100%;
                        max-width: 30px;
                        height: ${(count / maxCount) * 100}px;
                        background: ${count === maxCount ? '#f59e0b' : '#3b82f6'};
                        border-radius: 4px 4px 0 0;
                        min-height: 5px;
                    "></div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 5px;">${formatReportHour(hour)}</div>
                </div>
            `
                )
                .join('')}
        </div>
    `;
}

function getReportStatusColor(status) {
    const colors = {
        placed: '#f59e0b',
        confirmed: '#3b82f6',
        shopping: '#8b5cf6',
        delivering: '#ec4899',
        delivered: '#16a34a',
        cancelled: '#dc2626',
    };
    return colors[status] || '#64748b';
}

function formatReportHour(hour) {
    const h = parseInt(hour);
    if (h === 12) return '12p';
    if (h > 12) return h - 12 + 'p';
    return h + 'a';
}

// ============ REPORT DATA EXPORT ============

function updateReportsPeriod() {
    // Get selected period
    const period = document.getElementById('report-period')?.value || 'month';

    // Filter orders based on period
    const filteredOrders = getOrdersByPeriod(period);

    // Update all report sections with filtered data
    // For now, just refresh the page (full implementation would filter all charts)
    initReportsPage();
}

function getOrdersByPeriod(period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return adminOrders.filter(order => {
        const orderDate = new Date(order.createdAt || order.timestamp);
        return orderDate >= startDate && orderDate <= now;
    });
}

function exportReportData() {
    const period = document.getElementById('report-period')?.value || 'month';
    const filteredOrders = getOrdersByPeriod(period);

    if (filteredOrders.length === 0) {
        showAdminToast('No data to export for selected period', 'warning');
        return;
    }

    // Prepare CSV data
    const csvData = generateReportCSV(filteredOrders, period);

    // Create download link
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
        'download',
        `orders-report-${period}-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAdminToast(`Exported ${filteredOrders.length} orders successfully!`, 'success');
}

// Export PDF Report
function exportReportPDF() {
    const period = document.getElementById('report-period').value;
    const filteredOrders = getOrdersByPeriod(period);

    if (!filteredOrders || filteredOrders.length === 0) {
        showAdminToast('No orders to export', 'error');
        return;
    }

    showAdminToast('Generating PDF report...', 'info');

    // Call backend to generate PDF
    const periodLabels = {
        week: 'Last 7 Days',
        month: 'This Month',
        quarter: 'This Quarter',
        year: 'This Year',
    };

    // Use api.baseURL to get the correct API endpoint
    const apiBaseURL = api.baseURL.replace('/api', '');

    fetch(`${apiBaseURL}/api/reports/pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
            orders: filteredOrders,
            period: periodLabels[period] || 'Custom Period',
        }),
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to generate PDF');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            showAdminToast(`PDF report generated successfully!`, 'success');
        })
        .catch(error => {
            console.error('PDF export error:', error);
            showAdminToast('Failed to generate PDF report', 'error');
        });
}

function generateReportCSV(orders, period) {
    // CSV Headers
    const headers = [
        'Order ID',
        'Date',
        'Time',
        'Customer Name',
        'Phone',
        'Email',
        'Status',
        'Payment Method',
        'Items',
        'Subtotal',
        'Delivery Fee',
        'Tip',
        'Tax',
        'Discount',
        'Total',
        'Special Instructions',
    ];

    // Build CSV rows
    const rows = orders.map(order => {
        const orderDate = new Date(order.createdAt || order.timestamp);
        const items = (order.items || [])
            .map(item => `${item.quantity}x ${item.name} ($${item.price})`)
            .join('; ');

        return [
            order.orderId || order._id,
            orderDate.toLocaleDateString(),
            orderDate.toLocaleTimeString(),
            order.customerInfo?.name || order.customer?.name || '',
            order.customerInfo?.phone || order.customer?.phone || '',
            order.customerInfo?.email || order.customer?.email || '',
            order.status || '',
            order.payment?.method || order.paymentMethod || '',
            `"${items}"`,
            order.pricing?.subtotal || 0,
            order.pricing?.deliveryFee || order.deliveryFee || 6.99,
            order.pricing?.tip || 0,
            order.pricing?.tax || 0,
            order.pricing?.discount || 0,
            order.pricing?.total || order.total || 0,
            `"${order.delivery?.instructions || order.notes || ''}"`,
        ];
    });

    // Calculate summary statistics
    const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing?.total || o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalTips = orders.reduce((sum, o) => sum + (o.pricing?.tip || 0), 0);

    // Payment method breakdown
    const paymentCounts = { cash: 0, card: 0, check: 0 };
    orders.forEach(order => {
        const method = order.payment?.method || order.paymentMethod || 'cash';
        if (paymentCounts.hasOwnProperty(method)) {
            paymentCounts[method]++;
        }
    });

    // Status breakdown
    const statusCounts = {};
    orders.forEach(order => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Build CSV content
    let csv = headers.join(',') + '\n';
    csv += rows.map(row => row.join(',')).join('\n');

    // Add summary section
    csv += '\n\n';
    csv += 'SUMMARY STATISTICS\n';
    csv += `Period,${period}\n`;
    csv += `Export Date,${new Date().toLocaleString()}\n`;
    csv += `Total Orders,${totalOrders}\n`;
    csv += `Total Revenue,$${totalRevenue.toFixed(2)}\n`;
    csv += `Average Order Value,$${avgOrderValue.toFixed(2)}\n`;
    csv += `Total Tips,$${totalTips.toFixed(2)}\n`;
    csv += '\n';
    csv += 'PAYMENT METHODS\n';
    csv += `Cash,${paymentCounts.cash}\n`;
    csv += `Card,${paymentCounts.card}\n`;
    csv += `Check,${paymentCounts.check}\n`;
    csv += '\n';
    csv += 'ORDER STATUS\n';
    Object.entries(statusCounts).forEach(([status, count]) => {
        csv += `${status},${count}\n`;
    });

    return csv;
}

// ============ PHONE ORDER (NEW ORDER MODAL) ============

function openNewOrderModal() {
    // Redirect to main website to place an order
    showAdminToast('Redirecting to shop to place order...', 'success');
    setTimeout(() => {
        window.open('/shop.html', '_blank');
    }, 500);
}

function populateItemSelects() {
    const selects = document.querySelectorAll('.item-select');
    const optionsHTML =
        '<option value="">Select item...</option>' +
        groceries
            .map(
                item => `
            <option value="${item.id}" data-price="${item.price}">
                ${item.emoji} ${item.name} - $${item.price.toFixed(2)}
            </option>
        `
            )
            .join('');

    selects.forEach(select => {
        select.innerHTML = optionsHTML;
        select.addEventListener('change', updatePhoneOrderTotal);
    });
}

function addItemRow() {
    const builder = document.getElementById('order-items-builder');
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.innerHTML = `
        <select class="form-input item-select">
            <option value="">Select item...</option>
            ${groceries
                .map(
                    item => `
                <option value="${item.id}" data-price="${item.price}">
                    ${item.emoji} ${item.name} - $${item.price.toFixed(2)}
                </option>
            `
                )
                .join('')}
        </select>
        <input type="number" class="form-input item-qty" value="1" min="1">
        <button type="button" class="btn btn-danger btn-sm" onclick="removeItemRow(this)">×</button>
    `;
    builder.appendChild(newRow);

    // Add event listeners
    newRow.querySelector('.item-select').addEventListener('change', updatePhoneOrderTotal);
    newRow.querySelector('.item-qty').addEventListener('change', updatePhoneOrderTotal);
}

function removeItemRow(btn) {
    const row = btn.closest('.item-row');
    const builder = document.getElementById('order-items-builder');

    // Keep at least one row
    if (builder.querySelectorAll('.item-row').length > 1) {
        row.remove();
        updatePhoneOrderTotal();
    }
}

function updatePhoneOrderTotal() {
    const rows = document.querySelectorAll('.item-row');
    let subtotal = 0;

    rows.forEach(row => {
        const select = row.querySelector('.item-select');
        const qtyInput = row.querySelector('.item-qty');

        if (select.value) {
            const option = select.options[select.selectedIndex];
            const price = parseFloat(option.dataset.price) || 0;
            const qty = parseInt(qtyInput.value) || 1;
            subtotal += price * qty;
        }
    });

    const delivery = 6.99;
    const total = subtotal + delivery;

    setElementText('po-subtotal', '$' + subtotal.toFixed(2));
    setElementText('po-total', '$' + total.toFixed(2));
}

function submitPhoneOrder() {
    const name = document.getElementById('po-name').value.trim();
    const phone = document.getElementById('po-phone').value.trim();
    const address = document.getElementById('po-address').value.trim();
    const deliveryTime = document.getElementById('po-time').value;
    const payment = document.getElementById('po-payment').value;
    const notes = document.getElementById('po-notes').value.trim();

    // Validate
    if (!name || !phone || !address) {
        showAdminToast('Please fill in customer name, phone, and address', 'error');
        return;
    }

    // Collect items
    const items = [];
    const rows = document.querySelectorAll('.item-row');

    rows.forEach(row => {
        const select = row.querySelector('.item-select');
        const qtyInput = row.querySelector('.item-qty');

        if (select.value) {
            const product = groceries.find(p => p.id === parseInt(select.value));
            if (product) {
                items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    emoji: product.emoji,
                    quantity: parseInt(qtyInput.value) || 1,
                });
            }
        }
    });

    if (items.length === 0) {
        showAdminToast('Please add at least one item to the order', 'error');
        return;
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const delivery = 6.99;
    const total = subtotal + delivery;

    // Create order
    const orderId = 'ORD-' + Date.now().toString().slice(-6);

    const newOrder = {
        id: orderId,
        name,
        phone,
        address,
        email: '',
        items,
        subtotal,
        delivery,
        total: total.toFixed(2),
        status: 'confirmed', // Phone orders are pre-confirmed
        payment,
        deliveryTime,
        notes: notes + ' [Phone Order]',
        timestamp: Date.now(),
        driver: null,
        shopper: null,
    };

    adminOrders.unshift(newOrder);
    saveAdminOrders();

    showAdminToast(`Order ${orderId} created successfully!`, 'success');
    closeModal('new-order-modal');

    // Refresh page content
    if (document.getElementById('orders-table-body')) {
        renderOrdersTable();
        updateOrderCounts();
    }
    if (document.getElementById('recent-orders-list')) {
        initDashboard();
    }

    updatePendingOrdersCount();
}

// ============ EXPORT FUNCTIONS ============

function exportOrders() {
    const orders = getFilteredOrders();

    if (orders.length === 0) {
        showAdminToast('No orders to export', 'warning');
        return;
    }

    // Create CSV content
    const headers = [
        'Order ID',
        'Customer',
        'Phone',
        'Address',
        'Items',
        'Total',
        'Status',
        'Driver',
        'Date',
    ];

    const rows = orders.map(order => [
        order.orderId || order.id,
        order.customerInfo?.name || order.name || '',
        order.customerInfo?.phone || order.phone || '',
        `"${(order.customerInfo?.address || order.address || '').replace(/"/g, '""')}"`,
        (order.items?.length || 0) + ' items',
        '$' + (order.pricing?.total || order.total || 0).toFixed(2),
        order.status || '',
        order.delivery?.driverName || order.driver || '',
        formatDateTime(order.createdAt || order.timestamp),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${formatDateForFile(new Date())}.csv`;
    link.click();

    showAdminToast(`Exported ${orders.length} orders`, 'success');
}

// ============ MODAL FUNCTIONS ============

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking overlay
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// ============ SIDEBAR TOGGLE ============

function toggleAdminSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    sidebar.classList.toggle('active');

    // Create overlay if doesn't exist
    if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.className = 'sidebar-overlay';
        newOverlay.onclick = toggleAdminSidebar;
        document.body.appendChild(newOverlay);
    }

    document.querySelector('.sidebar-overlay')?.classList.toggle('active');
}

// ============ ADMIN LOGOUT - FIXED ============

function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear ALL session data
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminLoggedIn');

        // Optionally clear remembered username (uncomment if you want full logout)
        // localStorage.removeItem('rememberedUser');

        // Log the logout activity (before clearing session)
        const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
        activities.unshift({
            type: 'logout',
            message: 'User logged out',
            user: 'admin',
            timestamp: Date.now(),
        });
        localStorage.setItem('adminActivities', JSON.stringify(activities));

        // Redirect to login page
        window.location.href = 'admin-login.html';
    }
}

// ============ TOAST NOTIFICATIONS ============

function showAdminToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.admin-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showNotification(title, message, type = 'info') {
    // Use browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico',
        });
    }

    // Also show admin toast
    showAdminToast(`${title}: ${message}`, type);
}

// ============ UTILITY FUNCTIONS ============

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatStatus(status) {
    const statusMap = {
        placed: '🆕 New',
        confirmed: '✅ Confirmed',
        in_progress: '🛒 In Progress',
        ready: '📦 Ready',
        out_for_delivery: '🚗 Out for Delivery',
        delivered: '✔️ Delivered',
        cancelled: '❌ Cancelled',
        // Legacy support
        shopping: '🛒 Shopping',
        delivering: '🚗 Delivering',
    };
    return statusMap[status] || capitalizeFirst(status);
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function formatDate(timestamp) {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function formatDateForFile(date) {
    return date.toISOString().split('T')[0];
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function getInitials(name) {
    if (!name) return '??';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// ============ URL PARAMETERS ============

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params);
}

// Check URL params on orders page
if (window.location.pathname.includes('admin-orders.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        const params = getUrlParams();
        if (params.search) {
            const searchInput = document.getElementById('filter-search');
            if (searchInput) {
                searchInput.value = params.search;
                filterOrders();
            }
        }
    });
}
