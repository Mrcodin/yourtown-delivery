# Driver Authentication & Dashboard - Complete Guide

## 🚗 Overview

The driver authentication and dashboard system allows delivery drivers to:
- Login with their phone number and password
- View assigned deliveries in real-time
- Mark orders as picked up or delivered
- Track earnings (base pay + tips)
- View delivery history
- Toggle online/offline status

## 📱 Pages

### 1. Driver Login (`driver-login.html`)
- Clean, mobile-optimized login interface
- Phone number and password authentication
- Auto-formatted phone number input
- Password visibility toggle
- Redirects to dashboard on successful login

### 2. Driver Dashboard (`driver-dashboard.html`)
- Real-time stats (active deliveries, completed today, rating, earnings)
- Active deliveries tab with action buttons
- Delivery history tab
- Online/offline status toggle
- Google Maps navigation integration
- Auto-refreshes data every 30 seconds

## 🔐 Authentication

### Login Credentials

All existing drivers have been set up with default passwords:

| Driver Name | Phone | Default Password |
|-------------|-------|------------------|
| Mary Johnson | 555-1234 | mary123 |
| Tom Rodriguez | 555-5678 | tom123 |
| Susan Williams | 555-9012 | susan123 |
| James Brown | 555-3456 | james123 |
| Black BLack | 123456666 | black123 |

**⚠️ IMPORTANT:** Drivers should change their password after first login using the "Change Password" feature (coming soon).

### JWT Token

- Token stored in `localStorage` as `driverToken`
- Token includes driver ID and role: `{ id, role: 'driver' }`
- Token expires after 30 days (configurable in `.env`)

## 🛠️ Backend API Endpoints

### Public Routes

**POST** `/api/driver-auth/login`
```json
{
  "phone": "555-1234",
  "password": "mary123"
}
```
Response:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "driver": {
    "id": "driver_id",
    "firstName": "Mary",
    "lastName": "Johnson",
    "phone": "555-1234",
    "status": "online",
    "rating": 5.0,
    "totalDeliveries": 42,
    "earnings": 356.50,
    "payRate": 4.00
  }
}
```

### Protected Routes (Require Driver Token)

**POST** `/api/driver-auth/logout`
- Sets driver status to offline
- Returns success message

**GET** `/api/driver-auth/me`
- Returns current driver profile

**PUT** `/api/driver-auth/profile`
- Update driver info (firstName, lastName, email, vehicle)

**PUT** `/api/driver-auth/password`
- Change password (requires current password)

**GET** `/api/driver-auth/deliveries`
- Get active assigned deliveries
- Filters: status in ['confirmed', 'shopping', 'delivering']

**GET** `/api/driver-auth/history`
- Get completed deliveries (last 50)
- Includes total earnings calculation

**PUT** `/api/driver-auth/orders/:orderId/status`
```json
{
  "status": "delivering" // or "delivered"
}
```
- Mark order as picked up (delivering) or completed (delivered)
- Auto-updates driver earnings on delivery completion

**PUT** `/api/driver-auth/status`
```json
{
  "status": "online" // or "offline"
}
```

## 💰 Driver Earnings

### Pay Structure
- **Base Pay:** $4.00 per delivery (configurable per driver)
- **Tips:** Customer tips passed directly to driver
- **Total:** Base Pay + Tips

### Example
```
Order with $5.00 tip:
Base Pay: $4.00
Tip:      $5.00
Total:    $9.00
```

### Tracking
- `totalDeliveries`: Incremented when order marked as delivered
- `earnings`: Automatically updated with (payRate + tip)
- Display in dashboard shows real-time totals

## 📊 Order Status Flow

1. **confirmed** → Order assigned to driver
2. **shopping** → Store is preparing order
3. **delivering** → Driver picks up and starts delivery
4. **delivered** → Driver completes delivery

### Driver Actions

| Current Status | Available Action | Updates To |
|----------------|------------------|------------|
| confirmed | Start Delivery | delivering |
| shopping | Start Delivery | delivering |
| delivering | Mark Delivered | delivered |

## 🗺️ Google Maps Integration

When order is in "delivering" status, dashboard shows "Navigate" button:
```html
<a href="https://www.google.com/maps/dir/?api=1&destination=CUSTOMER_ADDRESS">
```

Opens Google Maps with directions to customer address.

## 🔄 Real-Time Updates

Dashboard auto-refreshes every 30 seconds:
- Active deliveries
- Delivery history  
- Driver stats

## 📝 Database Schema Updates

### Driver Model Changes

```javascript
{
  // ... existing fields ...
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false  // Hidden by default for security
  },
  phone: {
    unique: true  // Added unique constraint
  }
}
```

### Methods Added
- `matchPassword(enteredPassword)` - Compare hashed passwords
- `getSignedJwtToken()` - Generate JWT token with role

### Middleware
- Pre-save hook: Auto-hash passwords with bcrypt

## 🚀 Testing the System

### 1. Login as Driver

```bash
# Open driver login page
open driver-login.html

# Or navigate to:
http://localhost:5500/driver-login.html
```

Enter credentials:
- Phone: `555-1234`
- Password: `mary123`

### 2. Test Dashboard Features

1. **View Active Deliveries**
   - Admins need to assign orders to drivers first
   - Orders appear automatically in dashboard

2. **Start Delivery**
   - Click "Start Delivery" button
   - Status updates to "delivering"
   - Driver status changes to "busy"

3. **Navigate**
   - Click "Navigate" button
   - Opens Google Maps with directions

4. **Complete Delivery**
   - Click "Mark Delivered" button
   - Earnings auto-updated
   - Driver status returns to "online"

5. **Check History**
   - Switch to "History" tab
   - View all completed deliveries
   - See earnings per delivery

### 3. Admin Testing

Assign orders to drivers:
```bash
# In admin panel, edit order:
# Set delivery.driverId to driver's MongoDB _id
# Order will appear in driver's dashboard
```

## 🔧 Adding New Drivers

### Via Admin Panel

1. Create driver in admin-drivers.html
2. Run password setup script:

```bash
cd server
node add-driver-passwords.js
```

### Manually

```javascript
const driver = new Driver({
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-9999',
  email: 'john@example.com',
  password: 'secure-password-here',
  payRate: 4.00
});

await driver.save();
// Password will be auto-hashed
```

## 🔒 Security Features

1. **Password Hashing**
   - Bcrypt with 10 salt rounds
   - Never stored in plain text

2. **JWT Authentication**
   - Signed tokens with secret
   - Role-based access (driver role)
   - 30-day expiration

3. **Middleware Protection**
   - `protectDriver` verifies token and driver status
   - Prevents access if driver is inactive

4. **Order Access Control**
   - Drivers can only update their assigned orders
   - 403 error if trying to access others' orders

## 📱 Mobile Optimization

- Responsive design for phone/tablet use
- Large touch-friendly buttons (44x44px minimum)
- Auto-refresh for real-time updates
- Swipeable tabs
- Google Maps integration for navigation

## 🎨 UI Features

- **Status Indicator:** Pulsing green dot when online
- **Color-Coded Status:** Different colors for each order status
- **Earnings Display:** Prominent total with breakdown
- **Empty States:** Helpful messages when no data
- **Loading States:** Smooth transitions during updates

## 🔮 Future Enhancements

- [ ] Change password functionality in dashboard
- [ ] Push notifications for new deliveries
- [ ] Delivery proof photo upload
- [ ] In-app customer calling/texting
- [ ] Earnings reports by date range
- [ ] Route optimization for multiple deliveries
- [ ] Offline mode with sync

## 📞 Support

If drivers have issues:
1. Check phone number format matches database
2. Verify driver status is not "inactive"
3. Check browser console for errors
4. Confirm backend server is running
5. Test with test credentials above

## 🎯 Success Metrics

Track these metrics in analytics:
- Average deliveries per driver per day
- Average delivery completion time
- Driver earnings per hour
- Customer ratings per driver
- On-time delivery percentage

---

**Last Updated:** January 2, 2026  
**Version:** 1.0.0
