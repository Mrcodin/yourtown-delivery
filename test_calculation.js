// Test calculation script
const subtotal = 36.42;
const deliveryFee = 6.99;
const tip = 5.00;
const discount = 3.64; // 10% of subtotal
const taxRate = 0.084;
const taxableItemsSubtotal = 0; // All groceries

console.log("=== CURRENT CALCULATION ===");
const taxableAmount = deliveryFee + taxableItemsSubtotal;
const tax = taxableAmount * taxRate;
const total = subtotal + deliveryFee + tip + tax - discount;

console.log("Subtotal:", subtotal.toFixed(2));
console.log("Delivery:", deliveryFee.toFixed(2));
console.log("Tip:", tip.toFixed(2));
console.log("Discount:", discount.toFixed(2));
console.log("Taxable Amount (delivery + taxable items):", taxableAmount.toFixed(2));
console.log("Tax (8.4%):", tax.toFixed(2));
console.log("TOTAL:", total.toFixed(2));
console.log("\n=== STRIPE SHOULD CHARGE ===");
console.log("$" + (total * 100).toFixed(0), "cents");
