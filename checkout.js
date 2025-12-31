// Stripe Checkout Integration
// Handles payment processing for Hometown Delivery

class StripeCheckout {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
        this.clientSecret = null;
        this.orderId = null;
        this.isProcessing = false;
    }

    /**
     * Initialize Stripe with publishable key
     */
    async initialize() {
        try {
            if (!window.Stripe) {
                throw new Error('Stripe.js not loaded');
            }

            if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === 'pk_test_51YOUR_KEY_HERE') {
                console.error('Stripe key not configured. Please add your publishable key to config.js');
                return false;
            }

            this.stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
            console.log('Stripe initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            toast.error('Payment system initialization failed', 'Error');
            return false;
        }
    }

    /**
     * Create Stripe Elements card input
     */
    createCardElement(mountElementId = '#card-element') {
        try {
            this.elements = this.stripe.elements();
            
            const style = {
                base: {
                    color: '#1f2937',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSmoothing: 'antialiased',
                    fontSize: '18px',
                    lineHeight: '24px',
                    '::placeholder': {
                        color: '#9ca3af'
                    }
                },
                invalid: {
                    color: '#ef4444',
                    iconColor: '#ef4444'
                }
            };

            this.cardElement = this.elements.create('card', { 
                style,
                hidePostalCode: false
            });
            
            this.cardElement.mount(mountElementId);

            // Handle realtime validation errors
            this.cardElement.on('change', (event) => {
                const errorElement = document.getElementById('card-errors');
                if (event.error) {
                    errorElement.textContent = event.error.message;
                    errorElement.style.display = 'block';
                } else {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
            });

            console.log('Card element created and mounted');
            return true;
        } catch (error) {
            console.error('Failed to create card element:', error);
            return false;
        }
    }

    /**
     * Create order and payment intent on backend
     */
    async createOrder(deliveryInfo, cartItems) {
        try {
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
                    method: 'card'
                },
                notes: deliveryInfo.instructions || ''
            };

            console.log('Creating order:', orderData);
            const response = await api.post('/orders', orderData);

            if (!response.success) {
                throw new Error(response.message || 'Failed to create order');
            }

            this.orderId = response.order._id;
            console.log('Order created:', this.orderId);

            // Create payment intent
            const paymentResponse = await api.post('/payments/create-intent', {
                orderId: this.orderId,
                amount: total
            });

            if (!paymentResponse.success) {
                throw new Error(paymentResponse.message || 'Failed to create payment');
            }

            this.clientSecret = paymentResponse.clientSecret;
            console.log('Payment intent created');

            return {
                success: true,
                orderId: this.orderId,
                clientSecret: this.clientSecret
            };

        } catch (error) {
            console.error('Order creation error:', error);
            throw error;
        }
    }

    /**
     * Process payment with Stripe
     */
    async processPayment(billingDetails) {
        if (this.isProcessing) {
            return { success: false, message: 'Payment already in progress' };
        }

        this.isProcessing = true;

        try {
            if (!this.clientSecret) {
                throw new Error('Payment not initialized. Please try again.');
            }

            console.log('Processing payment...');

            // Confirm card payment with Stripe
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(
                this.clientSecret,
                {
                    payment_method: {
                        card: this.cardElement,
                        billing_details: {
                            name: billingDetails.name,
                            email: billingDetails.email,
                            phone: billingDetails.phone,
                            address: {
                                line1: billingDetails.street,
                                city: billingDetails.city,
                                state: billingDetails.state,
                                postal_code: billingDetails.zip,
                                country: 'US'
                            }
                        }
                    }
                }
            );

            if (error) {
                // Payment failed
                console.error('Payment error:', error);
                
                // Show user-friendly error message
                let errorMessage = error.message;
                if (error.code === 'card_declined') {
                    errorMessage = 'Your card was declined. Please try a different card.';
                } else if (error.code === 'insufficient_funds') {
                    errorMessage = 'Insufficient funds. Please try a different card.';
                } else if (error.code === 'incorrect_cvc') {
                    errorMessage = 'Incorrect CVC code. Please check and try again.';
                } else if (error.code === 'expired_card') {
                    errorMessage = 'Your card has expired. Please try a different card.';
                }

                this.isProcessing = false;
                return {
                    success: false,
                    error: errorMessage,
                    code: error.code
                };
            }

            // Payment succeeded
            console.log('Payment successful:', paymentIntent.id);

            return {
                success: true,
                paymentIntentId: paymentIntent.id,
                orderId: this.orderId
            };

        } catch (error) {
            console.error('Payment processing error:', error);
            this.isProcessing = false;
            return {
                success: false,
                error: error.message || 'Payment processing failed'
            };
        }
    }

    /**
     * Redirect to success page
     */
    redirectToSuccess(paymentIntentId, orderId) {
        window.location.href = `payment-success.html?payment_intent=${paymentIntentId}&order_id=${orderId}`;
    }

    /**
     * Handle payment errors
     */
    handleError(error) {
        console.error('Payment error:', error);
        toast.error(error, 'Payment Failed');
        
        const errorElement = document.getElementById('card-errors');
        if (errorElement) {
            errorElement.textContent = error;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Reset checkout state
     */
    reset() {
        this.clientSecret = null;
        this.orderId = null;
        this.isProcessing = false;
        
        if (this.cardElement) {
            this.cardElement.clear();
        }
    }
}

// Create global checkout instance
const stripeCheckout = new StripeCheckout();

// Initialize on page load (if Stripe.js is available)
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        if (window.Stripe && typeof STRIPE_PUBLISHABLE_KEY !== 'undefined') {
            stripeCheckout.initialize();
        }
    });
}
