/* ===================================
   CDN CONFIGURATION HELPER
   Update asset URLs for CDN deployment
   =================================== */

const fs = require('fs');
const path = require('path');

// ============ CONFIGURATION ============
const CDN_CONFIG = {
    enabled: false, // Set to true when CDN is ready
    baseUrl: 'https://cdn.yourdomain.com', // Replace with your CDN URL
    
    // Asset types to serve from CDN
    assetTypes: {
        css: true,
        js: true,
        images: true,
        fonts: true
    },
    
    // Cloudinary configuration (for images)
    cloudinary: {
        enabled: false,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        baseUrl: function() {
            return `https://res.cloudinary.com/${this.cloudName}/image/upload`;
        }
    }
};

/**
 * Get CDN URL for an asset
 * @param {string} assetPath - Relative path to asset
 * @param {string} type - Asset type (css, js, images, fonts)
 * @returns {string} CDN URL or original path
 */
function getCDNUrl(assetPath, type = 'auto') {
    // If CDN is not enabled, return original path
    if (!CDN_CONFIG.enabled) {
        return assetPath;
    }

    // Auto-detect type from extension
    if (type === 'auto') {
        if (assetPath.match(/\.(css)$/i)) type = 'css';
        else if (assetPath.match(/\.(js)$/i)) type = 'js';
        else if (assetPath.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) type = 'images';
        else if (assetPath.match(/\.(woff|woff2|ttf|eot)$/i)) type = 'fonts';
    }

    // Check if this asset type should use CDN
    if (!CDN_CONFIG.assetTypes[type]) {
        return assetPath;
    }

    // For images, use Cloudinary if enabled
    if (type === 'images' && CDN_CONFIG.cloudinary.enabled && CDN_CONFIG.cloudinary.cloudName) {
        // Extract filename from path
        const filename = path.basename(assetPath);
        return `${CDN_CONFIG.cloudinary.baseUrl()}/f_auto,q_auto/${filename}`;
    }

    // Remove leading slash for CDN URL
    const cleanPath = assetPath.replace(/^\//, '');
    
    return `${CDN_CONFIG.baseUrl}/${cleanPath}`;
}

/**
 * Update HTML files with CDN URLs
 * @param {string} htmlPath - Path to HTML file
 */
function updateHTMLWithCDN(htmlPath) {
    if (!CDN_CONFIG.enabled) {
        console.log('⚠️  CDN is disabled. Set CDN_CONFIG.enabled = true to enable.');
        return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    let updated = html;

    // Update CSS links
    if (CDN_CONFIG.assetTypes.css) {
        updated = updated.replace(
            /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi,
            (match, href) => {
                if (href.startsWith('http')) return match; // Skip external URLs
                const cdnUrl = getCDNUrl(href, 'css');
                return match.replace(href, cdnUrl);
            }
        );
    }

    // Update JS scripts
    if (CDN_CONFIG.assetTypes.js) {
        updated = updated.replace(
            /<script[^>]+src=["']([^"']+\.js)["'][^>]*>/gi,
            (match, src) => {
                if (src.startsWith('http')) return match; // Skip external URLs
                if (src.includes('socket.io')) return match; // Skip Socket.io
                const cdnUrl = getCDNUrl(src, 'js');
                return match.replace(src, cdnUrl);
            }
        );
    }

    // Update image sources
    if (CDN_CONFIG.assetTypes.images) {
        updated = updated.replace(
            /<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|gif|svg|webp))["'][^>]*>/gi,
            (match, src) => {
                if (src.startsWith('http')) return match; // Skip external URLs
                const cdnUrl = getCDNUrl(src, 'images');
                return match.replace(src, cdnUrl);
            }
        );
    }

    // Write updated file if changes were made
    if (updated !== html) {
        fs.writeFileSync(htmlPath, updated);
        console.log(`✅ Updated: ${htmlPath}`);
        return true;
    }

    return false;
}

/**
 * Batch update all HTML files
 */
function updateAllHTMLFiles() {
    const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
    
    console.log(`\n🚀 Updating ${htmlFiles.length} HTML files with CDN URLs...\n`);
    
    let updatedCount = 0;
    
    htmlFiles.forEach(file => {
        if (updateHTMLWithCDN(file)) {
            updatedCount++;
        }
    });
    
    console.log(`\n✅ Updated ${updatedCount} files with CDN URLs`);
}

/**
 * Generate cache headers for static assets
 */
function getCacheHeaders(assetType) {
    const headers = {
        // Long cache for immutable assets
        immutable: {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'CDN-Cache-Control': 'public, max-age=31536000'
        },
        
        // Medium cache for CSS/JS (with versioning)
        versioned: {
            'Cache-Control': 'public, max-age=2592000', // 30 days
            'CDN-Cache-Control': 'public, max-age=2592000'
        },
        
        // Short cache for images
        images: {
            'Cache-Control': 'public, max-age=604800', // 7 days
            'CDN-Cache-Control': 'public, max-age=2592000' // 30 days on CDN
        },
        
        // No cache for HTML
        html: {
            'Cache-Control': 'public, max-age=0, must-revalidate',
            'CDN-Cache-Control': 'public, max-age=3600' // 1 hour on CDN
        }
    };
    
    return headers[assetType] || headers.versioned;
}

/**
 * Express middleware for CDN cache headers
 */
function cdnCacheMiddleware() {
    return (req, res, next) => {
        const path = req.path;
        
        let headers = {};
        
        if (path.match(/\.(css|js)$/i)) {
            headers = getCacheHeaders('versioned');
        } else if (path.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
            headers = getCacheHeaders('images');
        } else if (path.match(/\.(woff|woff2|ttf|eot)$/i)) {
            headers = getCacheHeaders('immutable');
        } else if (path.match(/\.html?$/i)) {
            headers = getCacheHeaders('html');
        }
        
        Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        
        next();
    };
}

// Export functions
module.exports = {
    CDN_CONFIG,
    getCDNUrl,
    updateHTMLWithCDN,
    updateAllHTMLFiles,
    getCacheHeaders,
    cdnCacheMiddleware
};

// CLI usage
if (require.main === module) {
    console.log('🌐 CDN Configuration Helper');
    console.log('===========================\n');
    
    if (!CDN_CONFIG.enabled) {
        console.log('⚠️  CDN is currently DISABLED');
        console.log('To enable CDN:');
        console.log('  1. Edit this file (cdn-config.js)');
        console.log('  2. Set CDN_CONFIG.enabled = true');
        console.log('  3. Set CDN_CONFIG.baseUrl = "your-cdn-url"');
        console.log('  4. Run: node cdn-config.js');
        console.log('');
        console.log('For Cloudflare (free):');
        console.log('  - No URL changes needed (DNS-based CDN)');
        console.log('  - Just update nameservers and enable caching');
        console.log('');
        console.log('For other CDNs (BunnyCDN, CloudFront):');
        console.log('  - Set baseUrl to your CDN domain');
        console.log('  - Run this script to update HTML files');
        process.exit(0);
    }
    
    console.log(`CDN Base URL: ${CDN_CONFIG.baseUrl}`);
    console.log(`Asset Types: ${JSON.stringify(CDN_CONFIG.assetTypes, null, 2)}`);
    console.log('');
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('Update all HTML files with CDN URLs? (yes/no): ', (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            updateAllHTMLFiles();
        } else {
            console.log('Cancelled.');
        }
        rl.close();
    });
}
