/**
 * JavaScript Minification Build Script
 * Minifies all JS files for production using Terser
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const JS_FILES = [
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
    'back-to-top.js',
    'breadcrumb.js',
    'page-config.js',
    'js/error-tracking.js',
    'js/products.js',
    'js/cart.js',
    'js/shop.js',
    'js/ui-helpers.js',
    'js/order-tracking.js'
];

const OUTPUT_DIR = 'dist';

async function minifyJS() {
    console.log('⚙️  Starting JavaScript minification...\n');
    
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    const terserOptions = {
        compress: {
            drop_console: true, // Remove console.log statements
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
            passes: 2
        },
        mangle: {
            toplevel: true
        },
        format: {
            comments: false
        },
        sourceMap: false
    };
    
    let totalOriginalSize = 0;
    let totalMinifiedSize = 0;
    
    for (const file of JS_FILES) {
        const filePath = path.join(__dirname, '..', file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${file}`);
            continue;
        }
        
        const input = fs.readFileSync(filePath, 'utf8');
        const originalSize = Buffer.byteLength(input, 'utf8');
        
        try {
            const result = await minify(input, terserOptions);
            
            if (!result.code) {
                console.error(`❌ Error minifying ${file}: No output code`);
                continue;
            }
            
            const minifiedSize = Buffer.byteLength(result.code, 'utf8');
            const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
            
            // Create output directory structure
            const outputPath = path.join(__dirname, '..', OUTPUT_DIR, file);
            const outputDir = path.dirname(outputPath);
            
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, result.code);
            
            console.log(`✅ ${file}`);
            console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
            console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
            console.log(`   Savings: ${savings}%\n`);
            
            totalOriginalSize += originalSize;
            totalMinifiedSize += minifiedSize;
        } catch (error) {
            console.error(`❌ Error minifying ${file}:`, error.message);
        }
    }
    
    const totalSavings = ((1 - totalMinifiedSize / totalOriginalSize) * 100).toFixed(2);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total Original Size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Total Minified Size: ${(totalMinifiedSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Total Savings: ${totalSavings}%`);
    console.log(`✨ JavaScript minification complete!\n`);
}

minifyJS().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});
