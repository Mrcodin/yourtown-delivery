/* ===================================
   CHECKOUT PAGE ENTRY - CODE SPLIT
   Loads payment processing on-demand
   =================================== */

(async function initCheckoutPage() {
    'use strict';

    // Critical path - load cart and form
    const criticalInit = async () => {
        // Wait for dependencies
        while (!window.api || !window.loading) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Show loading state
        window.loading.showOverlay('Loading checkout...');

        // Load cart management
        if (!window.cart) {
            await window.moduleLoader.loadModule('/main.js', 'shopMain');
        }

        // Display cart items
        displayCheckoutItems();

        // Hide loading
        window.loading.hideOverlay();
    };

    // Load payment processor when user interacts with payment section
    const initPaymentProcessing = async () => {
        const paymentRadios = document.querySelectorAll('input[name="payment"]');
        const cardPaymentSection = document.getElementById('card-payment-section');
        
        let stripeLoaded = false;

        paymentRadios.forEach(radio => {
            radio.addEventListener('change', async (e) => {
                if (e.target.value === 'card' && !stripeLoaded) {
                    // Show loading in card section
                    cardPaymentSection.style.display = 'block';
                    cardPaymentSection.innerHTML = `
                        <div class="loading-spinner" style="margin: 20px auto;">
                            <div class="spinner"></div>
                            <p>Loading payment processor...</p>
                        </div>
                    `;

                    try {
                        // Load Stripe module dynamically
                        await window.LazyFeatures.loadStripePayment();
                        stripeLoaded = true;

                        // Restore card element container
                        cardPaymentSection.innerHTML = `
                            <div id="card-element" class="card-element"></div>
                            <div id="card-errors" role="alert" style="color: red; margin-top: 10px;"></div>
                        `;

                        // Initialize Stripe Elements
                        if (window.stripeCheckout) {
                            window.stripeCheckout.initialize();
                            window.stripeCheckout.createCardElement('#card-element');
                        }
                    } catch (error) {
                        console.error('Failed to load payment processor:', error);
                        cardPaymentSection.innerHTML = `
                            <div class="error-message" style="color: red; padding: 15px;">
                                <strong>Payment Processor Error</strong>
                                <p>Unable to load card payment. Please use cash on delivery or try again later.</p>
                            </div>
                        `;
                    }
                } else if (e.target.value === 'card') {
                    cardPaymentSection.style.display = 'block';
                } else {
                    cardPaymentSection.style.display = 'none';
                }
            });
        });
    };

    // Display cart items in checkout summary
    function displayCheckoutItems() {
        const cart = window.cart || [];
        const summaryContainer = document.querySelector('.order-summary');
        
        if (!summaryContainer || cart.length === 0) {
            return;
        }

        // Calculate totals
        let subtotal = 0;
        let tax = 0;
        const TAX_RATE = 0.08;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            if (item.isTaxable) {
                tax += itemTotal * TAX_RATE;
            }
        });

        const deliveryFee = subtotal >= 50 ? 0 : 5.99;
        const total = subtotal + tax + deliveryFee;

        // Update summary (if elements exist)
        const subtotalEl = document.getElementById('checkout-subtotal');
        const taxEl = document.getElementById('checkout-tax');
        const deliveryEl = document.getElementById('checkout-delivery');
        const totalEl = document.getElementById('checkout-total');

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
        if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    // Handle form submission
    const initFormHandling = () => {
        const checkoutForm = document.getElementById('checkout-form');
        
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
                
                if (paymentMethod === 'card') {
                    // Ensure Stripe is loaded
                    if (!window.stripeCheckout) {
                        await window.LazyFeatures.loadStripePayment();
                    }
                }

                // Let cart-checkout.js handle the submission
                if (window.handleCheckoutSubmit) {
                    window.handleCheckoutSubmit(e);
                }
            });
        }
    };

    // Execute initialization
    await criticalInit();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initPaymentProcessing();
            initFormHandling();
        });
    } else {
        initPaymentProcessing();
        initFormHandling();
    }
})();
