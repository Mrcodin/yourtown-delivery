/**
 * Bundle Analyzer
 * Analyzes file sizes and provides insights
 */

const fs = require('fs');
const path = require('path');

const ASSETS = {
    css: [
        'styles.css',
        'admin.css',
        'loading.css',
        'toast.css',
        'lazy-load.css',
        'back-to-top.css',
        'card-hover.css',
        'mobile-touch.css',
        'mobile-improvements.css',
        'breadcrumb.css',
        'css/base.css',
        'css/layout.css',
        'css/components.css',
        'css/shop.css',
        'css/responsive.css'
    ],
    js: [
        'main.js',
        'api.js',
        'auth.js',
        'config.js',
        'loading.js',
        'toast.js',
        'admin.js',
        'customer-auth.js',
        'lazy-load.js',
        'sw-register.js',
        'sw.js',
        'performance.js',
        'back-to-top.js',
        'breadcrumb.js',
        'page-config.js',
        'checkout.js',
        'cart-checkout.js',
        'admin-mobile.js',
        'js/error-tracking.js',
        'js/products.js',
        'js/cart.js',
        'js/shop.js',
        'js/ui-helpers.js',
        'js/order-tracking.js'
    ]
};

function getFileSize(filePath) {
    try {
        const fullPath = path.join(__dirname, '..', filePath);
        const stats = fs.statSync(fullPath);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function analyzeBundle() {
    console.log('📦 Bundle Analysis\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let totalSize = 0;
    let totalMinifiedSize = 0;
    
    // Analyze CSS
    console.log('📄 CSS Files:');
    let cssTotal = 0;
    let cssMinTotal = 0;
    
    ASSETS.css.forEach(file => {
        const size = getFileSize(file);
        const minSize = getFileSize(`dist/${file}`);
        
        if (size > 0) {
            cssTotal += size;
            cssMinTotal += minSize > 0 ? minSize : size;
            
            const savings = minSize > 0 ? ((1 - minSize / size) * 100).toFixed(2) : 0;
            console.log(`  ${file.padEnd(35)} ${formatBytes(size).padStart(10)} → ${formatBytes(minSize).padStart(10)} (${savings}%)`);
        }
    });
    
    console.log(`  ${'TOTAL CSS'.padEnd(35)} ${formatBytes(cssTotal).padStart(10)} → ${formatBytes(cssMinTotal).padStart(10)}\n`);
    
    // Analyze JavaScript
    console.log('⚙️  JavaScript Files:');
    let jsTotal = 0;
    let jsMinTotal = 0;
    
    ASSETS.js.forEach(file => {
        const size = getFileSize(file);
        const minSize = getFileSize(`dist/${file}`);
        
        if (size > 0) {
            jsTotal += size;
            jsMinTotal += minSize > 0 ? minSize : size;
            
            const savings = minSize > 0 ? ((1 - minSize / size) * 100).toFixed(2) : 0;
            console.log(`  ${file.padEnd(35)} ${formatBytes(size).padStart(10)} → ${formatBytes(minSize).padStart(10)} (${savings}%)`);
        }
    });
    
    console.log(`  ${'TOTAL JS'.padEnd(35)} ${formatBytes(jsTotal).padStart(10)} → ${formatBytes(jsMinTotal).padStart(10)}\n`);
    
    // Total analysis
    totalSize = cssTotal + jsTotal;
    totalMinifiedSize = cssMinTotal + jsMinTotal;
    
    const totalSavings = ((1 - totalMinifiedSize / totalSize) * 100).toFixed(2);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total Original:  ${formatBytes(totalSize)}`);
    console.log(`📊 Total Minified:  ${formatBytes(totalMinifiedSize)}`);
    console.log(`📊 Total Savings:   ${totalSavings}%`);
    console.log(`📊 Bytes Saved:     ${formatBytes(totalSize - totalMinifiedSize)}\n`);
    
    // Page-specific bundles
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 Page-Specific Bundle Sizes:\n');
    
    const pages = {
        'index.html': ['styles.css', 'loading.css', 'lazy-load.css', 'main.js', 'api.js', 'config.js', 'loading.js', 'toast.js', 'js/error-tracking.js', 'js/ui-helpers.js'],
        'shop.html': ['styles.css', 'loading.css', 'lazy-load.css', 'main.js', 'api.js', 'config.js', 'js/error-tracking.js', 'js/products.js', 'js/cart.js', 'js/shop.js', 'js/ui-helpers.js'],
        'cart.html': ['styles.css', 'loading.css', 'lazy-load.css', 'main.js', 'api.js', 'config.js', 'checkout.js', 'cart-checkout.js', 'js/error-tracking.js', 'js/products.js', 'js/cart.js', 'js/shop.js', 'js/ui-helpers.js'],
        'admin.html': ['styles.css', 'admin.css', 'loading.css', 'admin.js', 'api.js', 'auth.js', 'config.js', 'loading.js', 'admin-mobile.js']
    };
    
    Object.keys(pages).forEach(page => {
        let pageSize = 0;
        let pageMinSize = 0;
        
        pages[page].forEach(file => {
            pageSize += getFileSize(file);
            const minSize = getFileSize(`dist/${file}`);
            pageMinSize += minSize > 0 ? minSize : getFileSize(file);
        });
        
        const savings = ((1 - pageMinSize / pageSize) * 100).toFixed(2);
        console.log(`  ${page.padEnd(20)} ${formatBytes(pageSize).padStart(10)} → ${formatBytes(pageMinSize).padStart(10)} (${savings}%)`);
    });
    
    console.log('\n✨ Analysis complete!\n');
    
    // Recommendations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Recommendations:\n');
    
    if (totalSize > 500000) {
        console.log('  ⚠️  Total bundle size > 500KB. Consider:');
        console.log('     - Code splitting for admin pages');
        console.log('     - Lazy loading non-critical modules');
        console.log('     - Removing unused dependencies\n');
    }
    
    if (cssTotal > 150000) {
        console.log('  ⚠️  CSS bundle size > 150KB. Consider:');
        console.log('     - Using critical CSS inline');
        console.log('     - Removing unused CSS rules');
        console.log('     - Splitting CSS by page\n');
    }
    
    if (jsTotal > 300000) {
        console.log('  ⚠️  JavaScript bundle size > 300KB. Consider:');
        console.log('     - Dynamic imports for routes');
        console.log('     - Tree shaking unused code');
        console.log('     - Deferring non-critical scripts\n');
    }
    
    if (totalSavings < 40) {
        console.log('  ⚠️  Minification savings < 40%. Consider:');
        console.log('     - Running production builds');
        console.log('     - Checking minifier settings');
        console.log('     - Removing debug code\n');
    } else {
        console.log('  ✅ Good minification results!');
        console.log('  ✅ Bundle sizes are reasonable');
        console.log('  ✅ Ready for production\n');
    }
}

analyzeBundle();
