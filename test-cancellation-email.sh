#!/bin/bash

echo "📧 ============================================"
echo "   ORDER CANCELLATION EMAIL TEST"
echo "============================================"
echo ""

# Step 1: Create test customer
echo "1️⃣ Creating test customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/customer-auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Email Test Customer\",
    \"email\": \"emailtest$(date +%s)@test.com\",
    \"phone\": \"555$(date +%s | tail -c 9)\",
    \"password\": \"TestPass123!\",
    \"address\": {
      \"street\": \"123 Test St\",
      \"city\": \"Test City\",
      \"state\": \"TC\",
      \"zipCode\": \"12345\"
    }
  }")

CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | jq -r '.data.customerId // .data._id // .customerId // empty')

if [ -z "$CUSTOMER_ID" ] || [ "$CUSTOMER_ID" = "null" ]; then
  echo "  ❌ Failed to create customer"
  echo "  Response: $CUSTOMER_RESPONSE"
  exit 1
fi

echo "  ✅ Customer created: $CUSTOMER_ID"
echo ""

# Step 2: Get customer token
echo "2️⃣ Logging in customer..."
LOGIN_EMAIL=$(echo "$CUSTOMER_RESPONSE" | jq -r '.data.email // .email // empty')
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/customer-auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$LOGIN_EMAIL\",
    \"password\": \"TestPass123!\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // .data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "  ⚠️  Login failed, trying alternate approach"
  # Try to use the registration token if available
  TOKEN=$(echo "$CUSTOMER_RESPONSE" | jq -r '.token // empty')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "  ❌ No authentication token available"
  exit 1
fi

echo "  ✅ Customer logged in"
echo ""

# Step 3: Get available products
echo "3️⃣ Getting products..."
PRODUCTS_RESPONSE=$(curl -s http://localhost:3000/api/products?isActive=true&limit=2)
PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data[0]._id // empty')

if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
  echo "  ❌ No products available"
  exit 1
fi

echo "  ✅ Product selected: $PRODUCT_ID"
echo ""

# Step 4: Create order with card payment
echo "4️⃣ Creating test order (card payment)..."
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 2,
        \"price\": 15.99
      }
    ],
    \"deliveryAddress\": {
      \"street\": \"456 Cancel Test Ave\",
      \"city\": \"Email City\",
      \"state\": \"EC\",
      \"zipCode\": \"67890\"
    },
    \"paymentMethod\": \"card\",
    \"specialInstructions\": \"Test order for email cancellation\",
    \"tip\": 5.00,
    \"subtotal\": 31.98,
    \"deliveryFee\": 4.99,
    \"total\": 41.97
  }")

ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data._id // .order._id // ._id // empty')

if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
  echo "  ❌ Failed to create order"
  echo "  Response: $ORDER_RESPONSE"
  exit 1
fi

echo "  ✅ Order created: $ORDER_ID"
echo ""

# Step 5: Cancel order (should trigger emails)
echo "5️⃣ Cancelling order (will send emails)..."
CANCEL_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/orders/$ORDER_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reason": "Testing email notification system - please ignore"
  }')

CANCEL_SUCCESS=$(echo "$CANCEL_RESPONSE" | jq -r '.success // false')

if [ "$CANCEL_SUCCESS" = "true" ]; then
  echo "  ✅ Order cancelled successfully"
  echo ""
  echo "📨 EMAIL DETAILS:"
  echo "  Customer Email: $LOGIN_EMAIL"
  echo "  Order ID: $ORDER_ID"
  echo "  Payment Method: card (refund info included)"
  echo "  Cancellation Reason: Testing email system"
  echo ""
  echo "✅ EXPECTED EMAILS:"
  echo "  1. Customer receives: Order cancellation with refund info"
  echo "  2. Admin receives: Cancellation notification"
  echo ""
  echo "💡 Check email logs in server console for delivery status"
else
  echo "  ❌ Cancellation failed"
  echo "  Response: $CANCEL_RESPONSE"
fi

echo ""
echo "============================================"
