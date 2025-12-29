#!/bin/bash
# Remove development console.log statements for production
# This script comments out console.log, console.info, and console.warn but keeps console.error

echo "🧹 Cleaning console statements for production..."

# List of files to clean
FILES=(
    "api.js"
    "main.js"
    "admin.js"
    "config.js"
    "page-config.js"
    "auth.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing $file..."
        
        # Comment out console.log, console.info, console.warn (but not console.error)
        sed -i.bak -E 's/^(\s*)(console\.(log|info|warn))/\1\/\/ \2/' "$file"
        
        # Remove backup file
        rm -f "${file}.bak"
        
        echo "✓ $file cleaned"
    fi
done

echo "✅ Done! Console statements cleaned for production."
echo "Note: console.error statements were kept for debugging critical issues."
