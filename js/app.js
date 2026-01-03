/* ===================================
   MAIN MODULE
   Entry point - loads all modules
   Version 5.0 - Modular Architecture
   =================================== */

// Initialize application
(function () {
    'use strict';

    // Load products on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

    function initApp() {
        // Load cart
        loadCart();

        // Render grocery grid if on shop page
        if (document.getElementById('grocery-grid')) {
            renderGroceryGrid();
        }

        // Attach checkout handler ONLY if cart-checkout.js is not loaded
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm && typeof handleCheckoutSubmit === 'undefined') {
            checkoutForm.addEventListener('submit', handleCheckout);
        }

        // Load accessibility preferences
        if (localStorage.getItem('largeText') === 'true') {
            document.body.classList.add('large-text');
            const btn = document.getElementById('text-size-btn');
            if (btn) btn.textContent = '🔤 Normal Text';
        }

        if (localStorage.getItem('highContrast') === 'true') {
            document.body.classList.add('high-contrast');
        }

        // Setup cancel modal event listeners
        const cancelReasonSelect = document.getElementById('cancel-reason');
        if (cancelReasonSelect) {
            cancelReasonSelect.addEventListener('change', function () {
                const otherContainer = document.getElementById('other-reason-container');
                if (this.value === 'other') {
                    otherContainer.style.display = 'block';
                } else {
                    otherContainer.style.display = 'none';
                }
            });
        }

        // Setup search autocomplete on shop page
        if (document.getElementById('search-input') && groceries.length === 0) {
            setTimeout(() => {
                if (groceries.length > 0) {
                    setupSearchAutocomplete();
                }
            }, 1000);
        } else if (document.getElementById('search-input')) {
            setupSearchAutocomplete();
        }
    }
})();
