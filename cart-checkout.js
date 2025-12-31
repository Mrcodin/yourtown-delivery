// Cart Page JavaScript
// Handles cart display and checkout process

// Get cart items from main.js
function getCart() {
    return cart || [];
}

// Initialize Stripe when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Stripe
    const stripeInitialized = await stripeCheckout.initialize();
    
    // Handle payment method selection
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const cardPaymentSection = document.getElementById('card-payment-section');
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'card') {
                // Show card payment section
                cardPaymentSection.style.display = 'block';
                
                // Create Stripe Elements if not already created
                if (stripeInitialized && !stripeCheckout.cardElement) {
                    stripeCheckout.createCardElement('#card-element');
                }
            } else {
                // Hide card payment section
                cardPaymentSection.style.display = 'none';
            }
        });
    });

    // Handle checkout form submission
    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
});

/**
 * Handle checkout form submission
 */
async function handleCheckoutSubmit(e) {
    e.preventDefault();

    // Get cart items
    const cartItems = getCart();
    if (cartItems.length === 0) {
        toast.error('Your cart is empty', 'Cart Empty');
        return;
    }

    // Get form values
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const email = document.getElementById('email').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    // Validate required fields
    if (!name || !phone || !address) {
        toast.error('Please fill in all required fields', 'Validation Error');
        return;
    }

    // Parse address (simple parsing - assumes format like "123 Main St, City, ST 12345")
    const addressParts = address.split(',').map(part => part.trim());
    const street = addressParts[0] || '';
    const city = addressParts[1] || '';
    const stateZip = addressParts[2] || '';
    const stateZipParts = stateZip.split(' ');
    const state = stateZipParts[0] || '';
    const zip = stateZipParts[1] || '';

    const deliveryInfo = {
        name,
        phone,
        email,
        street,
        city,
        state,
        zip,
        instructions: notes
    };

    // Handle different payment methods
    if (paymentMethod === 'card') {
        await processCardPayment(deliveryInfo, cartItems);
    } else {
        await processCashOrCheckOrder(deliveryInfo, cartItems, paymentMethod);
    }
}

/**
 * Process card payment through Stripe
 */
async function processCardPayment(deliveryInfo, cartItems) {
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    try {
        // Disable submit button
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="btn-spinner"></span> Processing...';

        // Show progress
        showCheckoutProgress('Creating order...');

        // Create order and payment intent
        const orderResult = await stripeCheckout.createOrder(deliveryInfo, cartItems);
        
        if (!orderResult.success) {
            throw new Error('Failed to create order');
        }

        // Update progress
        showCheckoutProgress('Processing payment...');

        // Process payment with Stripe
        const paymentResult = await stripeCheckout.processPayment(deliveryInfo);

        if (paymentResult.success) {
            // Payment successful
            showCheckoutProgress('Payment successful! Redirecting...');
            
            // Clear cart immediately to prevent flash of empty cart
            localStorage.removeItem('hometownCart');
            
            // Add full-screen overlay to prevent seeing page during redirect
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:99999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = '<div style="text-align:center"><div class="loading-spinner" style="margin:0 auto 20px"></div><p style="font-size:18px;color:#10b981">✓ Payment successful! Redirecting...</p></div>';
            document.body.appendChild(overlay);
            
            // Redirect to success page immediately
            stripeCheckout.redirectToSuccess(
                paymentResult.paymentIntentId,
                paymentResult.orderId
            );
        } else {
            // Payment failed
            throw new Error(paymentResult.error || 'Payment failed');
        }

    } catch (error) {
        console.error('Card payment error:', error);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        
        // Hide progress
        hideCheckoutProgress();
        
        // Show error
        stripeCheckout.handleError(error.message || 'Payment processing failed. Please try again.');
        
        // Scroll to error message
        document.getElementById('card-errors').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

/**
 * Process cash or check order (traditional flow)
 */
async function processCashOrCheckOrder(deliveryInfo, cartItems, paymentMethod) {
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    try {
        // Disable submit button
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="btn-spinner"></span> Placing Order...';

        // Calculate total
        const total = cartItems.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );

        // Create order - match backend expected format
        const orderData = {
            customerInfo: {
                name: deliveryInfo.name,
                phone: deliveryInfo.phone,
                email: deliveryInfo.email,
                address: `${deliveryInfo.street}, ${deliveryInfo.city}, ${deliveryInfo.state} ${deliveryInfo.zip}`.trim()
            },
            items: cartItems.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity
            })),
            delivery: {
                timePreference: 'asap',
                instructions: deliveryInfo.instructions || ''
            },
            payment: {
                method: paymentMethod
            },
            notes: deliveryInfo.instructions || ''
        };

        const response = await api.post('/orders', orderData);

        if (response.success) {
            // Clear cart immediately
            localStorage.removeItem('hometownCart');
            if (typeof updateCartDisplay === 'function') {
                updateCartDisplay();
            }

            // Show success message
            toast.success('Your order has been placed!', 'Success');
            
            // Add full-screen overlay to prevent seeing page during redirect
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:99999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = '<div style="text-align:center"><div class="loading-spinner" style="margin:0 auto 20px"></div><p style="font-size:18px;color:#10b981;font-weight:600">✓ Order placed! Redirecting...</p></div>';
            document.body.appendChild(overlay);

            // Redirect to order confirmation page
            setTimeout(() => {
                window.location.href = `order-confirmation.html?order_id=${response.order._id}&payment_method=${paymentMethod}`;
            }, 1000);
        } else {
            throw new Error(response.message || 'Failed to place order');
        }

    } catch (error) {
        console.error('Order placement error:', error);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        
        toast.error(error.message || 'Failed to place order. Please try again.', 'Error');
    }
}

/**
 * Show checkout progress message
 */
function showCheckoutProgress(message) {
    const progressDiv = document.getElementById('checkout-progress');
    progressDiv.innerHTML = `
        <div class="checkout-progress-message">
            <div class="progress-spinner"></div>
            <span>${message}</span>
        </div>
    `;
    progressDiv.style.display = 'block';
}

/**
 * Hide checkout progress
 */
function hideCheckoutProgress() {
    const progressDiv = document.getElementById('checkout-progress');
    progressDiv.style.display = 'none';
    progressDiv.innerHTML = '';
}
