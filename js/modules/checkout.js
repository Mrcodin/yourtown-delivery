/* ===================================
   CHECKOUT MODULE
   Handles order placement
   =================================== */

async function handleCheckout(e) {
    e.preventDefault();

    // Check if user is logged in and if email is verified
    if (customerAuth.isLoggedIn() && !customerAuth.isEmailVerified()) {
        message.showError(
            'Please verify your email address before placing an order. Check your inbox for the verification link or go to your account to resend it.',
            'Email Verification Required'
        );
        return;
    }

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const email = document.getElementById('email').value.trim();
    const deliveryTime = document.getElementById('delivery-time').value;
    const notes = document.getElementById('notes').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked');

    // Validate
    if (!name || !phone || !address) {
        message.showError(
            'Please fill in all required fields (name, phone, and address).',
            'Missing Information'
        );
        return;
    }

    if (!paymentMethod) {
        message.showError('Please select a payment method.', 'Payment Method Required');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    loading.buttonLoading(submitBtn, true);

    const progressContainer = document.getElementById('checkout-progress');
    if (progressContainer) {
        progress.createStepProgress(
            progressContainer,
            ['Validating', 'Processing', 'Confirming', 'Complete'],
            0
        );
    }

    try {
        if (progressContainer) {
            progress.updateStepProgress(progressContainer, 0);
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        if (progressContainer) {
            progress.updateStepProgress(progressContainer, 1);
        }

        const orderData = {
            customerInfo: {
                name,
                phone,
                email,
                address,
            },
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
            })),
            delivery: {
                timePreference: deliveryTime,
                instructions: notes,
            },
            payment: {
                method: paymentMethod.value,
            },
            notes,
        };

        const response = await api.createOrder(orderData, { showLoading: false });

        if (progressContainer) {
            progress.updateStepProgress(progressContainer, 2);
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        if (response.success && response.order) {
            const order = response.order;

            if (progressContainer) {
                progress.updateStepProgress(progressContainer, 3);
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            message.showSuccess(
                `Your order #${order.orderId} has been placed successfully! Total: $${order.pricing.total.toFixed(2)}. We'll call ${phone} within 30 minutes to confirm.`,
                'Order Placed! 🎉',
                null,
                8000
            );

            cart = [];
            saveCart();

            setTimeout(() => {
                window.location.href = `track.html?phone=${encodeURIComponent(phone)}`;
            }, 2000);
        } else {
            throw new Error(response.message || 'Failed to place order');
        }
    } catch (error) {
        console.error('Checkout error:', error);

        if (progressContainer) {
            progressContainer.innerHTML = '';
        }

        let errorMessage = 'Something went wrong. Please try again.';
        if (error.message && error.message !== 'Failed to place order') {
            errorMessage = error.message;
        }

        message.showError(errorMessage, 'Order Failed');
        loading.buttonLoading(submitBtn, false);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { handleCheckout };
}
