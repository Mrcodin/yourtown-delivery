/**
 * Business Configuration
 * Customize these values for your specific business
 * NOTE: These are default values. Actual values are loaded from the database via API.
 * Admins can update these through the Settings page in the admin dashboard.
 */

// Default configuration (fallback if API fails)
const DEFAULT_CONFIG = {
    // Business Name
    businessName: 'Hometown Grocery Delivery',
    shortName: 'Hometown Delivery',

    // Location
    townName: 'Your Town',
    state: 'State',
    zipCode: '12345',
    fullAddress: '123 Main Street, Your Town, State 12345',

    // Contact
    phone: '555-123-4567',
    phoneDisplay: '555-123-4567',
    email: 'info@hometowndelivery.com',

    // Store Information
    storeName: 'Local Market',
    storePartner: 'Your Local Grocery Store',

    // Business Hours
    hours: {
        weekday: {
            display: 'Mon-Fri 8am-6pm',
            detailed: 'Monday - Friday: 8am - 6pm',
        },
        saturday: {
            display: 'Sat 9am-3pm',
            detailed: 'Saturday: 9am - 3pm',
        },
        sunday: {
            display: 'Closed',
            detailed: 'Sunday: Closed',
        },
        full: 'Mon-Fri 8am-6pm, Sat 9am-3pm',
    },

    // Service Details
    deliveryFee: 5.0,
    minimumOrder: 20.0,
    averageDeliveryTime: '2 hours',
    deliveryRadius: '10 miles',

    // Social Media (optional - leave empty if not used)
    social: {
        facebook: '',
        instagram: '',
        twitter: '',
    },

    // Features/Benefits
    features: ['Same Day Delivery', 'Cash Accepted', 'Local Drivers', 'Senior Friendly'],
};

// Active configuration (will be loaded from API)
let BUSINESS_CONFIG = { ...DEFAULT_CONFIG };

// Load configuration from API
async function loadBusinessConfig() {
    try {
        // Get base URL from API_CONFIG if available, otherwise construct it
        const baseURL =
            typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL
                ? API_CONFIG.BASE_URL.replace('/api', '')
                : window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1'
                  ? 'http://localhost:3000'
                  : 'https://yourtown-delivery-api.onrender.com';

        const response = await fetch(`${baseURL}/api/settings`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                // Update BUSINESS_CONFIG with data from database
                BUSINESS_CONFIG = {
                    ...DEFAULT_CONFIG,
                    ...data.data,
                    // Ensure nested objects are properly merged
                    hours: { ...DEFAULT_CONFIG.hours, ...data.data.hours },
                    social: { ...DEFAULT_CONFIG.social, ...data.data.social },
                };
                // console.log('✅ Business configuration loaded from database');

                // Trigger event for page-config.js to re-run replacements
                document.dispatchEvent(
                    new CustomEvent('configLoaded', { detail: BUSINESS_CONFIG })
                );
                return BUSINESS_CONFIG;
            }
        }
    } catch (error) {
        // console.log('Using default configuration (API not available)');
    }
    return DEFAULT_CONFIG;
}

// Stripe Configuration
// ⚠️ This is your PUBLISHABLE key - safe to expose in frontend
// Get this from: https://dashboard.stripe.com/apikeys
// IMPORTANT: Use TEST key (pk_test_) for development, LIVE key (pk_live_) for production
const STRIPE_PUBLISHABLE_KEY =
    'pk_test_51SkVBm1Q8OjRkTazELvM1TurrRUst2NtCpCx8zwAVWvAjWTcSwlF9bpR10TGsLY8JB2t5qIVViKfgPvNRI6dAs2V00gOFXqrNQ';

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BUSINESS_CONFIG,
        DEFAULT_CONFIG,
        loadBusinessConfig,
        STRIPE_PUBLISHABLE_KEY,
    };
}
