/* ===================================
   TRACKING MODULE
   Handles order tracking and status updates
   =================================== */

// Track order
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
            orderIdEl.dataset.mongoId = order._id;
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

                if (order.delivery.pickedUpAt) {
                    driverInfo.style.display = 'block';

                    const contactBtn = driverInfo.querySelector('a[href^="tel:"]');
                    if (contactBtn && driver.phone) {
                        contactBtn.href = `tel:${driver.phone}`;
                    }
                }
            }
        }

        updateStatusTimeline(order.status, order);
        updateCancelButton(order);
        connectOrderTracking(order);

        loading.hideOverlay();
        toast.success('Order found!');
    } catch (error) {
        console.error('Track order error:', error);
        loading.hideOverlay();
        toast.error('Error tracking order. Please try again.');
    }
}

// Update status timeline
function updateStatusTimeline(status, order) {
    const statusMapping = {
        placed: ['status-confirmed'],
        confirmed: ['status-confirmed'],
        shopping: ['status-confirmed', 'status-shopping'],
        delivering: ['status-confirmed', 'status-shopping', 'status-delivering'],
        delivered: ['status-confirmed', 'status-shopping', 'status-delivering', 'status-delivered'],
        cancelled: [],
    };

    const completedStatuses = statusMapping[status] || [];

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
        if (deliveredTime) deliveredTime.textContent = 'Just now!';
    }

    const cancelSection = document.getElementById('cancel-order-section');
    if (cancelSection) {
        if (status === 'placed' || status === 'confirmed') {
            cancelSection.style.display = 'block';
        } else {
            cancelSection.style.display = 'none';
        }
    }
}

// Update cancel button
function updateCancelButton(order) {
    const cancelSection = document.getElementById('cancel-order-section');
    if (!cancelSection) return;

    const cancelableStatuses = ['placed', 'confirmed'];
    if (cancelableStatuses.includes(order.status) && !order.delivery?.pickedUpAt) {
        cancelSection.style.display = 'block';
    } else {
        cancelSection.style.display = 'none';
    }
}

// Connect to Socket.io
function connectOrderTracking(order) {
    if (!window.io) return;

    try {
        const socket = io(API_CONFIG.SOCKET_URL || 'http://localhost:3000');

        socket.on('connect', () => {
            console.log('Connected to order tracking');
            socket.emit('track-order', { phone: order.customerInfo?.phone });
        });

        socket.on('order-status-changed', data => {
            if (data.orderId === order.orderId || data._id === order._id) {
                console.log('Order status updated:', data.status);
                updateStatusTimeline(data.status, data);
                toast.success(`Order status updated: ${formatStatus(data.status)}`);

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

// Order cancellation
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

        document.getElementById('cancel-reason').value = '';
        document.getElementById('other-reason').value = '';
        document.getElementById('other-reason-container').style.display = 'none';
    }
}

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

    const orderIdEl = document.getElementById('order-id');
    if (!orderIdEl) {
        showToast('Order information not found', 'error');
        return;
    }

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

        closeCancelModal();
        showToast('✅ Order Cancelled Successfully', 'success');

        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = '❌ CANCELLED';
            statusBadge.style.background = '#dc2626';
            statusBadge.style.color = 'white';
        }

        const cancelBtn = document.querySelector('button[onclick="showCancelModal()"]');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }

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

// Expose globally
window.showCancelModal = showCancelModal;
window.closeCancelModal = closeCancelModal;
window.confirmCancelOrder = confirmCancelOrder;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { trackOrder, updateStatusTimeline, showCancelModal, confirmCancelOrder };
}
