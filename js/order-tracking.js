// ============================================
// ORDER-TRACKING.JS - Order Tracking & Cancellation
// ============================================
// Handles order tracking, real-time updates,
// and order cancellation functionality

let currentOrderId = null;

// ============ ORDER TRACKING ============

async function trackOrder() {
    const phoneInput = document.getElementById('track-phone');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    
    if (!phone) {
        if (typeof toast !== 'undefined') {
            toast.error('Please enter your phone number');
        }
        return;
    }
    
    const statusContainer = document.getElementById('order-status');
    const noOrderMessage = document.getElementById('no-order');
    
    if (typeof loading !== 'undefined') {
        loading.showOverlay('Finding your order...');
    }
    
    try {
        // Call API to track order
        const response = await fetch(`${API_CONFIG.BASE_URL}/orders/track/${encodeURIComponent(phone)}`);
        const data = await response.json();
        
        if (!response.ok || !data.success || !data.order) {
            if (statusContainer) statusContainer.style.display = 'none';
            if (noOrderMessage) {
                noOrderMessage.style.display = 'block';
            } else if (typeof toast !== 'undefined') {
                toast.info('No recent orders found for this phone number');
            }
            if (typeof loading !== 'undefined') {
                loading.hideOverlay();
            }
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
                minute: '2-digit'
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
                minute: '2-digit'
            });
        }
        
        // Display driver info if available
        if (order.delivery && order.delivery.driverId) {
            const driverInfo = document.getElementById('driver-info');
            if (driverInfo) {
                const driver = order.delivery.driverId;
                const driverName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Your Driver';
                
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
        
        if (typeof loading !== 'undefined') {
            loading.hideOverlay();
        }
        if (typeof toast !== 'undefined') {
            toast.success('Order found!');
        }
        
    } catch (error) {
        if (typeof ErrorTracker !== 'undefined') {
            ErrorTracker.captureError(error, {
                context: 'Order Tracking',
                action: 'trackOrder',
                phone: phone
            });
        }
        console.error('Track order error:', error);
        if (typeof loading !== 'undefined') {
            loading.hideOverlay();
        }
        if (typeof toast !== 'undefined') {
            toast.error('Error tracking order. Please try again.');
        }
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
        
        socket.on('order-status-changed', (data) => {
            if (data.orderId === order.orderId || data._id === order._id) {
                console.log('Order status updated:', data.status);
                updateStatusTimeline(data.status, data);
                if (typeof toast !== 'undefined') {
                    toast.success(`Order status updated: ${formatStatus(data.status)}`);
                }
                
                // Reload if status changed significantly
                if (window.location.pathname.includes('track.html')) {
                    setTimeout(() => trackOrder(), 1000);
                }
            }
        });
        
        socket.on('driver-assigned', (data) => {
            if (data.orderId === order.orderId || data._id === order._id) {
                if (typeof toast !== 'undefined') {
                    toast.success('A driver has been assigned to your order!');
                }
                setTimeout(() => trackOrder(), 1000);
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from order tracking');
        });
        
    } catch (error) {
        if (typeof ErrorTracker !== 'undefined') {
            ErrorTracker.captureError(error, {
                context: 'Order Tracking',
                action: 'connectOrderTracking'
            });
        }
        console.error('Socket.io connection error:', error);
    }
}

function updateStatusTimeline(status, order) {
    // Map API status to timeline elements
    const statusMapping = {
        'placed': ['status-confirmed'],
        'confirmed': ['status-confirmed'],
        'shopping': ['status-confirmed', 'status-shopping'],
        'delivering': ['status-confirmed', 'status-shopping', 'status-delivering'],
        'delivered': ['status-confirmed', 'status-shopping', 'status-delivering', 'status-delivered'],
        'cancelled': [] // Don't mark any as completed if cancelled
    };
    
    const completedStatuses = statusMapping[status] || [];
    
    // Reset all statuses first
    ['status-confirmed', 'status-shopping', 'status-delivering', 'status-delivered'].forEach(statusId => {
        const statusEl = document.getElementById(statusId);
        if (statusEl) {
            statusEl.classList.remove('completed');
            const marker = statusEl.querySelector('.timeline-marker');
            const markerNumbers = { 
                'status-confirmed': '2', 
                'status-shopping': '3', 
                'status-delivering': '4', 
                'status-delivered': '5' 
            };
            if (marker) marker.textContent = markerNumbers[statusId] || '';
        }
    });
    
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
        const deliveredTime = document.getElementById('delivered-time');
        if (deliveredTime) {
            deliveredTime.textContent = 'Just now!';
        }
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
        'placed': 'Order Placed',
        'confirmed': 'Order Confirmed',
        'shopping': 'Shopping in Progress',
        'delivering': 'Out for Delivery',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusLabels[status] || status;
}

// ============ ORDER CANCELLATION ============

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
        const cancelReason = document.getElementById('cancel-reason');
        const otherReason = document.getElementById('other-reason');
        const otherReasonContainer = document.getElementById('other-reason-container');
        
        if (cancelReason) cancelReason.value = '';
        if (otherReason) otherReason.value = '';
        if (otherReasonContainer) otherReasonContainer.style.display = 'none';
    }
}

async function confirmCancelOrder() {
    const reasonSelect = document.getElementById('cancel-reason');
    const otherReasonInput = document.getElementById('other-reason');
    const phoneInput = document.getElementById('track-phone');
    
    if (!phoneInput) {
        if (typeof showToast !== 'undefined') {
            showToast('Phone number not found', 'error');
        }
        return;
    }
    
    const phone = phoneInput.value.trim();
    let reason = reasonSelect ? reasonSelect.value : '';
    
    if (!reason) {
        if (typeof showToast !== 'undefined') {
            showToast('Please select a cancellation reason', 'error');
        }
        return;
    }
    
    if (reason === 'other') {
        const otherReason = otherReasonInput ? otherReasonInput.value.trim() : '';
        if (!otherReason) {
            if (typeof showToast !== 'undefined') {
                showToast('Please specify your reason', 'error');
            }
            return;
        }
        reason = otherReason;
    }
    
    // Get order ID from the page
    const orderIdEl = document.getElementById('order-id');
    if (!orderIdEl) {
        if (typeof showToast !== 'undefined') {
            showToast('Order information not found', 'error');
        }
        return;
    }
    
    const orderId = orderIdEl.dataset.mongoId;
    
    if (!orderId) {
        if (typeof showToast !== 'undefined') {
            showToast('Order ID not available', 'error');
        }
        return;
    }
    
    try {
        if (typeof loading !== 'undefined') {
            loading.showOverlay('Cancelling your order...');
        }
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason, phone })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to cancel order');
        }
        
        // Check if a refund was processed
        const refundMessage = data.refund 
            ? 'Your payment has been refunded and will appear in your account within 5-7 business days.'
            : 'No charges were made to your account.';
        
        // Close modal
        closeCancelModal();
        
        // Show prominent success message
        if (typeof showToast !== 'undefined') {
            showToast('✅ Order Cancelled Successfully', 'success');
        }
        
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
            notice.style.cssText = 'background: #fee2e2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin-top: 20px; text-align: center;';
            notice.innerHTML = `
                <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 22px;">
                    ✅ Your order has been cancelled
                </h3>
                <p style="font-size: 18px; margin: 0; color: #1f2937;">
                    ${refundMessage}
                </p>
            `;
            orderInfo.appendChild(notice);
        }
        
        // Refresh order status after showing immediate feedback
        setTimeout(() => {
            trackOrder();
        }, 2000);
        
    } catch (error) {
        if (typeof ErrorTracker !== 'undefined') {
            ErrorTracker.captureError(error, {
                context: 'Order Tracking',
                action: 'confirmCancelOrder',
                orderId: orderId
            });
        }
        console.error('Cancel order error:', error);
        if (typeof showToast !== 'undefined') {
            showToast(error.message || 'Failed to cancel order. Please contact us directly.', 'error');
        }
    } finally {
        if (typeof loading !== 'undefined') {
            loading.hideOverlay();
        }
    }
}

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', function() {
    // Show/hide custom reason textarea
    const cancelReasonSelect = document.getElementById('cancel-reason');
    if (cancelReasonSelect) {
        cancelReasonSelect.addEventListener('change', function() {
            const otherContainer = document.getElementById('other-reason-container');
            if (otherContainer) {
                if (this.value === 'other') {
                    otherContainer.style.display = 'block';
                } else {
                    otherContainer.style.display = 'none';
                }
            }
        });
    }
});

// ============ EXPORTS ============

// Expose functions globally for onclick handlers
window.trackOrder = trackOrder;
window.showCancelModal = showCancelModal;
window.closeCancelModal = closeCancelModal;
window.confirmCancelOrder = confirmCancelOrder;
window.updateStatusTimeline = updateStatusTimeline;
window.formatStatus = formatStatus;
