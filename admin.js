/* ===================================
   ADMIN DASHBOARD - JAVASCRIPT
   Version 1.0
   =================================== */

// ============ SAMPLE DATA ============

// Sample Drivers
const drivers = [
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
        joinDate: '2023-01-15'
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
        joinDate: '2023-06-20'
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
        joinDate: '2022-08-10'
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
        joinDate: '2024-01-05'
    }
];

// Sample Customers
const customers = [
    {
        id: 1,
        name: 'Margaret Roberts',
        phone: '555-100-1001',
        email: 'margaret@email.com',
        address: '123 Oak Street, Apt 2B',
        totalOrders: 24,
        totalSpent: 487.50,
        lastOrder: '2024-01-15',
        notes: 'Prefers morning deliveries'
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
        notes: 'Leave packages on porch'
    },
    {
        id: 3,
        name: 'Eleanor Baker',
        phone: '555-100-1003',
        email: '',
        address: '789 Pine Road',
        totalOrders: 31,
        totalSpent: 623.80,
        lastOrder: '2024-01-15',
        notes: 'Ring doorbell twice'
    }
];

// Sample Orders (will also load from localStorage)
let adminOrders = [];

// Activity Log
const activityLog = [];

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', function() {
    // Load orders from localStorage
    loadAdminOrders();
    
    // Initialize page-specific content
    initializePage();
    
    // Set current date
    setCurrentDate();
    
    // Start auto-refresh
    setInterval(refreshDashboard, 30000); // Refresh every 30 seconds
});

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

// ============ LOAD DATA ============

function loadAdminOrders() {
    const savedOrders = localStorage.getItem('hometownOrders');
    if (savedOrders) {
        adminOrders = JSON.parse(savedOrders);
    }
    
    // Add sample orders if none exist
    if (adminOrders.length === 0) {
        adminOrders = generateSampleOrders();
        saveAdminOrders();
    }
}

function saveAdminOrders() {
    localStorage.setItem('hometownOrders', JSON.stringify(adminOrders));
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
                { id: 7, name: 'Large Eggs', price: 3.29, quantity: 1, emoji: '🥚' }
            ],
            subtotal: 12.76,
            delivery: 6.99,
            total: '19.75',
            status: 'placed',
            payment: 'cash',
            deliveryTime: 'asap',
            notes: 'Ring doorbell twice',
            timestamp: now - (hour * 0.5),
            driver: null,
            shopper: null
        },
        {
            id: 'ORD-001233',
            name: 'Robert Thompson',
            phone: '555-100-1002',
            address: '456 Maple Avenue',
            email: 'robert@email.com',
            items: [
                { id: 12, name: 'Bananas', price: 0.69, quantity: 3, emoji: '🍌' },
                { id: 20, name: 'Chicken Breast', price: 5.99, quantity: 2, emoji: '🍗' }
            ],
            subtotal: 14.05,
            delivery: 6.99,
            total: '21.04',
            status: 'confirmed',
            payment: 'card',
            deliveryTime: 'morning',
            notes: '',
            timestamp: now - (hour * 1),
            driver: null,
            shopper: 'Mary J.'
        },
        {
            id: 'ORD-001232',
            name: 'Eleanor Baker',
            phone: '555-100-1003',
            address: '789 Pine Road',
            email: '',
            items: [
                { id: 31, name: 'Coffee', price: 8.99, quantity: 1, emoji: '☕' },
                { id: 8, name: 'Butter', price: 4.99, quantity: 1, emoji: '🧈' }
            ],
            subtotal: 13.98,
            delivery: 6.99,
            total: '20.97',
            status: 'shopping',
            payment: 'cash',
            deliveryTime: 'afternoon',
            notes: 'Call when arriving',
            timestamp: now - (hour * 2),
            driver: 'Tom R.',
            shopper: 'Tom R.'
        },
        {
            id: 'ORD-001231',
            name: 'William Davis',
            phone: '555-100-1004',
            address: '321 Elm Street',
            email: 'william@email.com',
            items: [
                { id: 17, name: 'Potatoes', price: 4.99, quantity: 1, emoji: '🥔' },
                { id: 21, name: 'Ground Beef', price: 6.99, quantity: 2, emoji: '🥩' }
            ],
            subtotal: 18.97,
            delivery: 6.99,
            total: '25.96',
            status: 'delivering',
            payment: 'check',
            deliveryTime: 'asap',
            notes: '',
            timestamp: now - (hour * 3),
            driver: 'Mary J.',
            shopper: 'Mary J.'
        },
        {
            id: 'ORD-001230',
            name: 'Patricia Wilson',
            phone: '555-100-1005',
            address: '654 Birch Lane',
            email: 'patricia@email.com',
            items: [
                { id: 34, name: 'Ice Cream', price: 4.99, quantity: 2, emoji: '🍨' }
            ],
            subtotal: 9.98,
            delivery: 6.99,
            total: '16.97',
            status: 'delivered',
            payment: 'cash',
            deliveryTime: 'evening',
            notes: '',
            timestamp: now - (hour * 5),
            driver: 'Susan W.',
            shopper: 'Susan W.'
        }
    ];
}

// ============ DASHBOARD ============

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
    
    const todayOrders = adminOrders.filter(o => new Date(o.timestamp).setHours(0, 0, 0, 0) === today);
    const pendingOrders = adminOrders.filter(o => ['placed', 'confirmed'].includes(o.status));
    const activeDrivers = drivers.filter(d => d.status === 'online' || d.status === 'busy');
    
    const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    
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
    
    container.innerHTML = recentOrders.map(order => `
        <div class="order-item" onclick="viewOrderDetail('${order.id}')">
            <div class="order-id">${order.id}</div>
            <div class="order-customer">
                <div class="order-customer-name">${order.name}</div>
                <div class="order-customer-address">${truncateText(order.address, 30)}</div>
            </div>
            <div class="order-amount">$${order.total}</div>
            <div class="order-status ${order.status}">${formatStatus(order.status)}</div>
        </div>
    `).join('');
}

function renderActiveDeliveries() {
    const container = document.getElementById('active-deliveries-list');
    const countBadge = document.getElementById('active-deliveries-count');
    if (!container) return;
    
    const activeDeliveries = adminOrders.filter(o => ['shopping', 'delivering'].includes(o.status));
    
    if (countBadge) countBadge.textContent = activeDeliveries.length;
    
    if (activeDeliveries.length === 0) {
        container.innerHTML = '<p class="empty-message">No active deliveries</p>';
        return;
    }
    
    container.innerHTML = activeDeliveries.map(order => `
        <div class="order-item" onclick="viewOrderDetail('${order.id}')">
            <div class="order-status ${order.status}">${formatStatus(order.status)}</div>
            <div class="order-customer">
                <div class="order-customer-name">${order.name}</div>
                <div class="order-customer-address">Driver: ${order.driver || 'Unassigned'}</div>
            </div>
            <div class="order-amount">$${order.total}</div>
        </div>
    `).join('');
}

function renderDriversStatus() {
    const container = document.getElementById('drivers-status-grid');
    if (!container) return;
    
    container.innerHTML = drivers.map(driver => `
        <div class="driver-status-card">
            <div class="driver-avatar">${driver.firstName[0]}${driver.lastName[0]}</div>
            <div class="driver-info">
                <div class="driver-name">${driver.firstName} ${driver.lastName[0]}.</div>
                <div class="driver-status ${driver.status}">
                    <span class="status-dot"></span>
                    ${capitalizeFirst(driver.status)}
                </div>
            </div>
        </div>
    `).join('');
}

function renderActivityTimeline() {
    const container = document.getElementById('activity-timeline');
    if (!container) return;
    
    // Generate activity from orders
    const activities = adminOrders.slice(0, 6).map(order => ({
        time: formatTime(order.timestamp),
        title: `Order ${order.id}`,
        description: `${order.name} - ${formatStatus(order.status)}`
    }));
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="empty-message">No activity today</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-time">${activity.time}</div>
            <div class="activity-dot"></div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
        </div>
    `).join('');
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
    alert('✅ Password changed successfully!\n\n(Note: In demo mode, password is not actually changed)');
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
    const session = Auth.getSession();
    if (!session) return;
    
    const timeRemaining = session.expiresAt - Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeRemaining < fiveMinutes && timeRemaining > 0 && !sessionWarningShown) {
        showSessionWarning(Math.floor(timeRemaining / 60000));
        sessionWarningShown = true;
    }
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
    
    tbody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>
                <div>${order.name}</div>
                <small style="color: #64748b;">${order.phone}</small>
            </td>
            <td>${order.items.length} items</td>
            <td><strong>$${order.total}</strong></td>
            <td><span class="order-status ${order.status}">${formatStatus(order.status)}</span></td>
            <td>${order.driver || '—'}</td>
            <td>${formatTime(order.timestamp)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn view" onclick="viewOrderDetail('${order.id}')">View</button>
                    <button class="table-btn edit" onclick="quickUpdateStatus('${order.id}')">Update</button>
                </div>
            </td>
        </tr>
    `).join('');
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
            const orderDate = new Date(o.timestamp);
            
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
        filtered = filtered.filter(o => 
            o.id.toLowerCase().includes(searchFilter) ||
            o.name.toLowerCase().includes(searchFilter) ||
            o.phone.includes(searchFilter) ||
            o.address.toLowerCase().includes(searchFilter)
        );
    }
    
    // Sort by most recent
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    return filtered;
}

function filterOrders() {
    renderOrdersTable();
    updateOrderCounts();
}

function resetFilters() {
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-date').value = 'today';
    document.getElementById('filter-search').value = '';
    filterOrders();
}

function updateOrderCounts() {
    const all = adminOrders.length;
    const newOrders = adminOrders.filter(o => o.status === 'placed').length;
    const inProgress = adminOrders.filter(o => ['confirmed', 'shopping', 'delivering'].includes(o.status)).length;
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

let currentOrderId = null;

function viewOrderDetail(orderId) {
    const order = adminOrders.find(o => o.id === orderId);
    if (!order) return;
    
    currentOrderId = orderId;
    
    // Populate modal
    setElementText('modal-order-id', order.id);
    setElementText('detail-name', order.name);
    setElementText('detail-address', order.address);
    setElementText('detail-email', order.email || '—');
    setElementText('detail-time', formatDateTime(order.timestamp));
    setElementText('detail-delivery-time', capitalizeFirst(order.deliveryTime));
    setElementText('detail-payment', capitalizeFirst(order.payment));
    setElementText('detail-notes', order.notes || '—');
    
    const phoneLink = document.getElementById('detail-phone-link');
    if (phoneLink) {
        phoneLink.textContent = order.phone;
        phoneLink.href = 'tel:' + order.phone;
    }
    
    // Populate items
    const itemsContainer = document.getElementById('detail-items');
    if (itemsContainer) {
        itemsContainer.innerHTML = order.items.map(item => `
            <tr>
                <td>${item.emoji} ${item.name}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');
    }
    
    setElementText('detail-subtotal', '$' + order.subtotal.toFixed(2));
    setElementText('detail-total', '$' + order.total);
    
    // Set current status in dropdown
    const statusSelect = document.getElementById('update-status');
    if (statusSelect) statusSelect.value = order.status;
    
    // Set current driver
    const driverSelect = document.getElementById('assign-driver');
    if (driverSelect && order.driver) {
        // Try to find matching driver
        const driverOption = Array.from(driverSelect.options).find(opt => 
            opt.textContent.includes(order.driver.split(' ')[0])
        );
        if (driverOption) driverSelect.value = driverOption.value;
    }
    
    openModal('order-detail-modal');
}

function updateOrderStatus() {
    if (!currentOrderId) return;
    
    const order = adminOrders.find(o => o.id === currentOrderId);
    if (!order) return;
    
    const newStatus = document.getElementById('update-status').value;
    const driverSelect = document.getElementById('assign-driver');
    const driverId = driverSelect?.value;
    
    order.status = newStatus;
    
    if (driverId) {
        const driver = drivers.find(d => d.id === parseInt(driverId));
        if (driver) {
            order.driver = `${driver.firstName} ${driver.lastName[0]}.`;
            order.shopper = order.shopper || order.driver;
        }
    }
    
    saveAdminOrders();
    
    showAdminToast('Order status updated!', 'success');
    closeModal('order-detail-modal');
    
    // Refresh the page content
    if (document.getElementById('orders-table-body')) {
        renderOrdersTable();
        updateOrderCounts();
    }
    if (document.getElementById('recent-orders-list')) {
        initDashboard();
    }
    
    updatePendingOrdersCount();
}

function quickUpdateStatus(orderId) {
    viewOrderDetail(orderId);
}

function cancelOrder() {
    if (!currentOrderId) return;
    
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    const order = adminOrders.find(o => o.id === currentOrderId);
    if (order) {
        order.status = 'cancelled';
        saveAdminOrders();
        showAdminToast('Order cancelled', 'warning');
        closeModal('order-detail-modal');
        
        if (document.getElementById('orders-table-body')) {
            renderOrdersTable();
            updateOrderCounts();
        }
    }
}

function printOrder() {
    window.print();
}

function callCustomer() {
    const order = adminOrders.find(o => o.id === currentOrderId);
    if (order) {
        window.location.href = 'tel:' + order.phone;
    }
}

function populateDriverSelect() {
    const selects = document.querySelectorAll('#assign-driver');
    const activeDrivers = drivers.filter(d => d.status !== 'inactive');
    
    selects.forEach(select => {
        select.innerHTML = '<option value="">Assign Driver...</option>' +
            activeDrivers.map(d => `
                <option value="${d.id}">${d.firstName} ${d.lastName} (${d.status})</option>
            `).join('');
    });
}

// ============ PRODUCTS PAGE ============

function initProductsPage() {
    renderProductsGrid();
    updateProductCounts();
}

function renderProductsGrid() {
    const container = document.getElementById('products-grid');
    if (!container) return;
    
    let filteredProducts = getFilteredProducts();
    
    container.innerHTML = filteredProducts.map(product => `
        <div class="product-admin-card">
            <div class="product-admin-image">${product.emoji}</div>
            <div class="product-admin-content">
                <div class="product-admin-name">${product.name}</div>
                <div class="product-admin-category">${capitalizeFirst(product.category)}</div>
                <div class="product-admin-price">$${product.price.toFixed(2)}</div>
                <div class="product-admin-status ${product.status || 'active'}">${formatProductStatus(product.status || 'active')}</div>
                <div class="product-admin-actions">
                    <button class="btn btn-outline btn-sm" onclick="editProduct(${product.id})">✏️ Edit</button>
                    <button class="btn btn-outline btn-sm" onclick="toggleProductStatus(${product.id})">👁️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function getFilteredProducts() {
    let filtered = [...groceries];
    
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
        filtered = filtered.filter(p => 
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
    setElementText('count-total-products', groceries.length);
    setElementText('count-active-products', groceries.filter(p => (p.status || 'active') === 'active').length);
    setElementText('count-out-of-stock', groceries.filter(p => p.status === 'out-of-stock').length);
}

function openAddProductModal() {
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    openModal('product-modal');
}

function editProduct(productId) {
    const product = groceries.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-emoji').value = product.emoji;
    document.getElementById('product-status').value = product.status || 'active';
    
    openModal('product-modal');
}

function saveProduct() {
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
    
    if (id) {
        // Edit existing
        const product = groceries.find(p => p.id === parseInt(id));
        if (product) {
            product.name = name;
            product.price = price;
            product.category = category;
            product.emoji = emoji;
            product.status = status;
        }
    } else {
        // Add new
        const newId = Math.max(...groceries.map(p => p.id)) + 1;
        groceries.push({
            id: newId,
            name,
            price,
            category,
            emoji,
            status
        });
    }
    
    showAdminToast('Product saved successfully!', 'success');
    closeModal('product-modal');
    renderProductsGrid();
    updateProductCounts();
}

function toggleProductStatus(productId) {
    const product = groceries.find(p => p.id === productId);
    if (!product) return;
    
    const currentStatus = product.status || 'active';
    product.status = currentStatus === 'active' ? 'hidden' : 'active';
    
    showAdminToast(`Product ${product.status === 'active' ? 'shown' : 'hidden'}`, 'success');
    renderProductsGrid();
    updateProductCounts();
}

function formatProductStatus(status) {
    const statusMap = {
        'active': '✅ Active',
        'out-of-stock': '❌ Out of Stock',
        'hidden': '👁️ Hidden'
    };
    return statusMap[status] || status;
}

// ============ DRIVERS PAGE ============

function initDriversPage() {
    renderDriversGrid();
    updateDriverStats();
}

function renderDriversGrid() {
    const container = document.getElementById('drivers-grid');
    if (!container) return;
    
    container.innerHTML = drivers.map(driver => `
        <div class="driver-card">
            <div class="driver-card-header">
                <div class="driver-avatar-large">${driver.firstName[0]}${driver.lastName[0]}</div>
                <div class="driver-card-info">
                    <h3>${driver.firstName} ${driver.lastName}</h3>
                    <span class="driver-status-badge ${driver.status}">${capitalizeFirst(driver.status)}</span>
                </div>
            </div>
            
            <div class="driver-card-stats">
                <div class="driver-stat">
                    <div class="driver-stat-value">${driver.totalDeliveries}</div>
                    <div class="driver-stat-label">Deliveries</div>
                </div>
                <div class="driver-stat">
                    <div class="driver-stat-value">${driver.rating}★</div>
                    <div class="driver-stat-label">Rating</div>
                </div>
                <div class="driver-stat">
                    <div class="driver-stat-value">$${driver.earnings}</div>
                    <div class="driver-stat-label">Earnings</div>
                </div>
            </div>
            
            <div class="driver-card-details">
                <div class="driver-detail-row">
                    <span>Phone</span>
                    <span>${driver.phone}</span>
                </div>
                <div class="driver-detail-row">
                    <span>Vehicle</span>
                    <span>${driver.vehicle}</span>
                </div>
            </div>
            
            <div class="driver-card-actions">
                <button class="btn btn-outline btn-sm" onclick="viewDriverDetail(${driver.id})">View</button>
                <button class="btn btn-outline btn-sm" onclick="editDriver(${driver.id})">Edit</button>
                <button class="btn btn-outline btn-sm" onclick="callDriver(${driver.id})">📞</button>
            </div>
        </div>
    `).join('');
}

function updateDriverStats() {
    const total = drivers.length;
    const online = drivers.filter(d => d.status === 'online').length;
    const busy = drivers.filter(d => d.status === 'busy').length;
    const todayDeliveries = drivers.reduce((sum, d) => sum + Math.floor(d.totalDeliveries / 30), 0);
    
    setElementText('stat-total-drivers', total);
    setElementText('stat-online-drivers', online);
    setElementText('stat-busy-drivers', busy);
    setElementText('stat-today-deliveries', todayDeliveries);
}

function openAddDriverModal() {
    document.getElementById('driver-modal-title').textContent = 'Add New Driver';
    document.getElementById('driver-form').reset();
    document.getElementById('driver-id').value = '';
    openModal('driver-modal');
}

function editDriver(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    
    document.getElementById('driver-modal-title').textContent = 'Edit Driver';
    document.getElementById('driver-id').value = driver.id;
    document.getElementById('driver-first-name').value = driver.firstName;
    document.getElementById('driver-last-name').value = driver.lastName;
    document.getElementById('driver-phone').value = driver.phone;
    document.getElementById('driver-email').value = driver.email;
    document.getElementById('driver-vehicle-type').value = driver.vehicleType;
    document.getElementById('driver-vehicle').value = driver.vehicle;
    document.getElementById('driver-license').value = driver.licensePlate;
    document.getElementById('driver-status').value = driver.status;
    
    openModal('driver-modal');
}

function saveDriver() {
    const id = document.getElementById('driver-id').value;
    const firstName = document.getElementById('driver-first-name').value;
    const lastName = document.getElementById('driver-last-name').value;
    const phone = document.getElementById('driver-phone').value;
    const email = document.getElementById('driver-email').value;
    const vehicleType = document.getElementById('driver-vehicle-type').value;
    const vehicle = document.getElementById('driver-vehicle').value;
    const licensePlate = document.getElementById('driver-license').value;
    const status = document.getElementById('driver-status').value;
    
    if (!firstName || !lastName || !phone) {
        showAdminToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (id) {
        // Edit existing
        const driver = drivers.find(d => d.id === parseInt(id));
        if (driver) {
            Object.assign(driver, {
                firstName, lastName, phone, email, vehicleType, vehicle, licensePlate, status
            });
        }
    } else {
        // Add new
        const newId = Math.max(...drivers.map(d => d.id)) + 1;
        drivers.push({
            id: newId,
            firstName,
            lastName,
            phone,
            email,
            vehicle,
            vehicleType,
            licensePlate,
            status: status || 'pending',
            rating: 5.0,
            totalDeliveries: 0,
            earnings: 0,
            joinDate: new Date().toISOString().split('T')[0]
        });
    }
    
    showAdminToast('Driver saved successfully!', 'success');
    closeModal('driver-modal');
    renderDriversGrid();
    updateDriverStats();
}

function viewDriverDetail(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    
    document.getElementById('driver-detail-avatar').textContent = `${driver.firstName[0]}${driver.lastName[0]}`;
    document.getElementById('driver-detail-name').textContent = `${driver.firstName} ${driver.lastName}`;
    
    const statusBadge = document.getElementById('driver-detail-status-badge');
    statusBadge.textContent = capitalizeFirst(driver.status);
    statusBadge.className = `driver-status-badge ${driver.status}`;
    
    setElementText('driver-total-deliveries', driver.totalDeliveries);
    setElementText('driver-rating', driver.rating + '★');
    setElementText('driver-earnings', '$' + driver.earnings);
    setElementText('driver-detail-phone', driver.phone);
    setElementText('driver-detail-email', driver.email || '—');
    setElementText('driver-detail-vehicle', driver.vehicle);
    
        // Recent deliveries
    const recentDeliveries = document.getElementById('driver-recent-deliveries');
    const driverName = `${driver.firstName} ${driver.lastName[0]}.`;
    const driverOrders = adminOrders.filter(o => o.driver === driverName).slice(0, 3);
    
    if (recentDeliveries) {
        if (driverOrders.length === 0) {
            recentDeliveries.innerHTML = '<p class="empty-message">No recent deliveries</p>';
        } else {
            recentDeliveries.innerHTML = driverOrders.map(order => `
                <div class="order-item" style="cursor: default;">
                    <div class="order-id">${order.id}</div>
                    <div class="order-customer">
                        <div class="order-customer-name">${order.name}</div>
                        <div class="order-customer-address">${formatTime(order.timestamp)}</div>
                    </div>
                    <div class="order-amount">$${order.total}</div>
                    <div class="order-status ${order.status}">${formatStatus(order.status)}</div>
                </div>
            `).join('');
        }
    }
    
    openModal('driver-detail-modal');
}

function callDriver(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
        window.location.href = 'tel:' + driver.phone;
    }
}

function deactivateDriver() {
    const driverId = document.getElementById('driver-id')?.value;
    if (!driverId) {
        showAdminToast('No driver selected', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to deactivate this driver?')) return;
    
    const driver = drivers.find(d => d.id === parseInt(driverId));
    if (driver) {
        driver.status = 'inactive';
        showAdminToast('Driver deactivated', 'warning');
        closeModal('driver-detail-modal');
        renderDriversGrid();
        updateDriverStats();
    }
}

// ============ CUSTOMERS PAGE ============

function initCustomersPage() {
    renderCustomersGrid();
}

function renderCustomersGrid() {
    const container = document.getElementById('customers-grid');
    if (!container) return;
    
    // Generate customers from orders
    const customerMap = new Map();
    
    adminOrders.forEach(order => {
        if (!customerMap.has(order.phone)) {
            customerMap.set(order.phone, {
                name: order.name,
                phone: order.phone,
                email: order.email,
                address: order.address,
                orders: [],
                totalSpent: 0
            });
        }
        
        const customer = customerMap.get(order.phone);
        customer.orders.push(order);
        customer.totalSpent += parseFloat(order.total);
    });
    
    const customersArray = Array.from(customerMap.values());
    
    if (customersArray.length === 0) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <div class="empty-icon">👥</div>
                <h3>No Customers Yet</h3>
                <p>Customers will appear here after their first order.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = customersArray.map(customer => `
        <div class="customer-card">
            <div class="customer-header">
                <div class="customer-avatar">${getInitials(customer.name)}</div>
                <div class="customer-info">
                    <h3>${customer.name}</h3>
                    <p>${customer.phone}</p>
                </div>
            </div>
            
            <div class="customer-stats">
                <div class="customer-stat">
                    <div class="customer-stat-value">${customer.orders.length}</div>
                    <div class="customer-stat-label">Orders</div>
                </div>
                <div class="customer-stat">
                    <div class="customer-stat-value">$${customer.totalSpent.toFixed(2)}</div>
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
                    <span>${truncateText(customer.address, 25)}</span>
                </div>
                <div class="driver-detail-row">
                    <span>Last Order</span>
                    <span>${formatDate(customer.orders[0]?.timestamp)}</span>
                </div>
            </div>
            
            <div class="driver-card-actions">
                <button class="btn btn-outline btn-sm" onclick="viewCustomerOrders('${customer.phone}')">View Orders</button>
                <button class="btn btn-outline btn-sm" onclick="callCustomerDirect('${customer.phone}')">📞 Call</button>
            </div>
        </div>
    `).join('');
}

function viewCustomerOrders(phone) {
    // Navigate to orders page with filter
    window.location.href = `admin-orders.html?search=${encodeURIComponent(phone)}`;
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
}

function renderReportsSummary() {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    const monthOrders = adminOrders.filter(o => {
        const d = new Date(o.timestamp);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    
    const monthRevenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const avgOrderValue = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0;
    const deliveredOrders = monthOrders.filter(o => o.status === 'delivered').length;
    const deliveryRate = monthOrders.length > 0 ? (deliveredOrders / monthOrders.length * 100) : 0;
    
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
            const orderDate = new Date(o.timestamp);
            return orderDate >= date && orderDate < nextDate;
        });
        
        const dayRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
        
        last7Days.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            orders: dayOrders.length,
            revenue: dayRevenue
        });
    }
    
    const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1);
    
    container.innerHTML = `
        <div class="simple-chart">
            ${last7Days.map(day => `
                <div class="chart-bar-container">
                    <div class="chart-bar" style="height: ${(day.revenue / maxRevenue * 150)}px;">
                        <span class="chart-value">$${day.revenue.toFixed(0)}</span>
                    </div>
                    <div class="chart-label">${day.date}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderTopProducts() {
    const container = document.getElementById('top-products');
    if (!container) return;
    
    // Count product sales
    const productCounts = {};
    
    adminOrders.forEach(order => {
        order.items.forEach(item => {
            if (!productCounts[item.name]) {
                productCounts[item.name] = {
                    name: item.name,
                    emoji: item.emoji,
                    quantity: 0,
                    revenue: 0
                };
            }
            productCounts[item.name].quantity += item.quantity;
            productCounts[item.name].revenue += item.price * item.quantity;
        });
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
                ${topProducts.map(product => `
                    <tr>
                        <td>${product.emoji} ${product.name}</td>
                        <td>${product.quantity}</td>
                        <td>$${product.revenue.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderDriverPerformance() {
    const container = document.getElementById('driver-performance');
    if (!container) return;
    
    const driverStats = drivers.map(driver => {
        const driverName = `${driver.firstName} ${driver.lastName[0]}.`;
        const driverOrders = adminOrders.filter(o => o.driver === driverName);
        const deliveredOrders = driverOrders.filter(o => o.status === 'delivered');
        
        return {
            name: `${driver.firstName} ${driver.lastName}`,
            deliveries: deliveredOrders.length,
            rating: driver.rating,
            earnings: deliveredOrders.length * 4 // $4 per delivery
        };
    }).sort((a, b) => b.deliveries - a.deliveries);
    
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
                ${driverStats.map(driver => `
                    <tr>
                        <td>${driver.name}</td>
                        <td>${driver.deliveries}</td>
                        <td>${driver.rating}★</td>
                        <td>$${driver.earnings.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ============ PHONE ORDER (NEW ORDER MODAL) ============

function openNewOrderModal() {
    document.getElementById('phone-order-form').reset();
    populateItemSelects();
    updatePhoneOrderTotal();
    openModal('new-order-modal');
}

function populateItemSelects() {
    const selects = document.querySelectorAll('.item-select');
    const optionsHTML = '<option value="">Select item...</option>' +
        groceries.map(item => `
            <option value="${item.id}" data-price="${item.price}">
                ${item.emoji} ${item.name} - $${item.price.toFixed(2)}
            </option>
        `).join('');
    
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
            ${groceries.map(item => `
                <option value="${item.id}" data-price="${item.price}">
                    ${item.emoji} ${item.name} - $${item.price.toFixed(2)}
                </option>
            `).join('')}
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
                    quantity: parseInt(qtyInput.value) || 1
                });
            }
        }
    });
    
    if (items.length === 0) {
        showAdminToast('Please add at least one item to the order', 'error');
        return;
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
        shopper: null
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
    const headers = ['Order ID', 'Customer', 'Phone', 'Address', 'Items', 'Total', 'Status', 'Driver', 'Date'];
    
    const rows = orders.map(order => [
        order.id,
        order.name,
        order.phone,
        `"${order.address.replace(/"/g, '""')}"`,
        order.items.length + ' items',
        '$' + order.total,
        order.status,
        order.driver || '',
        formatDateTime(order.timestamp)
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
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
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
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
            timestamp: Date.now()
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

// ============ UTILITY FUNCTIONS ============

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatStatus(status) {
    const statusMap = {
        'placed': '🆕 New',
        'confirmed': '✅ Confirmed',
        'shopping': '🛒 Shopping',
        'delivering': '🚗 Delivering',
        'delivered': '✔️ Delivered',
        'cancelled': '❌ Cancelled'
    };
    return statusMap[status] || status;
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatDate(timestamp) {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
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
    return name.split(' ')
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
    document.addEventListener('DOMContentLoaded', function() {
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
