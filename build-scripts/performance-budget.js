/**
 * Performance Budget Checker
 * Validates that assets meet performance budgets
 */

const fs = require('fs');
const path = require('path');

// Performance budgets (in bytes)
const BUDGETS = {
    // Per-file budgets
    css: {
        max: 50000,      // 50KB per CSS file
        warn: 30000      // Warn at 30KB
    },
    js: {
        max: 100000,     // 100KB per JS file
        warn: 50000      // Warn at 50KB
    },
    
    // Total budgets
    totalCSS: {
        max: 200000,     // 200KB total CSS
        warn: 150000     // Warn at 150KB
    },
    totalJS: {
        max: 500000,     // 500KB total JS
        warn: 300000     // Warn at 300KB
    },
    totalAssets: {
        max: 1000000,    // 1MB total assets
        warn: 750000     // Warn at 750KB
    },
    
    // Page budgets
    page: {
        max: 300000,     // 300KB per page bundle
        warn: 200000     // Warn at 200KB
    }
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

function checkBudget(size, budget, label) {
    const percentage = (size / budget.max * 100).toFixed(1);
    
    if (size > budget.max) {
        console.log(`  ❌ ${label}: ${formatBytes(size)} (${percentage}% of budget) - OVER BUDGET!`);
        return 'fail';
    } else if (size > budget.warn) {
        console.log(`  ⚠️  ${label}: ${formatBytes(size)} (${percentage}% of budget) - Warning`);
        return 'warn';
    } else {
        console.log(`  ✅ ${label}: ${formatBytes(size)} (${percentage}% of budget) - Good`);
        return 'pass';
    }
}

function checkPerformanceBudget() {
    console.log('💰 Performance Budget Check\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let failures = 0;
    let warnings = 0;
    
    // Check individual CSS files
    console.log('📄 CSS Files:');
    const cssFiles = [
        'dist/styles.css',
        'dist/admin.css',
        'dist/loading.css'
    ];
    
    let totalCSS = 0;
    cssFiles.forEach(file => {
        const size = getFileSize(file);
        if (size > 0) {
            totalCSS += size;
            const result = checkBudget(size, BUDGETS.css, path.basename(file).padEnd(20));
            if (result === 'fail') failures++;
            if (result === 'warn') warnings++;
        }
    });
    
    console.log('');
    const cssResult = checkBudget(totalCSS, BUDGETS.totalCSS, 'Total CSS'.padEnd(20));
    if (cssResult === 'fail') failures++;
    if (cssResult === 'warn') warnings++;
    
    // Check individual JS files
    console.log('\n⚙️  JavaScript Files:');
    const jsFiles = [
        'dist/main.js',
        'dist/admin.js',
        'dist/api.js',
        'dist/auth.js'
    ];
    
    let totalJS = 0;
    jsFiles.forEach(file => {
        const size = getFileSize(file);
        if (size > 0) {
            totalJS += size;
            const result = checkBudget(size, BUDGETS.js, path.basename(file).padEnd(20));
            if (result === 'fail') failures++;
            if (result === 'warn') warnings++;
        }
    });
    
    console.log('');
    const jsResult = checkBudget(totalJS, BUDGETS.totalJS, 'Total JS'.padEnd(20));
    if (jsResult === 'fail') failures++;
    if (jsResult === 'warn') warnings++;
    
    // Check total assets
    console.log('\n📊 Total Assets:');
    const totalAssets = totalCSS + totalJS;
    const totalResult = checkBudget(totalAssets, BUDGETS.totalAssets, 'All Assets'.padEnd(20));
    if (totalResult === 'fail') failures++;
    if (totalResult === 'warn') warnings++;
    
    // Check page bundles
    console.log('\n📄 Page Bundles:');
    const pages = {
        'Homepage (index.html)': ['dist/styles.css', 'dist/loading.css', 'dist/lazy-load.css', 'dist/main.js', 'dist/api.js', 'dist/config.js'],
        'Shop (shop.html)': ['dist/styles.css', 'dist/loading.css', 'dist/lazy-load.css', 'dist/main.js', 'dist/api.js', 'dist/js/products.js', 'dist/js/cart.js', 'dist/js/shop.js'],
        'Admin (admin.html)': ['dist/styles.css', 'dist/admin.css', 'dist/loading.css', 'dist/admin.js', 'dist/api.js', 'dist/auth.js']
    };
    
    Object.keys(pages).forEach(page => {
        let pageSize = 0;
        pages[page].forEach(file => {
            pageSize += getFileSize(file);
        });
        
        const result = checkBudget(pageSize, BUDGETS.page, page.padEnd(20));
        if (result === 'fail') failures++;
        if (result === 'warn') warnings++;
    });
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Budget Summary:\n');
    console.log(`  Budget Limits:`);
    console.log(`    CSS per file:    ${formatBytes(BUDGETS.css.max)}`);
    console.log(`    JS per file:     ${formatBytes(BUDGETS.js.max)}`);
    console.log(`    Total CSS:       ${formatBytes(BUDGETS.totalCSS.max)}`);
    console.log(`    Total JS:        ${formatBytes(BUDGETS.totalJS.max)}`);
    console.log(`    Total Assets:    ${formatBytes(BUDGETS.totalAssets.max)}`);
    console.log(`    Page Bundle:     ${formatBytes(BUDGETS.page.max)}\n`);
    
    console.log(`  Results:`);
    console.log(`    ❌ Failures: ${failures}`);
    console.log(`    ⚠️  Warnings: ${warnings}`);
    
    if (failures === 0 && warnings === 0) {
        console.log(`\n  ✨ Perfect! All assets are within budget!\n`);
        return 0;
    } else if (failures === 0) {
        console.log(`\n  👍 Good! All budgets met (${warnings} warnings)\n`);
        return 0;
    } else {
        console.log(`\n  ⚠️  Budget exceeded! ${failures} failures, ${warnings} warnings\n`);
        return 1;
    }
}

// Run the check
const exitCode = checkPerformanceBudget();
process.exit(exitCode);
