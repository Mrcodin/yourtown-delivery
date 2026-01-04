# Cloudinary Image Upload Setup Guide

## Overview
Product images are now stored in Cloudinary instead of using emojis. This provides professional product photos with automatic optimization and CDN delivery.

## Features Implemented

### Backend
- ✅ Cloudinary SDK integrated (`cloudinary@2.8.0`)
- ✅ Multer for file uploads (`multer`)
- ✅ Image upload endpoint: `POST /api/products/:id/image`
- ✅ Automatic image optimization (800x800px max, auto quality/format)
- ✅ Old image deletion when uploading new one
- ✅ 5MB file size limit
- ✅ Supported formats: JPEG, PNG, WebP, GIF

### Frontend
- ✅ Image upload form in admin-products.html
- ✅ Live image preview before upload
- ✅ Shows current product image when editing
- ✅ Product images display in shop.html
- ✅ Product images display in cart
- ✅ Fallback to emoji if no image uploaded

### Database
- ✅ `imageUrl` field already exists in Product model

## Setup Instructions

### 1. Create Cloudinary Account (Free)

1. Go to https://cloudinary.com/users/register_free
2. Sign up for free account:
   - 25GB storage
   - 25GB monthly bandwidth
   - Automatic image transformations
3. After signup, go to Dashboard
4. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure Environment Variables

Add to `server/.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dzxyzabc123
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 3. Test Image Upload

1. **Login to Admin:**
   - Go to http://localhost:5500/admin-login.html
   - Login with admin credentials

2. **Upload Product Image:**
   - Go to Products page
   - Click "Add Product" or edit existing product
   - Fill in product details
   - Click "Choose File" under Product Image
   - Select an image (JPEG, PNG, WebP, or GIF)
   - See live preview
   - Click "Save Product"

3. **Verify Image:**
   - Go to http://localhost:5500/shop.html
   - Product should show image instead of emoji
   - Image is automatically optimized for web

## Image Specifications

### Automatic Optimizations
- **Size:** Resized to max 800x800px (maintains aspect ratio)
- **Quality:** Auto-optimized for best quality/filesize balance
- **Format:** Auto-converted to WebP when browser supports it
- **Lazy Loading:** Images load as user scrolls (future enhancement)

### Upload Limits
- **Max File Size:** 5MB
- **Allowed Formats:** JPEG, PNG, WebP, GIF
- **Storage Location:** Cloudinary folder `yourtown-delivery/products/`

### File Naming
- Format: `{productId}-{timestamp}.{ext}`
- Example: `69530a071bc9a65846a20001-1735763940123.jpg`
- Prevents naming conflicts

## Usage in Admin

### Uploading New Image
1. Edit product
2. Click "Choose File" button
3. Select image from computer
4. See preview automatically
5. Click Save

### Replacing Existing Image
1. Edit product with image
2. Current image shows below upload field
3. Select new image (old one will be deleted)
4. Click Save

### Removing Image
1. Currently: Upload new image or delete product
2. Future: Add "Remove Image" button

## Fallback Behavior

If no image is uploaded:
- Shop displays emoji (🥯, 🥛, 🍞, etc.)
- Cart displays emoji
- System works exactly as before

## Image Display

### Shop Page (shop.html)
```javascript
// Automatically shows image if available, emoji if not
const imageHtml = item.imageUrl 
    ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">`
    : item.emoji;
```

### Cart Page
```javascript
// Same fallback logic
const imageHtml = item.imageUrl 
    ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
    : item.emoji;
```

## API Endpoints

### Upload Product Image
```http
POST /api/products/:id/image
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

Body: FormData with 'image' field
```

**Response:**
```json
{
  "success": true,
  "message": "Product image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1735763940/yourtown-delivery/products/69530a071bc9a65846a20001-1735763940123.jpg",
  "product": { /* updated product object */ }
}
```

### Get Products (includes imageUrl)
```http
GET /api/products

Response:
{
  "success": true,
  "products": [
    {
      "_id": "...",
      "name": "Bagels (6 pack)",
      "price": 3.99,
      "emoji": "🥯",
      "imageUrl": "https://res.cloudinary.com/.../image.jpg"
    }
  ]
}
```

## Troubleshooting

### "Invalid credentials" error
- Double-check Cloud Name, API Key, and API Secret in .env
- Make sure no extra spaces in credentials
- Restart server after updating .env

### "File too large" error
- Image must be under 5MB
- Use image compression tool before upload
- Or increase limit in `server/config/cloudinary.js`

### Image not displaying
- Check browser console for errors
- Verify imageUrl is in product data (API response)
- Check Cloudinary dashboard to see if image uploaded
- Verify CORS settings allow Cloudinary domain

### Old images not deleted
- Normal behavior - requires valid public_id
- Images are stored as `yourtown-delivery/products/{productId}-{timestamp}`
- Can manually delete from Cloudinary dashboard

## Cost Considerations

### Free Tier (Current)
- **Storage:** 25GB
- **Bandwidth:** 25GB/month
- **Transformations:** Unlimited
- **Cost:** $0/month

### Estimated Usage
- Average image: 200KB (optimized)
- 100 products = 20MB storage
- 10,000 views/month = 2GB bandwidth
- **Result:** Well within free tier limits

### If You Exceed Free Tier
- Cloudinary charges $0.18 per GB over limit
- Monitor usage in dashboard
- Consider upgrading to Plus plan ($89/month) if needed

## Future Enhancements

### Phase 1 (Current) ✅
- Single image upload per product
- Automatic optimization
- Emoji fallback

### Phase 2 (Future)
- [ ] Multiple images per product (gallery)
- [ ] Image zoom on click
- [ ] Drag-and-drop upload
- [ ] Bulk image upload
- [ ] Image crop/edit tool
- [ ] "Remove Image" button

### Phase 3 (Future)
- [ ] AI-powered image tagging
- [ ] Automatic background removal
- [ ] Smart cropping for different sizes
- [ ] Progressive image loading
- [ ] Lazy loading for performance

## Files Modified

### Backend
- `server/config/cloudinary.js` - Cloudinary configuration and upload helper
- `server/controllers/productController.js` - Added `uploadProductImage()` function
- `server/routes/products.js` - Added image upload route
- `server/.env.example` - Added Cloudinary variables

### Frontend
- `admin-products.html` - Image upload form with preview
- `main.js` - Updated product rendering to show images
- `shop.html` - No changes (uses main.js)
- `cart.html` - No changes (uses main.js)

### Database
- No changes needed (`imageUrl` field already exists)

## Testing Checklist

- [x] Cloudinary account created
- [x] Credentials added to .env
- [x] Backend dependencies installed
- [x] Server restarted
- [ ] Test image upload in admin
- [ ] Verify image shows in shop
- [ ] Verify image shows in cart
- [ ] Test emoji fallback (product without image)
- [ ] Test replacing existing image
- [ ] Test file size limit (try >5MB)
- [ ] Test invalid file type (try PDF)

## Support

### Cloudinary Documentation
- https://cloudinary.com/documentation
- https://cloudinary.com/documentation/node_integration
- https://cloudinary.com/documentation/image_transformations

### Issues
- Check server logs for errors
- Verify .env configuration
- Test with Postman/curl first
- Check Cloudinary dashboard for uploaded files

---

**Status:** Implementation Complete ✅  
**Date:** January 1, 2026  
**Version:** 1.0.0
