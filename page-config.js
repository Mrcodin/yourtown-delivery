/**
 * Page Configuration Loader
 * Automatically replaces placeholders with actual business information
 */

(function () {
    'use strict';

    // Wait for DOM and config to load
    if (typeof BUSINESS_CONFIG === 'undefined') {
        // console.warn('BUSINESS_CONFIG not loaded. Make sure config.js is included before this script.');
        return;
    }

    /**
     * Replace text content in the page
     */
    function replacePlaceholders() {
        const placeholders = {
            '[YOUR TOWN]': BUSINESS_CONFIG.townName,
            '[LOCAL STORE NAME]': BUSINESS_CONFIG.storeName,
            '555-123-4567': BUSINESS_CONFIG.phone,
            'Mon-Fri 8am-6pm, Sat 9am-3pm': BUSINESS_CONFIG.hours.full,
            'Mon-Fri 8am-6pm': BUSINESS_CONFIG.hours.weekday.display,
            'Monday - Friday: 8am - 6pm': BUSINESS_CONFIG.hours.weekday.detailed,
            'Sat 9am-3pm': BUSINESS_CONFIG.hours.saturday.display,
            'Saturday: 9am - 3pm': BUSINESS_CONFIG.hours.saturday.detailed,
            '[YOUR TOWN], State 12345': `${BUSINESS_CONFIG.townName}, ${BUSINESS_CONFIG.state} ${BUSINESS_CONFIG.zipCode}`,
            'Hometown Delivery': BUSINESS_CONFIG.shortName,
            'Hometown Grocery Delivery': BUSINESS_CONFIG.businessName,
        };

        // Walk through all text nodes and replace
        function replaceInNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                let text = node.textContent;
                let replaced = false;

                for (const [placeholder, value] of Object.entries(placeholders)) {
                    if (text.includes(placeholder)) {
                        text = text.replace(
                            new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                            value
                        );
                        replaced = true;
                    }
                }

                if (replaced) {
                    node.textContent = text;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Handle href attributes for phone links
                if (node.tagName === 'A' && node.getAttribute('href') === 'tel:555-123-4567') {
                    node.setAttribute('href', `tel:${BUSINESS_CONFIG.phone}`);
                }

                // Handle placeholder attributes
                if (node.hasAttribute('placeholder')) {
                    let placeholder = node.getAttribute('placeholder');
                    for (const [search, replace] of Object.entries(placeholders)) {
                        placeholder = placeholder.replace(search, replace);
                    }
                    node.setAttribute('placeholder', placeholder);
                }

                // Recurse through children
                for (let child of node.childNodes) {
                    replaceInNode(child);
                }
            }
        }

        // Start replacement from body
        replaceInNode(document.body);

        // Also update title if it contains placeholders
        for (const [placeholder, value] of Object.entries(placeholders)) {
            if (document.title.includes(placeholder)) {
                document.title = document.title.replace(new RegExp(placeholder, 'g'), value);
            }
        }
    }

    /**
     * Update page title with business name
     */
    function updatePageTitle() {
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.textContent.includes('Hometown')) {
            const newTitle = titleElement.textContent.replace(
                'Hometown Grocery Delivery',
                BUSINESS_CONFIG.businessName
            );
            titleElement.textContent = newTitle;
        }
    }

    /**
     * Load dynamic stats from API
     */
    async function loadDynamicStats() {
        const statsGrid = document.querySelector('.stats-grid');
        if (!statsGrid) return; // Not on homepage

        try {
            const baseURL =
                typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL
                    ? API_CONFIG.BASE_URL.replace('/api', '')
                    : 'http://localhost:3000';
            const response = await fetch(`${baseURL}/api/stats/dashboard`);
            if (!response.ok) throw new Error('Failed to load stats');

            const data = await response.json();

            // Update stats if we got data
            if (data && data.success) {
                const stats = data.data;

                // Find and update stat cards
                const statCards = statsGrid.querySelectorAll('.stat-card');

                if (stats.totalOrders && statCards[0]) {
                    statCards[0].querySelector('.stat-number').textContent =
                        stats.totalOrders + '+';
                }

                if (stats.activeDrivers && statCards[1]) {
                    statCards[1].querySelector('.stat-number').textContent = stats.activeDrivers;
                }

                if (stats.avgRating && statCards[2]) {
                    statCards[2].querySelector('.stat-number').textContent = stats.avgRating + '★';
                }

                if (stats.avgDeliveryTime && statCards[3]) {
                    const hours = Math.round(stats.avgDeliveryTime / 60);
                    statCards[3].querySelector('.stat-number').textContent = hours + ' hrs';
                }
            }
        } catch (error) {
            // console.log('Using static stats (API not available)');
            // Keep static values if API fails
        }
    }

    /**
     * Initialize configuration
     */
    async function init() {
        // Load configuration from API first
        await loadBusinessConfig();

        // Replace placeholders
        replacePlaceholders();
        updatePageTitle();

        // Load dynamic stats if on homepage
        if (document.querySelector('.stats-grid')) {
            loadDynamicStats();
        }

        // Listen for configuration updates
        document.addEventListener('configLoaded', function () {
            replacePlaceholders();
            updatePageTitle();
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
