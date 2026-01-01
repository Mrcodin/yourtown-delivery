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
        email: email || '', // Ensure empty string if no email
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
        // Disable submit button and show processing state
        submitButton.disabled = true;
        submitButton.innerHTML = '⏳ Processing Payment...';

        // Create order and payment intent
        const orderResult = await stripeCheckout.createOrder(deliveryInfo, cartItems);
        
        if (!orderResult.success) {
            throw new Error('Failed to create order');
        }

        // Process payment with Stripe
        const paymentResult = await stripeCheckout.processPayment(deliveryInfo);

        if (paymentResult.success) {
            // Clear cart immediately
            localStorage.removeItem('hometownCart');
            
            // Show professional success state on button
            submitButton.innerHTML = '✓ Payment Successful!';
            submitButton.style.background = '#10b981';
            
            // Add clean full-screen overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:99999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = '<div style="text-align:center"><div class="loading-spinner" style="margin:0 auto 20px;width:48px;height:48px"></div><p style="font-size:20px;color:#10b981;font-weight:600;margin:0">✓ Payment Successful!</p><p style="font-size:16px;color:#6b7280;margin-top:8px">Redirecting to confirmation...</p></div>';
            document.body.appendChild(overlay);
            
            // Add small delay to show success state before redirect
            setTimeout(() => {
                stripeCheckout.redirectToSuccess(
                    paymentResult.paymentIntentId,
                    paymentResult.orderId
                );
            }, 800);
        } else {
            // Payment failed
            throw new Error(paymentResult.error || 'Payment failed');
        }

    } catch (error) {
        console.error('Card payment error:', error);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        
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
        
        // Get tip amount
        const tip = parseFloat(document.getElementById('custom-tip')?.value || 0) || 0;

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
            notes: deliveryInfo.instructions || '',
            tip: tip
        };
        
        // Add promo code if available
        const validatedPromo = getValidatedPromoCode();
        if (validatedPromo) {
            orderData.promoCode = {
                code: validatedPromo.code,
                discount: validatedPromo.discount,
                promoCodeId: validatedPromo.promoCodeId
            };
        }

        const response = await api.post('/orders', orderData);

        if (response.success) {
            // Clear cart immediately
            localStorage.removeItem('hometownCart');
            if (typeof updateCartDisplay === 'function') {
                updateCartDisplay();
            }
            
            // Show success state on button
            submitButton.innerHTML = '✓ Order Placed!';
            submitButton.style.background = '#10b981';

            // Add clean full-screen overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:99999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = '<div style="text-align:center"><div class="loading-spinner" style="margin:0 auto 20px;width:48px;height:48px"></div><p style="font-size:20px;color:#10b981;font-weight:600;margin:0">✓ Order Placed!</p><p style="font-size:16px;color:#6b7280;margin-top:8px">Redirecting to confirmation...</p></div>';
            document.body.appendChild(overlay);

            // Redirect to order confirmation page
            setTimeout(() => {
                window.location.href = `order-confirmation.html?order_id=${response.order._id}&payment_method=${paymentMethod}`;
            }, 800);
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

// ===========================
// PROMO CODE FUNCTIONALITY
// ===========================

// Store validated promo code
let validatedPromoCode = null;

/**
 * Trigger confetti animation for successful promo code
 */
function triggerConfetti() {
    // Create confetti container
    const confettiContainer = document.createElement('div');
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
    `;
    document.body.appendChild(confettiContainer);
    
    // Create confetti pieces
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -10px;
            left: ${Math.random() * 100}%;
            opacity: 1;
            transform: rotate(${Math.random() * 360}deg);
        `;
        confettiContainer.appendChild(confetti);
        
        // Animate
        const duration = 2000 + Math.random() * 1000;
        const fallDistance = window.innerHeight + 20;
        const rotation = Math.random() * 720 - 360;
        
        confetti.animate([
            { 
                transform: `translateY(0) rotate(0deg)`,
                opacity: 1
            },
            { 
                transform: `translateY(${fallDistance}px) rotate(${rotation}deg)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
    }
    
    // Remove container after animation
    setTimeout(() => {
        document.body.removeChild(confettiContainer);
    }, 3500);
}

/**
 * Apply and validate promo code
 */
async function applyPromoCode() {
    const promoInput = document.getElementById('promo-code-input');
    const promoMessage = document.getElementById('promo-message');
    const applyButton = document.getElementById('apply-promo-btn');
    const discountRow = document.getElementById('discount-row');
    
    const code = promoInput.value.trim().toUpperCase();
    
    // Clear previous messages
    promoMessage.innerHTML = '';
    promoMessage.style.color = '';
    
    if (!code) {
        promoMessage.style.color = '#ef4444';
        promoMessage.innerHTML = '⚠️ Please enter a promo code';
        return;
    }
    
    // Disable button during validation
    applyButton.disabled = true;
    applyButton.innerHTML = '⏳ Validating...';
    
    try {
        // Get current cart total for validation
        const cartItems = getCart();
        const subtotal = cartItems.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );
        const deliveryFee = 6.99;
        // Promo codes apply only to subtotal (groceries), not delivery/tip/tax
        const orderAmount = subtotal;
        
        // Get customer ID if logged in
        const customerId = localStorage.getItem('customerId') || null;
        
        // Validate promo code with backend
        const response = await api.post('/promo-codes/validate', {
            code: code,
            customerId: customerId,
            orderAmount: orderAmount
        });
        
        console.log('Promo code response:', response); // Debug log
        
        // Check if promo code is valid (API returns success: true, not valid: true)
        if (response.success && response.promoCode && response.discount !== undefined) {
            // Store validated promo code
            validatedPromoCode = {
                code: response.promoCode.code,
                discount: response.discount,
                promoCodeId: response.promoCode._id,
                discountType: response.promoCode.discountType,
                discountValue: response.promoCode.discountValue
            };
            
            // Show success message with celebration
            promoMessage.style.color = '#10b981';
            promoMessage.style.fontWeight = '600';
            promoMessage.innerHTML = `🎉 Success! Code applied - You're saving $${response.discount.toFixed(2)}!`;
            
            // Show discount in order summary with percentage/fixed info
            document.getElementById('discount-code').textContent = response.promoCode.code;
            document.getElementById('summary-discount').textContent = response.discount.toFixed(2);
            
            // Show discount percentage or fixed amount
            const discountPercentageEl = document.getElementById('discount-percentage');
            if (response.promoCode.discountType === 'percentage') {
                discountPercentageEl.textContent = `${response.promoCode.discountValue}% OFF`;
            } else {
                discountPercentageEl.textContent = `$${response.promoCode.discountValue} OFF`;
            }
            
            // Show the discount box
            discountRow.style.display = 'block';
            
            // Trigger confetti animation
            triggerConfetti();
            
            // Update total to show discount
            updateOrderSummary();
            
            // Disable input and button after successful application
            promoInput.disabled = true;
            applyButton.innerHTML = '✓ Applied';
            
        } else {
            // Show error message
            validatedPromoCode = null;
            discountRow.style.display = 'none';
            promoMessage.style.color = '#ef4444';
            promoMessage.innerHTML = `❌ ${response.message || 'Invalid promo code'}`;
            updateOrderSummary();
        }
        
    } catch (error) {
        console.error('Promo code validation error:', error);
        validatedPromoCode = null;
        discountRow.style.display = 'none';
        promoMessage.style.color = '#ef4444';
        promoMessage.innerHTML = '⚠️ Failed to validate promo code. Please try again.';
        updateOrderSummary();
    } finally {
        // Re-enable button if validation failed
        if (!validatedPromoCode) {
            applyButton.disabled = false;
            applyButton.innerHTML = 'Apply';
        }
    }
}

/**
 * Remove applied promo code
 */
function removePromoCode() {
    validatedPromoCode = null;
    
    const promoInput = document.getElementById('promo-code-input');
    const promoMessage = document.getElementById('promo-message');
    const applyButton = document.getElementById('apply-promo-btn');
    const discountRow = document.getElementById('discount-row');
    
    // Clear input and messages
    promoInput.value = '';
    promoInput.disabled = false;
    promoMessage.innerHTML = '';
    
    // Reset button
    applyButton.disabled = false;
    applyButton.innerHTML = 'Apply';
    
    // Hide discount row
    discountRow.style.display = 'none';
    
    // Update total
    updateOrderSummary();
}

/**
 * Get validated promo code for order submission
 */
function getValidatedPromoCode() {
    return validatedPromoCode;
}
