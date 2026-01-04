# 🧪 Testing Guide - Order Management & Security Features
**Date:** January 1, 2026  
**Features:** Order Cancellation Emails, Rate Limiting, Failed Login Tracking

---

## 🎯 Test Environment Setup

**Prerequisites:**
- ✅ Backend server running on http://localhost:3000
- ✅ Frontend server running on http://localhost:8080
- ✅ MongoDB connected
- ✅ Email service configured (check .env)

**Test Tools:**
- Browser: Chrome/Firefox with DevTools open (Network & Console tabs)
- API Testing: `curl` commands below
- Email: Check configured email inbox

---

## 📧 TEST 1: Order Cancellation Emails

### Test 1.1: Customer Cancels Order
**Goal:** Verify customer receives cancellation email with refund info

**Steps:**
1. **Place a test order with card payment:**
   - Go to http://localhost:8080/shop.html
   - Add items to cart
   - Proceed to checkout
   - Fill in email: `your-test-email@example.com`
   - Complete order with test card: 4242 4242 4242 4242
   - Note the order ID from success page

2. **Cancel the order:**
   - Go to http://localhost:8080/track.html
   - Enter phone number used for order
   - Click "Cancel Order" button
   - Select reason: "Changed my mind"
   - Confirm cancellation

3. **Verify:**
   - ✅ Success message shows "Order cancelled successfully"
   - ✅ Order status changes to "Cancelled"
   - ✅ Check email inbox for cancellation email
   - ✅ Email contains:
     - Order details (ID, date, items)
     - Cancellation reason
     - Refund information (5-7 business days)
     - Order total breakdown
     - Link back to shop

**Expected Email Subject:**  
`Order #ORD-XXXXX Cancelled - Hometown Delivery`

**API Test (Alternative):**
```bash
# Get recent order ID
curl -s http://localhost:3000/api/orders/track/YOUR_PHONE | jq '.[0]._id'

# Cancel order
curl -X PUT http://localhost:3000/api/orders/ORDER_ID/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "YOUR_PHONE",
    "reason": "Testing cancellation email"
  }' | jq .
```

---

### Test 1.2: Admin Cancels Order
**Goal:** Verify admin receives notification when customer cancels order

**Steps:**
1. **Place order as customer** (follow Test 1.1 step 1)
2. **Cancel from customer side** (follow Test 1.1 step 2)
3. **Check admin email** (configured in .env as ADMIN_EMAIL)

**Verify Admin Email Contains:**
- ✅ Customer name and phone
- ✅ Cancellation reason highlighted
- ✅ Order total and payment method
- ✅ Refund notice if card payment
- ✅ Next steps (process refund, update inventory)
- ✅ Link to admin dashboard

**Expected Admin Email Subject:**  
`🚨 Order Cancelled: #ORD-XXXXX - Hometown Delivery`

---

### Test 1.3: Admin Cancels Order from Dashboard
**Goal:** Verify customer receives email when admin cancels

**Steps:**
1. **Login to admin:**
   - Go to http://localhost:8080/admin-login.html
   - Login with admin credentials
   
2. **Cancel order from admin panel:**
   - Go to http://localhost:8080/admin-orders.html
   - Find a recent "Placed" or "Confirmed" order
   - Click "Cancel" button
   - Enter reason: "Out of stock"
   - Confirm cancellation

3. **Verify:**
   - ✅ Customer receives cancellation email
   - ✅ Email shows reason: "Cancelled by store" or admin's reason
   - ✅ Refund info included if applicable

---

## 🔒 TEST 2: Security - Rate Limiting

### Test 2.1: General API Rate Limit (100 req/15min)
**Goal:** Verify API rate limiting works

**API Test:**
```bash
# Make 105 rapid requests (should hit limit at 101)
for i in {1..105}; do
  echo "Request $i:"
  curl -s -w "\nStatus: %{http_code}\n" http://localhost:3000/api/settings | head -5
  sleep 0.1
done | grep -E "(Status:|message)"
```

**Expected:**
- ✅ First 100 requests: Status 200/304
- ✅ Request 101+: Status 429
- ✅ Error message: "Too many requests from this IP, please try again after 15 minutes"
- ✅ Response headers include `RateLimit-*` headers

---

### Test 2.2: Login Rate Limit (5 attempts/15min)
**Goal:** Verify strict auth rate limiting

**Steps:**
1. **Test customer login rate limit:**
```bash
# Try 7 failed logins
for i in {1..7}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/api/customer-auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrongpassword"}' \
    -w "\nStatus: %{http_code}\n\n" | jq .
  sleep 1
done
```

**Expected:**
- ✅ Attempts 1-5: Status 401 "Invalid email or password"
- ✅ Attempt 6+: Status 429 "Too many login attempts from this IP"
- ✅ Error shows: "Please try again after 15 minutes"

2. **Test admin login rate limit:**
```bash
# Try 6 failed admin logins
for i in {1..6}; do
  echo "Admin attempt $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "wrongpass"}' \
    -w "\nStatus: %{http_code}\n\n" | jq .
  sleep 1
done
```

**Expected:** Same as customer login test

---

### Test 2.3: Account Creation Rate Limit (3/hour)
**Goal:** Prevent spam account creation

**API Test:**
```bash
# Try creating 5 accounts
for i in {1..5}; do
  echo "Account creation attempt $i:"
  curl -X POST http://localhost:3000/api/customer-auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test User $i\",
      \"email\": \"testuser$i@example.com\",
      \"phone\": \"555000000$i\",
      \"password\": \"TestPass123!\"
    }" -w "\nStatus: %{http_code}\n\n" | jq .
  sleep 1
done
```

**Expected:**
- ✅ Attempts 1-3: Status 201 (success) or 400 (validation error)
- ✅ Attempt 4+: Status 429 "Too many accounts created from this IP"

---

### Test 2.4: Order Creation Rate Limit (10/hour)
**Goal:** Prevent order spam

**Note:** This is harder to test via API (requires full order data), better to test manually:

**Steps:**
1. Open http://localhost:8080/cart.html
2. Add items and complete checkout 10 times rapidly
3. On 11th attempt, should see rate limit error

**Expected:**
- ✅ First 10 orders succeed
- ✅ 11th order: "Too many orders from this IP. Please try again after an hour"

---

### Test 2.5: Password Reset Rate Limit (3/hour)
**Goal:** Prevent password reset abuse

**API Test:**
```bash
# Try 5 password reset requests
for i in {1..5}; do
  echo "Reset attempt $i:"
  curl -X POST http://localhost:3000/api/customer-auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}' \
    -w "\nStatus: %{http_code}\n\n" | jq .
  sleep 1
done
```

**Expected:**
- ✅ Attempts 1-3: Status 200 (success)
- ✅ Attempt 4+: Status 429 "Too many password reset requests"

---

## 🔐 TEST 3: Failed Login Tracking & Account Lockout

### Test 3.1: Customer Account Lockout
**Goal:** Lock account after 5 failed attempts for 15 minutes

**Steps:**
1. **Make 5 failed login attempts:**
```bash
# Try wrong password 5 times
for i in {1..5}; do
  echo "\n=== Attempt $i ==="
  curl -X POST http://localhost:3000/api/customer-auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "cashmeregrab@gmail.com", "password": "wrongpassword"}' | jq .
  sleep 1
done
```

**Expected Response Evolution:**
- Attempt 1-4: 
  ```json
  {
    "success": false,
    "message": "Invalid email or password",
    "attemptsRemaining": 4, 3, 2, 1
  }
  ```
- Attempt 5:
  ```json
  {
    "success": false,
    "message": "Too many failed login attempts. Account locked for 15 minutes.",
    "remainingTime": 15
  }
  ```

2. **Try correct password while locked:**
```bash
curl -X POST http://localhost:3000/api/customer-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "cashmeregrab@gmail.com", "password": "CORRECT_PASSWORD"}' | jq .
```

**Expected:**
- ✅ Status: 429 (Too Many Requests)
- ✅ Message: "Account temporarily locked. Try again in X minutes."
- ✅ Can't login even with correct password

3. **Successful login resets attempts:**
```bash
# Wait 15 minutes or test with different email
curl -X POST http://localhost:3000/api/customer-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "DIFFERENT_EMAIL", "password": "CORRECT_PASSWORD"}' | jq .
```

**Expected:**
- ✅ Successful login clears failed attempt counter
- ✅ Can immediately attempt login again

---

### Test 3.2: Admin Account Lockout
**Goal:** Same behavior for admin accounts

**API Test:**
```bash
# Try 6 failed admin logins
for i in {1..6}; do
  echo "\n=== Admin attempt $i ==="
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "wrong"}' | jq .
  sleep 1
done
```

**Expected:** Same lockout behavior as customer accounts

---

### Test 3.3: Account Lockout Auto-Unlock
**Goal:** Verify accounts unlock after 15 minutes

**Steps:**
1. Lock an account (follow Test 3.1)
2. Wait 15 minutes (or modify code temporarily for faster testing)
3. Try logging in again

**Expected:**
- ✅ After 15 minutes, can attempt login again
- ✅ Failed attempt counter is reset
- ✅ Fresh 5 attempts available

---

## 🛡️ TEST 4: Security Headers & Protection

### Test 4.1: MongoDB Injection Prevention
**Goal:** Verify NoSQL injection is prevented

**API Test:**
```bash
# Try MongoDB injection in login
curl -X POST http://localhost:3000/api/customer-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$gt": ""},
    "password": {"$gt": ""}
  }' | jq .
```

**Expected:**
- ✅ Status: 400 or 401 (NOT successful login)
- ✅ Attack is sanitized, doesn't bypass authentication

---

### Test 4.2: Security Headers
**Goal:** Verify Helmet security headers are present

**API Test:**
```bash
# Check response headers
curl -I http://localhost:3000/api/settings
```

**Expected Headers:**
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY` or `SAMEORIGIN`
- ✅ `X-XSS-Protection: 0` (deprecated but set)
- ✅ `Strict-Transport-Security: max-age=...` (HSTS)
- ✅ `Content-Security-Policy: ...` (CSP)

---

### Test 4.3: HTTP Parameter Pollution
**Goal:** Verify duplicate parameters are handled

**API Test:**
```bash
# Try duplicate parameters
curl "http://localhost:3000/api/products?category=dairy&category=meat" | jq .
```

**Expected:**
- ✅ Only one category value is used (not both)
- ✅ No unexpected behavior or errors

---

## 📊 TEST 5: Integration Tests

### Test 5.1: Complete Order Flow with Cancellation
**Goal:** Full end-to-end test

**Steps:**
1. ✅ Register new customer account
2. ✅ Login as customer
3. ✅ Browse products
4. ✅ Add items to cart
5. ✅ Apply promo code
6. ✅ Add delivery tip
7. ✅ Complete checkout with card
8. ✅ Receive order confirmation email
9. ✅ Track order
10. ✅ Cancel order
11. ✅ Receive cancellation email with refund info
12. ✅ Admin receives cancellation notification

---

### Test 5.2: Security Integration Test
**Goal:** Test multiple security features together

**Steps:**
1. ✅ Try 3 failed logins (track attempts remaining)
2. ✅ Make 50 API calls (should succeed)
3. ✅ Try creating 2 accounts (should succeed)
4. ✅ Try 2 more failed logins (should lock account)
5. ✅ Verify locked account can't login
6. ✅ Make 51+ more API calls (should hit rate limit)

---

## 🐛 Troubleshooting

### Email Not Sending
**Check:**
- `.env` has correct email credentials
- `EMAIL_USER` and `EMAIL_PASS` set
- Email service is Gmail, SendGrid, or Mailgun
- Run: `cd server && node test-email.js`

### Rate Limiting Not Working
**Check:**
- Server restarted after code changes
- Correct IP address (not behind proxy issues)
- Console logs show rate limit middleware loaded

### Account Lockout Not Working
**Check:**
- Server logs show failed login tracking
- Memory-based tracking (resets on server restart)
- For production, consider Redis-based tracking

---

## ✅ Expected Test Results Summary

| Feature | Test | Expected Result |
|---------|------|-----------------|
| **Cancellation Email** | Customer cancels order | Email with refund info received |
| **Admin Notification** | Customer cancels | Admin receives alert email |
| **Rate Limiting** | 101+ API calls | 429 error after 100 |
| **Auth Rate Limit** | 6+ login attempts | 429 error after 5 |
| **Account Lockout** | 5 failed logins | Account locked for 15min |
| **Lockout Reset** | Successful login | Counter resets to 0 |
| **Auto-unlock** | Wait 15 minutes | Account unlocks automatically |
| **MongoDB Injection** | $gt injection | Attack prevented |
| **Security Headers** | Check headers | Helmet headers present |

---

## 📝 Test Checklist

**Order Management:**
- [ ] Customer cancellation email received
- [ ] Admin notification email received
- [ ] Refund info displayed for card payments
- [ ] Cancellation reason shown in emails
- [ ] Order status updates correctly
- [ ] Cancel button works on track page

**Security - Rate Limiting:**
- [ ] General API rate limit (100/15min) works
- [ ] Auth rate limit (5/15min) works
- [ ] Account creation limit (3/hr) works
- [ ] Password reset limit (3/hr) works
- [ ] Order creation limit (10/hr) works

**Security - Failed Login Tracking:**
- [ ] Failed attempts tracked correctly
- [ ] Attempts remaining shown to user
- [ ] Account locks after 5 attempts
- [ ] Locked account can't login (even with correct password)
- [ ] Account auto-unlocks after 15 minutes
- [ ] Successful login resets counter
- [ ] Works for both customer and admin

**Security - Protection:**
- [ ] MongoDB injection prevented
- [ ] Security headers present (Helmet)
- [ ] Parameter pollution handled
- [ ] Rate limit headers sent to client

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Mark features as production-ready
2. ✅ Update TODOs.txt
3. ✅ Deploy to staging/production
4. ✅ Monitor real-world usage
5. ✅ Set up alerts for rate limit violations

If tests fail:
1. 🐛 Document the failure
2. 🔍 Check server logs
3. 🔧 Fix the issue
4. ♻️ Re-run tests

---

**Happy Testing! 🎉**
