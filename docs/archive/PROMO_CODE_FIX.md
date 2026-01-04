# Promo Code & Payment Calculation Fix

## Issue Found
Stripe payment amounts were **NOT matching** customer receipts when promo codes were used.

## Root Cause
The promo code discount was calculated on `subtotal + delivery fee` instead of just the `subtotal`. This caused a discrepancy when tips were added later.

**Problem Code (cart-checkout.js line 374):**
```javascript
const orderAmount = subtotal + deliveryFee; // ❌ WRONG
```

**Fixed Code:**
```javascript
const orderAmount = subtotal; // ✅ CORRECT
```

## Example Scenario

### Before Fix (WRONG ❌):
- Subtotal: $36.42
- Delivery: $6.99
- **Discount calculated on:** $43.41 (subtotal + delivery)
- **Discount (10%):** $4.34
- Add tip: $5.00
- Add tax: $0.59
- **Total shown on receipt:** $44.66
- **Stripe actually charged:** $45.36
- **DISCREPANCY:** $0.70 more charged!

### After Fix (CORRECT ✅):
- Subtotal: $36.42
- Delivery: $6.99
- **Discount calculated on:** $36.42 (subtotal only)
- **Discount (10%):** $3.64
- Add tip: $5.00
- Add tax: $0.59
- **Total shown on receipt:** $45.36
- **Stripe charges:** $45.36
- **PERFECT MATCH!** ✅

## Business Logic (Correct)

Promo codes should work like this:
1. ✅ Discount applies to **groceries (subtotal)** only
2. ✅ Discount does NOT apply to delivery, tip, or tax
3. ✅ Tax applies to delivery fee only (WA groceries exempt)
4. ✅ Tip is added after discount is applied

**Calculation Formula:**
```
Total = (Subtotal - Discount) + Delivery + Tip + Tax
```

Or expanded:
```
Total = Subtotal + Delivery + Tip + Tax - Discount
```

Where:
- `Discount = Subtotal × 10%` (for WELCOME10)
- `Tax = Delivery × 8.4%` (WA Chelan County)

## Files Changed

1. **cart-checkout.js** (line 374)
   - Changed `orderAmount` to only include `subtotal`
   - Promo discounts now calculate correctly

2. **server/models/PromoCode.js**
   - Added documentation clarifying `orderAmount` parameter
   - No logic changes needed

3. **verify_payment_calc.js** (NEW)
   - Test script to verify calculations
   - Shows breakdown of all charges

## Testing

Run the verification script:
```bash
node verify_payment_calc.js
```

Expected output:
```
Cart Items (Subtotal): $36.42
Delivery Fee: $6.99
Tip: $5.00
─────────────────────────────
Promo Code (WELCOME10 - 10% off subtotal): -$3.64
─────────────────────────────
Taxable Amount (delivery + taxable items): $6.99
Tax (8.4%): $0.59
═════════════════════════════
TOTAL: $45.36
═════════════════════════════

Stripe should charge: 4536 cents
Customer receipt should show: $45.36
```

## Test Scenario

1. Add $36.42 worth of groceries to cart
2. Apply WELCOME10 promo code
3. Add $5.00 tip
4. Proceed to checkout with Stripe
5. ✅ Stripe charges $45.36
6. ✅ Receipt shows $45.36
7. ✅ Customer is happy!

## Impact

- ✅ **Payment amounts are now accurate**
- ✅ **No more customer confusion**
- ✅ **Proper financial reconciliation**
- ✅ **Legal compliance maintained**
- ✅ **Customer trust restored**

## Related Files

- `cart-checkout.js` - Promo code validation
- `checkout.js` - Stripe payment creation
- `main.js` - Order summary calculation
- `server/controllers/orderController.js` - Backend order creation
- `server/controllers/promoCodeController.js` - Promo validation
- `server/models/PromoCode.js` - Discount calculation

## Date Fixed
January 1, 2026

## Git Commit
```
198ea5b - 🐛 FIX: Promo code discount calculation - Stripe payment now matches receipt
```
