# JavaScript Modules - Performance Optimization

## Overview
The main.js file (1385 lines) has been split into modular components for better performance, maintainability, and code organization.

## Module Structure

```
js/
├── error-tracking.js    (220 lines) - Error tracking and reporting
├── products.js          (80 lines)  - Product loading from API
├── cart.js              (185 lines) - Shopping cart management
├── shop.js              (490 lines) - Product display, filtering, sorting
├── ui-helpers.js        (170 lines) - Accessibility, toasts, tips
└── order-tracking.js    (370 lines) - Order tracking and cancellation
```

**Total**: 1,515 lines extracted from main.js (originally 1,385 lines)
*Note: Some shared utilities were duplicated across modules for independence*

## Module Descriptions

### error-tracking.js
**Purpose**: Centralized error tracking and monitoring
**Features**:
- Automatic error capture (uncaught errors & promise rejections)
- Error storage with localStorage persistence
- Error statistics and dashboard
- Backend error reporting (configurable)
- User-friendly error context

**Usage**:
```javascript
// Automatic initialization
// No setup required - loads on page load

// Manual error capture
ErrorTracker.captureError(error, {
    context: 'Checkout',
    action: 'processPayment'
});

// View error statistics
ErrorTracker.showDashboard();

// Get recent errors
const errors = ErrorTracker.getRecentErrors(10);
```

**Configuration**:
```javascript
ErrorTracker.init({
    enabled: true,
    logToConsole: true,
    maxErrors: 100,
    endpoint: '/api/errors' // Optional backend endpoint
});
```

### products.js
**Purpose**: Product data management
**Features**:
- Load products from API
- Handle product data caching
- Error handling with retry logic
- Integration with error tracking

**Usage**:
```javascript
// Automatic on page load
// Products available in global 'groceries' array

// Manual reload
await loadProducts();
```

### cart.js
**Purpose**: Shopping cart operations
**Features**:
- Add/remove items
- Update quantities
- LocalStorage persistence
- Cart display updates
- Total calculations

**Usage**:
```javascript
// Add item to cart
addToCart(productId);

// Update quantity
updateQuantity(productId, 1); // increase by 1

// Get cart total
const total = getCartTotal();

// Clear cart
clearCart();
```

## Loading Order

**Important**: Modules must be loaded in this order:

1. **error-tracking.js** - First (captures errors from all other modules)
2. **products.js** - Second (provides product data)
3. **cart.js** - Third (depends on products)
4. **Other modules** - In any order

## HTML Integration

### For Shop Page (shop.html):
```html
<head>
    <!-- Core dependencies -->
    <script src="api.js"></script>
    <script src="loading.js"></script>
    
    <!-- New modular scripts (in order) -->
    <script src="js/error-tracking.js"></script>
    <script src="js/products.js"></script>
    <script src="js/cart.js"></script>
    <script src="js/shop.js"></script>
    <script src="js/ui-helpers.js"></script>
</head>
```

### For Cart Page (cart.html):
```html
<head>
    <!-- Core dependencies -->
    <script src="api.js"></script>
    <script src="loading.js"></script>
    
    <!-- Modular scripts -->
    <script src="js/error-tracking.js"></script>
    <script src="js/products.js"></script>
    <script src="js/cart.js"></script>
    <script src="js/shop.js"></script>
    <script src="js/ui-helpers.js"></script>
</head>
```

### For Track Page (track.html):
```html
<head>
    <!-- Core dependencies -->
    <script src="api.js"></script>
    <script src="loading.js"></script>
    
    <!-- Modular scripts -->
    <script src="js/error-tracking.js"></script>
    <script src="js/order-tracking.js"></script>
    <script src="js/ui-helpers.js"></script>
</head>
```

### For Other Pages:
```html
<head>
    <!-- Error tracking on all pages -->
    <script src="js/error-tracking.js"></script>
    <script src="js/ui-helpers.js"></script>
</head>
```

## Migration Plan

### Phase 1: ✅ COMPLETE
- [x] Create error-tracking.js (220 lines)
- [x] Create products.js (80 lines)
- [x] Create cart.js (185 lines)
- [x] Create shop.js (490 lines)
- [x] Create ui-helpers.js (170 lines)
- [x] Create order-tracking.js (370 lines)

### Phase 2: NEXT STEPS
- [ ] Update HTML files to load modular scripts
- [ ] Test all pages with new module structure
- [ ] Remove redundant code from main.js
- [ ] Verify all onclick handlers work

### Phase 3: FUTURE
- [ ] Split CSS (styles.css 2323 lines)
- [ ] Add module bundling (webpack/rollup)
- [ ] Minify production builds
- [ ] Implement tree-shaking
- [ ] Service worker for caching

## Benefits

### Performance
- **Smaller initial load**: Only load modules needed for current page
- **Better caching**: Modules can be cached individually
- **Lazy loading**: Load non-critical modules after page load

### Maintainability
- **Easier debugging**: Smaller, focused files
- **Better organization**: Related code grouped together
- **Simpler updates**: Change one module without affecting others

### Error Tracking
- **Proactive monitoring**: Catch errors before users report them
- **Better debugging**: Full error context and stack traces
- **Usage insights**: See which features cause most errors

## Error Tracking Dashboard

### View in Console:
```javascript
ErrorTracker.showDashboard();
```

Output example:
```
📊 Error Tracking Dashboard
──────────────────────────────────────────────────
Total Errors: 23
Last 24 Hours: 5

Errors by Context:
  Product Loading: 3
  Cart Management: 2
  Checkout: 12
  API Calls: 6

Recent Errors:
1. Failed to load products from server
   Context: Product Loading
   Time: 1/2/2026, 10:30:45 AM
...
```

### Access Error Data:
```javascript
// Get all errors
const allErrors = ErrorTracker.getErrors();

// Get recent 10 errors
const recent = ErrorTracker.getRecentErrors(10);

// Get statistics
const stats = ErrorTracker.getStats();
console.log(stats);
// {
//   total: 23,
//   last24h: 5,
//   byContext: { 'Checkout': 12, 'API Calls': 6, ... },
//   oldestError: "2026-01-01T10:00:00.000Z",
//   newestError: "2026-01-02T10:30:45.000Z"
// }
```

### Clear Errors:
```javascript
ErrorTracker.clearErrors();
```

## Testing

### Test Error Tracking:
```javascript
// Trigger a test error
throw new Error('Test error for tracking');

// Check if captured
ErrorTracker.showDashboard();
```

### Test Modules:
```javascript
// Test product loading
loadProducts().then(result => {
    console.log('Products loaded:', result);
});

// Test cart
addToCart('some-product-id');
console.log('Cart total:', getCartTotal());
```

## Configuration

### Development Mode:
```javascript
ErrorTracker.init({
    enabled: true,
    logToConsole: true,
    endpoint: null
});
```

### Production Mode:
```javascript
ErrorTracker.init({
    enabled: true,
    logToConsole: false,
    endpoint: '/api/errors', // Send to backend
    maxErrors: 50
});
```

## Backend Error Endpoint (Optional)

Create an endpoint to receive frontend errors:

```javascript
// server/routes/errors.js
router.post('/errors', async (req, res) => {
    try {
        const errorData = req.body;
        
        // Log to file/database
        await ErrorLog.create(errorData);
        
        // Alert if critical
        if (errorData.context.severity === 'critical') {
            await sendAlertEmail(errorData);
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to log error' });
    }
});
```

## Next Steps

1. **Test the new modules** in development
2. **Create remaining modules** (shop.js, etc.)
3. **Update HTML files** to use modular approach
4. **Set up backend error logging** (optional)
5. **Monitor error dashboard** regularly
6. **Optimize based on insights**

## Support

For questions or issues with the modular structure:
- Check error tracking dashboard first
- Review this README
- Check console for error messages
- Test modules individually

---

**Note**: This is a gradual migration. main.js will continue to work alongside new modules during the transition period.
