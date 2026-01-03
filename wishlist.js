/**
 * Wishlist Management System
 * Handles save for later functionality with localStorage
 */

class WishlistManager {
    constructor() {
        this.storageKey = 'wishlist';
        this.wishlist = this.loadWishlist();
    }

    /**
     * Load wishlist from localStorage
     */
    loadWishlist() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading wishlist:', error);
            return [];
        }
    }

    /**
     * Save wishlist to localStorage
     */
    saveWishlist() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.wishlist));
            this.dispatchEvent('wishlist-updated');
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    }

    /**
     * Add product to wishlist
     */
    addToWishlist(product) {
        // Check if already in wishlist
        const exists = this.wishlist.find(item => item._id === product._id);
        if (exists) {
            showToast('Already in your wishlist', 'info');
            return false;
        }

        // Add to wishlist with timestamp
        this.wishlist.push({
            ...product,
            addedAt: new Date().toISOString(),
        });

        this.saveWishlist();
        showToast('Added to wishlist ❤️', 'success');
        return true;
    }

    /**
     * Remove product from wishlist
     */
    removeFromWishlist(productId) {
        const initialLength = this.wishlist.length;
        this.wishlist = this.wishlist.filter(item => item._id !== productId);

        if (this.wishlist.length < initialLength) {
            this.saveWishlist();
            showToast('Removed from wishlist', 'success');
            return true;
        }
        return false;
    }

    /**
     * Check if product is in wishlist
     */
    isInWishlist(productId) {
        return this.wishlist.some(item => item._id === productId);
    }

    /**
     * Get all wishlist items
     */
    getWishlist() {
        return this.wishlist;
    }

    /**
     * Get wishlist count
     */
    getCount() {
        return this.wishlist.length;
    }

    /**
     * Clear entire wishlist
     */
    clearWishlist() {
        if (confirm('Clear your entire wishlist?')) {
            this.wishlist = [];
            this.saveWishlist();
            showToast('Wishlist cleared', 'success');
            return true;
        }
        return false;
    }

    /**
     * Move wishlist item to cart
     */
    moveToCart(productId) {
        const product = this.wishlist.find(item => item._id === productId);
        if (!product) {
            return false;
        }

        // Add to cart
        if (typeof addToCart === 'function') {
            addToCart(product);
        } else if (typeof window.addToCart === 'function') {
            window.addToCart(product);
        }

        // Remove from wishlist
        this.removeFromWishlist(productId);
        return true;
    }

    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: { wishlist: this.wishlist },
        });
        window.dispatchEvent(event);
    }

    /**
     * Update wishlist UI badge
     */
    updateBadge() {
        const badges = document.querySelectorAll('.wishlist-badge');
        const count = this.getCount();

        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }

    /**
     * Toggle wishlist button state
     */
    updateButton(productId, button) {
        const isInWishlist = this.isInWishlist(productId);

        if (button) {
            if (isInWishlist) {
                button.innerHTML = '❤️';
                button.classList.add('in-wishlist');
                button.title = 'Remove from wishlist';
            } else {
                button.innerHTML = '🤍';
                button.classList.remove('in-wishlist');
                button.title = 'Add to wishlist';
            }
        }
    }
}

// Initialize wishlist manager
const wishlistManager = new WishlistManager();

// Update badge on page load
document.addEventListener('DOMContentLoaded', () => {
    wishlistManager.updateBadge();
});

// Update badge when wishlist changes
window.addEventListener('wishlist-updated', () => {
    wishlistManager.updateBadge();
});
