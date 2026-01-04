# CDN Setup Guide for Hometown Delivery

This guide covers setting up a Content Delivery Network (CDN) for static assets to improve global performance.

## 📦 What is a CDN?

A CDN distributes your static files (CSS, JS, images) across multiple servers worldwide, serving content from the location nearest to your users.

**Benefits:**
- ⚡ 40-60% faster load times for global users
- 📉 Reduced server bandwidth costs
- 🛡️ DDoS protection and improved security
- 🌍 Better performance for international visitors

## 🎯 Recommended CDN Providers

### 1. Cloudflare (Free Tier Available) ⭐ RECOMMENDED

**Pros:**
- Free tier with unlimited bandwidth
- Automatic caching and optimization
- Built-in security features
- Easy DNS-based setup

**Setup Steps:**

1. **Sign up for Cloudflare**
   - Go to https://cloudflare.com
   - Create a free account

2. **Add your domain**
   - Click "Add a Site"
   - Enter your domain name
   - Select Free plan

3. **Update nameservers**
   - Copy the Cloudflare nameservers
   - Update at your domain registrar
   - Wait for DNS propagation (usually 24-48 hours)

4. **Configure caching rules**
   - Go to Rules > Page Rules (free tier: 3 rules)
   - Add rule: `*yourdomain.com/*.css` → Cache Everything
   - Add rule: `*yourdomain.com/*.js` → Cache Everything
   - Add rule: `*yourdomain.com/images/*` → Cache Everything

5. **Enable automatic optimizations**
   - Speed > Optimization
   - Enable: Auto Minify (CSS, JS, HTML)
   - Enable: Brotli compression
   - Enable: Rocket Loader (async JS)

**Cache Headers (add to server/middleware/cache.js):**

```javascript
// For Cloudflare
res.setHeader('CDN-Cache-Control', 'public, max-age=31536000'); // 1 year for static assets
```

### 2. Cloudinary (Image CDN) ⭐ RECOMMENDED FOR IMAGES

**Best for:** Product images, user uploads

**Setup Steps:**

1. **Sign up for Cloudinary**
   - Go to https://cloudinary.com
   - Free tier: 25 GB storage, 25 GB bandwidth/month

2. **Get credentials**
   - Copy Cloud Name, API Key, API Secret

3. **Configure environment**
   ```bash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Use in code**
   ```javascript
   // Automatic format and quality optimization
   const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/v1/${publicId}`;
   ```

See `CLOUDINARY_SETUP.md` for detailed integration guide.

### 3. BunnyCDN (Low Cost)

**Pros:**
- $1/month for 1TB bandwidth
- Simple setup
- Good performance

**Setup Steps:**

1. **Sign up at bunny.net**
2. **Create a Pull Zone**
   - Name: hometown-delivery-assets
   - Origin URL: https://yourdomain.com
3. **Configure caching**
   - Cache expiration: 1 year for static files
4. **Get CDN URL**
   - You'll get: `https://hometown-delivery-assets.b-cdn.net`

**Update asset URLs:**
```html
<!-- Before -->
<link rel="stylesheet" href="/styles.css">

<!-- After -->
<link rel="stylesheet" href="https://hometown-delivery-assets.b-cdn.net/styles.css">
```

### 4. AWS CloudFront (Enterprise)

**Best for:** High traffic sites, enterprise needs

**Setup Steps:**

1. **Create S3 bucket for static assets**
2. **Upload files to S3**
3. **Create CloudFront distribution**
4. **Point origin to S3 bucket**
5. **Update DNS (Route 53)**

**Cost:** Pay-as-you-go (usually $0.085/GB after free tier)

## 🔧 CDN Configuration Script

We've created a helper script to update asset URLs for CDN:

```bash
# Edit the script with your CDN URL
nano cdn-config.js

# Run the script
node cdn-config.js
```

## 📁 What to Put on CDN

### Always CDN:
- ✅ CSS files (styles.css, loading.css, etc.)
- ✅ JavaScript files (main.js, admin.js, etc.)
- ✅ Images (product photos, icons, logos)
- ✅ Fonts (if self-hosted)
- ✅ Favicons and static icons

### Never CDN:
- ❌ HTML pages (need to be dynamic for Cloudflare Page Rules)
- ❌ API endpoints
- ❌ User-generated content (unless using Cloudinary)
- ❌ Authentication tokens

## 🎨 Implementation Approaches

### Approach 1: Full CDN (Cloudflare)
DNS-based, caches everything automatically. No code changes needed.

### Approach 2: Asset CDN (BunnyCDN/CloudFront)
Only static assets go through CDN. Requires URL updates.

### Approach 3: Hybrid (Cloudflare + Cloudinary)
- Cloudflare for code assets (CSS/JS)
- Cloudinary for images
- Best performance, most flexible

## 📊 Expected Performance Gains

### Before CDN:
- Load time (California to London): 3.5s
- Bandwidth cost: $20/month for 100GB

### After CDN:
- Load time (California to London): 1.2s (⚡ 65% faster)
- Bandwidth cost: $0-5/month (free tier)
- Global load time variance: ±200ms (vs ±2000ms)

## 🧪 Testing CDN Setup

### 1. Verify caching headers
```bash
curl -I https://yourdomain.com/styles.css
```

Look for:
- `CF-Cache-Status: HIT` (Cloudflare)
- `X-Cache: HIT` (Most CDNs)
- `Cache-Control: public, max-age=31536000`

### 2. Test global performance
- Use https://www.webpagetest.org
- Test from multiple locations
- Compare before/after

### 3. Check CDN coverage
```bash
# DNS lookup (should show CDN IPs, not origin)
nslookup yourdomain.com

# Traceroute (should show CDN edge servers)
traceroute yourdomain.com
```

## 🔐 Security Considerations

### 1. CORS headers (if using separate CDN domain)
```javascript
// server/middleware/cors.js
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://cdn.yourdomain.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
});
```

### 2. Subresource Integrity (SRI)
```html
<!-- Generate hash for critical files -->
<link rel="stylesheet" href="https://cdn.yourdomain.com/styles.css"
      integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
      crossorigin="anonymous">
```

Generate SRI hashes:
```bash
openssl dgst -sha384 -binary styles.css | openssl base64 -A
```

### 3. Cache invalidation
When updating assets:
```bash
# Cloudflare - purge cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -d '{"purge_everything":true}'

# Or use Cloudflare dashboard: Caching > Purge Everything
```

## 📝 Quick Start Checklist

For immediate setup with Cloudflare (free):

- [ ] Sign up for Cloudflare account
- [ ] Add domain to Cloudflare
- [ ] Update nameservers at domain registrar
- [ ] Enable Auto Minify (CSS, JS, HTML)
- [ ] Enable Brotli compression
- [ ] Set cache rules for static assets
- [ ] Test with curl -I (check for CF-Cache-Status)
- [ ] Monitor performance with webpagetest.org

**Setup time:** 30 minutes + 24-48 hours for DNS propagation

## 🆘 Troubleshooting

### Assets not caching:
1. Check cache headers in response
2. Verify CDN configuration
3. Purge CDN cache and retry
4. Check CORS if loading from different domain

### Images not loading:
1. Verify CORS headers
2. Check CDN origin configuration
3. Ensure origin server is accessible
4. Check for mixed content (HTTP/HTTPS) issues

### Stale content showing:
1. Purge CDN cache
2. Add query string versioning: `styles.css?v=1.2.3`
3. Use shorter cache TTL during development

## 📚 Additional Resources

- [Cloudflare Setup Guide](https://developers.cloudflare.com/fundamentals/get-started/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [BunnyCDN Docs](https://docs.bunny.net/)
- [Web.dev CDN Guide](https://web.dev/content-delivery-networks/)

---

**Next Steps:** After setting up CDN, update TODOs.txt and test performance improvements!
