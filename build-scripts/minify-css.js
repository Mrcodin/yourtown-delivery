/**
 * CSS Minification Build Script
 * Minifies all CSS files for production
 */

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

const CSS_FILES = [
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
];

const OUTPUT_DIR = 'dist';

function minifyCSS() {
    console.log('🎨 Starting CSS minification...\n');
    
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    const cleanCSS = new CleanCSS({
        level: {
            1: {
                all: true,
                normalizeUrls: true
            },
            2: {
                all: true,
                restructureRules: true,
                mergeAdjacentRules: true,
                mergeMedia: true,
                mergeNonAdjacentRules: true,
                mergeSemantically: true,
                removeEmpty: true,
                removeUnusedAtRules: true
            }
        },
        format: 'beautify' // Set to false for production
    });
    
    let totalOriginalSize = 0;
    let totalMinifiedSize = 0;
    
    CSS_FILES.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${file}`);
            return;
        }
        
        const input = fs.readFileSync(filePath, 'utf8');
        const originalSize = Buffer.byteLength(input, 'utf8');
        
        const output = cleanCSS.minify(input);
        
        if (output.errors.length > 0) {
            console.error(`❌ Error minifying ${file}:`, output.errors);
            return;
        }
        
        const minifiedSize = Buffer.byteLength(output.styles, 'utf8');
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
        
        // Create output directory structure
        const outputPath = path.join(__dirname, '..', OUTPUT_DIR, file);
        const outputDir = path.dirname(outputPath);
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, output.styles);
        
        console.log(`✅ ${file}`);
        console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`   Savings: ${savings}%\n`);
        
        totalOriginalSize += originalSize;
        totalMinifiedSize += minifiedSize;
    });
    
    const totalSavings = ((1 - totalMinifiedSize / totalOriginalSize) * 100).toFixed(2);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total Original Size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Total Minified Size: ${(totalMinifiedSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Total Savings: ${totalSavings}%`);
    console.log(`✨ CSS minification complete!\n`);
}

minifyCSS();
