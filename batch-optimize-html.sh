#!/bin/bash
# Batch update HTML pages with performance optimizations

echo "🚀 Batch updating HTML pages with performance optimizations..."
echo ""

# List of HTML files to update (excluding already updated ones)
FILES=(
    "admin-customers.html"
    "admin-drivers.html"
    "admin-login.html"
    "admin-orders.html"
    "admin-products.html"
    "admin-reports.html"
    "admin.html"
    "customer-login.html"
    "customer-register.html"
    "customer-account.html"
)

UPDATED=0
FAILED=0

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Processing $file..."
        
        # Check if already has performance scripts
        if grep -q "sw-register.js" "$file"; then
            echo "   ✅ Already optimized, skipping"
            continue
        fi
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Add DNS prefetch and preconnect after <title> tag (if not already present)
        if ! grep -q "preconnect.*fonts.googleapis.com" "$file"; then
            sed -i '/<title>/a\    \n    <!-- Performance: DNS Prefetch & Preconnect -->\n    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link rel="dns-prefetch" href="https://cdn.socket.io">' "$file"
        fi
        
        # Add preload for styles.css after favicon (if not already present)
        if ! grep -q 'preload.*styles.css' "$file"; then
            sed -i '/<link rel="icon"/a\    \n    <!-- Performance: Preload Critical CSS -->\n    <link rel="preload" href="styles.css" as="style">\n    <link rel="stylesheet" href="lazy-load.css">' "$file"
        fi
        
        # Update font link to include display=swap (if not already present)
        if grep -q 'fonts.googleapis.com.*Inter' "$file" && ! grep -q 'display=swap' "$file"; then
            sed -i 's|family=Inter:wght@400;500;600;700|family=Inter:wght@400;500;600;700\&display=swap|g' "$file"
        fi
        
        # Add performance scripts before </body> (if not already present)
        if ! grep -q "sw-register.js" "$file"; then
            sed -i 's|</body>|    <!-- Performance Scripts -->\n    <script src="sw-register.js" defer></script>\n    <script src="lazy-load.js" defer></script>\n    <script src="performance.js" defer></script>\n    \n</body>|' "$file"
        fi
        
        echo "   ✅ Updated successfully"
        UPDATED=$((UPDATED + 1))
        
        # Remove backup if successful
        rm "$file.backup"
    else
        echo "   ❌ File not found: $file"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "   ✅ Updated: $UPDATED files"
echo "   ❌ Failed: $FAILED files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Done! Run 'git diff' to review changes."
