# API Integration Testing Guide

## Quick Tests to Verify Integration

### 1. Test Products Loading
**Page:** http://localhost:5500/shop.html

**Expected Behavior:**
1. Products should load from MongoDB API (not hardcoded array)
2. Open browser console (F12)
3. Should see: `✅ Loaded 40 products from API`
4. Products grid should display all groceries

**Test in Console:**
```javascript
// Should return 40 products from API
api.getProducts().then(r => console.log(r))
```

### 2. Test Order Creation
**Page:** http://localhost:5500/cart.html

**Expected Behavior:**
1. Add items to cart
2. Click "Proceed to Checkout"
3. Fill in form:
   - Name: Test Customer
   - Phone: 555-0123
   - Address: 123 Test St
   - Email: test@example.com
4. Click "Place Order"
5. Should see loading state: "⏳ Placing Order..."
6. Success alert with Order ID
7. Redirect to track.html with phone number

**Test in Console:**
```javascript
// Should create order and return order object
api.createOrder({
  customer: {
    name: "Test User",
    phone: "555-0123",
    email: "test@test.com",
    address: "123 Main St"
  },
  items: [
    { product: "PRODUCT_ID_HERE", quantity: 2 }
  ],
  deliveryTime: "ASAP",
  notes: "Test order",
  paymentMethod: "cash"
}).then(r => console.log(r))
```

### 3. Test Order Tracking
**Page:** http://localhost:5500/track.html

**Expected Behavior:**
1. Enter phone number from previous order
2. Click "Track Order"
3. Should load order details from API
4. Status timeline should show current status
5. Socket.io should connect for real-time updates

**Test in Console:**
```javascript
// Should return order info
api.trackOrder("555-0123").then(r => console.log(r))
```

### 4. Test Admin Login
**Page:** http://localhost:5500/admin-login.html

**Expected Behavior:**
1. Enter credentials:
   - Username: `admin`
   - Password: (check seed script output for generated password)
2. Click "Sign In"
3. Should call API and receive JWT token
4. Session stored in localStorage
5. Redirect to admin.html

**Test in Console:**
```javascript
// Should return user object and token
api.login("admin", "YOUR_GENERATED_PASSWORD").then(r => console.log(r))

// Check token
api.getToken() // Should return JWT string
```

### 5. Test Socket.io Connection
**Any Page with Socket.io**

**Test in Console:**
```javascript
// Connect to Socket.io
socketManager.connect()

// Check connection
socketManager.socket.connected // Should be true

// Join tracking room
socketManager.joinTracking("555-0123")

// Listen for events
socketManager.on('order-status-changed', (data) => {
  console.log('Status update:', data)
})
```

## API Endpoints to Test Manually

### Using cURL:

```bash
# 1. Get all products
curl http://localhost:3000/api/products | jq

# 2. Create order (replace PRODUCT_IDS with actual IDs)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Test Customer",
      "phone": "555-9999",
      "email": "test@test.com",
      "address": "123 Test St"
    },
    "items": [
      {"product": "PRODUCT_ID", "quantity": 2}
    ],
    "deliveryTime": "ASAP",
    "notes": "Test order",
    "paymentMethod": "cash"
  }' | jq

# 3. Track order
curl http://localhost:3000/api/orders/track/555-9999 | jq

# 4. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "YOUR_GENERATED_PASSWORD"}' | jq

# 5. Verify token (replace TOKEN with actual JWT)
curl http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer TOKEN" | jq
```

## Expected Console Output

### On Homepage (index.html):
```
Auth: Not an admin page, skipping auth check
Loading products from API...
✅ Loaded 40 products from API
```

### On Shop Page (shop.html):
```
Loading products from API...
✅ Loaded 40 products from API
(Products rendered in grid)
```

### On Checkout (cart.html):
```
(After clicking Place Order)
⏳ Placing Order...
Order created successfully: ORD-XXXXXX
Redirecting to track.html...
```

### On Track Page (track.html):
```
API call to track order: 555-0123
Order found: ORD-XXXXXX
Socket.io connected: true
Joined tracking room: 555-0123
```

### On Admin Login (admin-login.html):
```
Login page loaded
No valid session, showing login form
(After login)
Login successful
Token stored: eyJhbGciOi...
Redirecting to admin.html
```

## Common Issues & Fixes

### Issue: Products not loading
**Fix:** Check backend server is running on port 3000
```bash
curl http://localhost:3000/api/health
```

### Issue: CORS errors
**Fix:** Backend has CORS enabled for http://localhost:5500
Check server logs for CORS errors

### Issue: Socket.io not connecting
**Fix:** Verify Socket.io CDN is loaded
```javascript
console.log(typeof io) // Should be "function"
```

### Issue: Token not persisting
**Fix:** Check localStorage
```javascript
localStorage.getItem('apiToken')
localStorage.getItem('adminSession')
```

### Issue: 401 Unauthorized
**Fix:** Login again to get fresh token
```javascript
api.login("admin", "YOUR_GENERATED_PASSWORD")
```

## Success Criteria ✅

- [ ] Products load from API on shop.html
- [ ] Orders save to MongoDB (not localStorage)
- [ ] Order tracking retrieves from API
- [ ] Admin login uses API authentication
- [ ] Socket.io connects successfully
- [ ] Real-time order updates work
- [ ] JWT tokens stored and sent correctly
- [ ] No localStorage for orders (only cart)

## Network Tab Verification

Open Chrome DevTools → Network Tab:

**Expected API Calls:**
1. `GET /api/products` → 200 OK
2. `POST /api/orders` → 201 Created
3. `GET /api/orders/track/:phone` → 200 OK
4. `POST /api/auth/login` → 200 OK
5. `GET /api/auth/verify` → 200 OK
6. Socket.io connection: `GET /socket.io/?EIO=4&transport=polling` → 200

## Database Verification

Check MongoDB for created data:

```bash
# Connect to MongoDB
mongosh

# Use database
use hometown_delivery

# Check products
db.products.countDocuments() // Should be 40

# Check orders
db.orders.find().pretty()

# Check customers
db.customers.find().pretty()

# Check users
db.users.find().pretty()
```

---

**Last Updated:** 2024-12-28  
**Status:** ✅ Integration Complete
