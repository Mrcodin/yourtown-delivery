/**
 * Development Mode Helper
 * Disables service worker caching during local development
 * Add this script BEFORE sw-register.js in your HTML files
 */

(function() {
    // Check if we're in development mode (localhost)
    const isDevelopment = 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('codespaces') ||
        window.location.port === '3000';

    console.log('🔍 Checking dev mode:', {
        hostname: window.location.hostname,
        port: window.location.port,
        isDevelopment: isDevelopment
    });

    if (isDevelopment) {
        console.log('🔧 Development mode ACTIVE - disabling caching');
        
        // Prevent new service worker registration
        window.DISABLE_SERVICE_WORKER = true;
        
        // Unregister existing service workers IMMEDIATELY
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                console.log('📋 Found', registrations.length, 'service worker(s)');
                for (let registration of registrations) {
                    registration.unregister().then(() => {
                        console.log('✅ Unregistered service worker:', registration.scope);
                    });
                }
                // Force reload after unregistering
                if (registrations.length > 0 && !sessionStorage.getItem('sw_cleared')) {
                    sessionStorage.setItem('sw_cleared', 'true');
                    console.log('🔄 Reloading to clear service worker...');
                    window.location.reload();
                }
            });
        }
        
        // Clear all caches aggressively
        if ('caches' in window) {
            caches.keys().then(names => {
                console.log('📋 Found', names.length, 'cache(s)');
                Promise.all(
                    names.map(name => {
                        return caches.delete(name).then(() => {
                            console.log('✅ Cleared cache:', name);
                        });
                    })
                ).then(() => {
                    console.log('✅ All caches cleared');
                });
            });
        }
        
        // Add no-cache meta tags
        const addMetaTag = (httpEquiv, content) => {
            const meta = document.createElement('meta');
            meta.httpEquiv = httpEquiv;
            meta.content = content;
            document.head.appendChild(meta);
        };
        
        addMetaTag('Cache-Control', 'no-cache, no-store, must-revalidate');
        addMetaTag('Pragma', 'no-cache');
        addMetaTag('Expires', '0');
        
        // Add visual indicator badge
        const addDevBadge = () => {
            // Remove old badge if exists
            const oldBadge = document.getElementById('dev-mode-badge');
            if (oldBadge) {
                oldBadge.remove();
            }
            
            const devBadge = document.createElement('div');
            devBadge.id = 'dev-mode-badge';
            devBadge.style.cssText = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 8px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                z-index: 99999;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                pointer-events: none;
                animation: devBadgePulse 2s ease-in-out infinite;
            `;
            devBadge.textContent = '🔧 DEV MODE';
            devBadge.title = 'Service worker and caching disabled for development';
            
            document.body.appendChild(devBadge);
            console.log('✅ Dev badge added to page');
        };
        
        // Add animation keyframes
        const addBadgeAnimation = () => {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes devBadgePulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
            `;
            document.head.appendChild(style);
        };
        
        // Add badge as soon as possible
        addBadgeAnimation();
        
        if (document.body) {
            addDevBadge();
        } else {
            // Try multiple ways to ensure badge is added
            document.addEventListener('DOMContentLoaded', addDevBadge);
            window.addEventListener('load', addDevBadge);
            
            // Fallback: keep checking until body exists
            const checkBody = setInterval(() => {
                if (document.body) {
                    addDevBadge();
                    clearInterval(checkBody);
                }
            }, 10);
        }
        
        console.log('✅ Development mode configuration complete:');
        console.log('   ✓ Service worker disabled');
        console.log('   ✓ Cache clearing initiated');
        console.log('   ✓ No-cache headers added');
        console.log('   ✓ Changes will reflect on F5 refresh');
        console.log('');
        console.log('💡 If you still see cached content:');
        console.log('   1. Check console for any errors');
        console.log('   2. Try Ctrl+Shift+R ONE more time');
        console.log('   3. After that, regular F5 should work');
    } else {
        console.log('📦 Production mode - service worker enabled');
    }

