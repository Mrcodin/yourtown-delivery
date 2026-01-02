/**
 * Service Worker Registration
 * Handles SW lifecycle and provides update notifications
 */

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.isUpdateAvailable = false;
    }
    
    async register() {
        if (!('serviceWorker' in navigator)) {
            console.log('[SW] Service workers not supported');
            return false;
        }
        
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js');
            console.log('[SW] Registered successfully');
            
            // Check for updates
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        this.isUpdateAvailable = true;
                        this.showUpdateNotification();
                    }
                });
            });
            
            // Check for updates every hour
            setInterval(() => {
                this.registration.update();
            }, 3600000);
            
            return true;
        } catch (error) {
            console.error('[SW] Registration failed:', error);
            return false;
        }
    }
    
    showUpdateNotification() {
        // Create update notification
        const notification = document.createElement('div');
        notification.className = 'sw-update-notification';
        notification.innerHTML = `
            <div class="sw-update-content">
                <span>🎉 A new version is available!</span>
                <button onclick="swManager.applyUpdate()" class="btn-primary">Update Now</button>
                <button onclick="this.closest('.sw-update-notification').remove()" class="btn-outline">Later</button>
            </div>
        `;
        
        document.body.appendChild(notification);
    }
    
    applyUpdate() {
        if (this.registration && this.registration.waiting) {
            // Tell the waiting service worker to take over
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Reload the page
            window.location.reload();
        }
    }
    
    async clearCache() {
        if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map(name => caches.delete(name)));
            console.log('[SW] Cache cleared');
        }
    }
    
    async getCacheSize() {
        if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                percentage: (estimate.usage / estimate.quota * 100).toFixed(2)
            };
        }
        return null;
    }
}

// Auto-initialize
const swManager = new ServiceWorkerManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        swManager.register();
    });
} else {
    swManager.register();
}

window.swManager = swManager;
