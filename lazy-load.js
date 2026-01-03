/**
 * Lazy Loading Image System
 * Improves page load performance by loading images only when needed
 * Supports: Intersection Observer API with fallback
 */

class LazyLoader {
    constructor(options = {}) {
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01,
            loadingClass: 'lazy-loading',
            loadedClass: 'lazy-loaded',
            errorClass: 'lazy-error',
            ...options,
        };

        this.observer = null;
        this.init();
    }

    init() {
        // Check for Intersection Observer support
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(this.onIntersection.bind(this), {
                root: this.options.root,
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold,
            });

            // Observe all lazy images
            this.observeImages();
        } else {
            // Fallback: Load all images immediately
            this.loadAllImages();
        }
    }

    observeImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
        lazyImages.forEach(img => {
            this.observer.observe(img);
        });
    }

    onIntersection(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }

    loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        // Add loading class
        img.classList.add(this.options.loadingClass);

        // Create temp image to preload
        const tempImg = new Image();

        tempImg.onload = () => {
            // Set the actual src/srcset
            if (srcset) {
                img.srcset = srcset;
            }
            if (src) {
                img.src = src;
            }

            // Remove loading, add loaded class
            img.classList.remove(this.options.loadingClass);
            img.classList.add(this.options.loadedClass);

            // Remove data attributes
            delete img.dataset.src;
            delete img.dataset.srcset;

            // Trigger custom event
            img.dispatchEvent(new CustomEvent('lazyloaded'));
        };

        tempImg.onerror = () => {
            img.classList.remove(this.options.loadingClass);
            img.classList.add(this.options.errorClass);

            // Trigger error event
            img.dispatchEvent(new CustomEvent('lazyerror'));
        };

        // Start loading
        if (srcset) {
            tempImg.srcset = srcset;
        }
        if (src) {
            tempImg.src = src;
        }
    }

    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
        lazyImages.forEach(img => this.loadImage(img));
    }

    // Manually trigger lazy loading for dynamically added images
    update() {
        if (this.observer) {
            this.observeImages();
        }
    }

    // Destroy observer
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Auto-initialize on DOMContentLoaded
let lazyLoader = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        lazyLoader = new LazyLoader();
    });
} else {
    lazyLoader = new LazyLoader();
}

// Export for manual control
window.LazyLoader = LazyLoader;
window.lazyLoader = lazyLoader;
