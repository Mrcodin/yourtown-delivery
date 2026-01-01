// Verify payment calculation matches between frontend and backend

console.log("=== PAYMENT CALCULATION VERIFICATION ===\n");

// Example order
const subtotal = 36.42;
const deliveryFee = 6.99;
const tip = 5.00;
const taxRate = 0.084;
const taxableItemsSubtotal = 0; // All groceries (tax-exempt)

// WELCOME10 promo code: 10% off subtotal
const promoDiscountPercent = 10;
const discount = Number((subtotal * promoDiscountPercent / 100).toFixed(2));

// Calculate tax (only on delivery + taxable items)
const taxableAmount = deliveryFee + taxableItemsSubtotal;
const tax = Number((taxableAmount * taxRate).toFixed(2));

// Calculate total
const total = Number((subtotal + deliveryFee + tip + tax - discount).toFixed(2));

console.log("Cart Items (Subtotal):", "$" + subtotal.toFixed(2));
console.log("Delivery Fee:", "$" + deliveryFee.toFixed(2));
console.log("Tip:", "$" + tip.toFixed(2));
console.log("─────────────────────────────");
console.log("Promo Code (WELCOME10 - 10% off subtotal):", "-$" + discount.toFixed(2));
console.log("─────────────────────────────");
console.log("Taxable Amount (delivery + taxable items):", "$" + taxableAmount.toFixed(2));
console.log("Tax (8.4%):", "$" + tax.toFixed(2));
console.log("═════════════════════════════");
console.log("TOTAL:", "$" + total.toFixed(2));
console.log("═════════════════════════════");
console.log("\nStripe should charge:", Math.round(total * 100), "cents");
console.log("Customer receipt should show:", "$" + total.toFixed(2));

console.log("\n=== BREAKDOWN ===");
console.log("✓ Discount applies to:", "Subtotal ($" + subtotal.toFixed(2) + ")");
console.log("✓ Discount does NOT apply to:", "Delivery, Tip, or Tax");
console.log("✓ Tax applies to:", "Delivery fee only (groceries exempt)");
console.log("✓ Tip is added to total:", "After discount");

// Show before/after discount
console.log("\n=== WITH vs WITHOUT PROMO ===");
const totalWithoutPromo = subtotal + deliveryFee + tip + tax;
console.log("Without WELCOME10:", "$" + totalWithoutPromo.toFixed(2));
console.log("With WELCOME10:", "$" + total.toFixed(2));
console.log("You save:", "$" + discount.toFixed(2), "(" + promoDiscountPercent + "%)");
