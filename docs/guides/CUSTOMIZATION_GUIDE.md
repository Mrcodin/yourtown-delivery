# 🎨 Customization Guide

## Overview

This guide explains how to customize the Yourtown Delivery application for your specific business.

## Quick Start

All business information is centralized in **[config.js](config.js)**. Edit this one file to update your:
- Business name
- Location
- Phone number
- Store name
- Business hours
- And more!

## Step-by-Step Customization

### 1. Edit config.js

Open [config.js](config.js) and update the `BUSINESS_CONFIG` object:

```javascript
const BUSINESS_CONFIG = {
    // Business Name
    businessName: 'Hometown Grocery Delivery',    // Change to your business name
    shortName: 'Hometown Delivery',                // Short version
    
    // Location
    townName: 'Springfield',                       // Your town/city
    state: 'Illinois',                             // Your state
    zipCode: '62701',                              // Your zip code
    fullAddress: '123 Main St, Springfield, IL 62701',
    
    // Contact
    phone: '217-555-1234',                         // Your business phone
    phoneDisplay: '(217) 555-1234',                // How to display it
    email: 'orders@yourdelivery.com',              // Your email
    
    // Store Information
    storeName: 'Springfield Market',               // Your partner store
    storePartner: 'Springfield Fresh Foods',
    
    // Business Hours
    hours: {
        weekday: {
            display: 'Mon-Fri 7am-8pm',            // Update your hours
            detailed: 'Monday - Friday: 7am - 8pm'
        },
        saturday: {
            display: 'Sat 8am-6pm',
            detailed: 'Saturday: 8am - 6pm'
        },
        sunday: {
            display: 'Sun 9am-5pm',                // Or 'Closed'
            detailed: 'Sunday: 9am - 5pm'
        },
        full: 'Mon-Fri 7am-8pm, Sat 8am-6pm, Sun 9am-5pm'
    },
    
    // Service Details
    deliveryFee: 6.99,                             // Your delivery fee
    minimumOrder: 25.00,                           // Minimum order amount
    averageDeliveryTime: '90 minutes',             // Typical delivery time
    deliveryRadius: '15 miles',                    // Service area
    
    // Social Media (optional)
    social: {
        facebook: 'https://facebook.com/yourpage',
        instagram: 'https://instagram.com/yourpage',
        twitter: 'https://twitter.com/yourhandle'
    }
};
```

### 2. Test Your Changes

1. **Open any page** in your browser
2. The configuration script automatically replaces all placeholders
3. All pages will show your business information

### 3. Verify Updates

Check these pages to ensure everything updated:
- ✅ [index.html](index.html) - Homepage hero and contact info
- ✅ [about.html](about.html) - Multiple phone number references
- ✅ [shop.html](shop.html) - Store name
- ✅ [track.html](track.html) - Contact information
- ✅ [cart.html](cart.html) - Business hours

## What Gets Updated Automatically

### Text Content
- `[YOUR TOWN]` → Your town name
- `[LOCAL STORE NAME]` → Your store name
- `555-123-4567` → Your phone number
- `Mon-Fri 8am-6pm` → Your business hours
- `Hometown Delivery` → Your business name

### Links
- All `tel:555-123-4567` links → Your phone number
- Email addresses
- Social media links (if configured)

### Dynamic Content
- Homepage statistics (loaded from database)
- Total deliveries
- Active drivers
- Average rating
- Average delivery time

## API Configuration

The [config.js](config.js) file also manages API endpoints:

```javascript
const API_CONFIG = {
    // Automatically detects localhost vs production
    baseURL: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://your-api.onrender.com',  // Update with your API URL
};
```

### Update for Production:

1. Deploy your backend to Render/Heroku
2. Update the production URL in [config.js](config.js)
3. Commit and deploy frontend

## Advanced Customization

### Custom Placeholders

To add your own placeholders in [page-config.js](page-config.js):

```javascript
const placeholders = {
    '[YOUR TOWN]': BUSINESS_CONFIG.townName,
    '[YOUR CUSTOM]': 'Your Custom Value',  // Add your own
    // ... more placeholders
};
```

### Disable Dynamic Stats

If you want static stats (not from database), comment out in [page-config.js](page-config.js):

```javascript
// Comment this line to use static values
// loadDynamicStats();
```

### Custom Features

Update the features in [config.js](config.js):

```javascript
features: [
    'Same Day Delivery',
    'Cash Accepted',
    'Contactless Delivery',  // Add your features
    'Senior Discounts'
]
```

## Environment Variables

For server-side configuration, edit [server/.env](server/.env):

```env
# Business Settings (not exposed to frontend)
BUSINESS_NAME=Your Business Name
CONTACT_EMAIL=orders@yourbusiness.com
SUPPORT_PHONE=555-123-4567
```

## Testing Checklist

After customization, verify:

- [ ] Business name appears correctly on all pages
- [ ] Phone numbers are clickable and correct
- [ ] Business hours are accurate
- [ ] Location/address is correct
- [ ] Store name appears on shop page
- [ ] All `[YOUR TOWN]` placeholders replaced
- [ ] All `[LOCAL STORE NAME]` placeholders replaced
- [ ] No `555-123-4567` numbers remain
- [ ] Homepage stats load dynamically
- [ ] API endpoints work correctly

## Quick Test Commands

```bash
# Search for remaining placeholders
grep -r "\[YOUR TOWN\]" *.html
grep -r "\[LOCAL STORE NAME\]" *.html
grep -r "555-123-4567" *.html

# Should return no results if all replaced
```

## Browser Testing

Test your customizations:

```bash
# Start a local server
python3 -m http.server 8000

# Open in browser
# http://localhost:8000/index.html
```

Check browser console for any errors with:
- F12 (Developer Tools)
- Console tab
- Look for "BUSINESS_CONFIG" loaded successfully

## Common Issues

### Placeholders Not Replaced

**Problem:** Text still shows `[YOUR TOWN]`

**Solution:** 
1. Verify [config.js](config.js) is loaded before [page-config.js](page-config.js)
2. Check browser console for errors
3. Make sure scripts are in correct order:
   ```html
   <script src="config.js"></script>
   <script src="page-config.js"></script>
   ```

### Phone Links Not Working

**Problem:** Phone numbers not clickable

**Solution:**
1. Verify format in [config.js](config.js): `phone: '555-123-4567'`
2. Check that format matches exactly (including dashes)

### Stats Not Loading

**Problem:** Homepage stats show "Loading..." or defaults

**Solution:**
1. Check API is running: `http://localhost:3000/api/stats/dashboard`
2. Verify CORS settings in server
3. Check browser console for API errors

## Production Deployment

### Before Deploying:

1. ✅ Update all business information in [config.js](config.js)
2. ✅ Update production API URL in [config.js](config.js)
3. ✅ Test all pages locally
4. ✅ Verify no placeholder text remains
5. ✅ Check all phone links work
6. ✅ Confirm business hours are correct

### After Deploying:

1. ✅ Test live site
2. ✅ Verify API connectivity
3. ✅ Check dynamic stats load
4. ✅ Test on mobile devices
5. ✅ Verify all contact information

## Support

Need help customizing?

1. Check [README.md](README.md) for general setup
2. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for hosting
3. See [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md) for advanced features

## Examples

### Example 1: Local Grocery Store

```javascript
businessName: 'Valley Fresh Delivery',
townName: 'Green Valley',
phone: '415-555-0100',
storeName: 'Valley Fresh Market'
```

### Example 2: Multiple Town Service

```javascript
businessName: 'Regional Grocery Delivery',
townName: 'Bay Area',
deliveryRadius: '25 miles',
storeName: 'Multiple Partner Stores'
```

### Example 3: Senior-Focused Service

```javascript
businessName: 'Senior Helper Delivery',
features: [
    'Senior Discounts',
    'Personal Service',
    'Phone Orders Welcome',
    'No App Required'
]
```

---

**Last Updated:** December 29, 2025
