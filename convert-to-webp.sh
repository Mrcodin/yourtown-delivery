#!/bin/bash

##############################################################################
# WEBP IMAGE CONVERTER
# Converts JPG/PNG images to WebP format for better performance
##############################################################################

echo "🖼️  WebP Image Converter"
echo "=========================="
echo ""

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo "❌ Error: cwebp is not installed"
    echo ""
    echo "To install cwebp:"
    echo "  Ubuntu/Debian: sudo apt-get install webp"
    echo "  macOS:         brew install webp"
    echo "  Windows:       Download from https://developers.google.com/speed/webp/download"
    echo ""
    exit 1
fi

# Default quality setting
QUALITY=80
LOSSLESS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -q|--quality)
            QUALITY="$2"
            shift 2
            ;;
        -l|--lossless)
            LOSSLESS=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -q, --quality NUM    Set quality (0-100, default: 80)"
            echo "  -l, --lossless       Use lossless compression"
            echo "  -h, --help           Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "Quality: $QUALITY"
echo "Lossless: $LOSSLESS"
echo ""

# Counter
CONVERTED=0
SKIPPED=0
TOTAL=0

# Find and convert images
find . -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/vendor/*" | while read -r img; do
    
    TOTAL=$((TOTAL + 1))
    
    # Get directory and filename
    DIR=$(dirname "$img")
    FILENAME=$(basename "$img")
    BASENAME="${FILENAME%.*}"
    WEBP_FILE="$DIR/$BASENAME.webp"
    
    # Skip if WebP already exists and is newer
    if [ -f "$WEBP_FILE" ] && [ "$WEBP_FILE" -nt "$img" ]; then
        echo "⏭️  Skipping (already exists): $WEBP_FILE"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    echo "🔄 Converting: $img"
    
    # Convert based on lossless flag
    if [ "$LOSSLESS" = true ]; then
        cwebp -lossless "$img" -o "$WEBP_FILE" 2>&1 | grep -v "^$"
    else
        cwebp -q "$QUALITY" "$img" -o "$WEBP_FILE" 2>&1 | grep -v "^$"
    fi
    
    if [ $? -eq 0 ]; then
        # Calculate size savings
        ORIGINAL_SIZE=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
        WEBP_SIZE=$(stat -f%z "$WEBP_FILE" 2>/dev/null || stat -c%s "$WEBP_FILE")
        SAVINGS=$((100 - (WEBP_SIZE * 100 / ORIGINAL_SIZE)))
        
        echo "✅ Created: $WEBP_FILE (${SAVINGS}% smaller)"
        CONVERTED=$((CONVERTED + 1))
    else
        echo "❌ Failed: $img"
    fi
    echo ""
done

echo "=========================="
echo "Summary:"
echo "  Total images: $TOTAL"
echo "  Converted: $CONVERTED"
echo "  Skipped: $SKIPPED"
echo ""
echo "✅ Done!"
