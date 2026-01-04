/* ===================================
   WEBP IMAGE HELPER
   Automatic WebP format with fallbacks
   =================================== */

/**
 * WebP Image Helper
 * Provides modern image format support with automatic fallbacks
 */
class WebPImageHelper {
    constructor() {
        this.supportsWebP = null;
        this.checkWebPSupport();
    }

    /**
     * Check if browser supports WebP
     */
    async checkWebPSupport() {
        if (this.supportsWebP !== null) {
            return this.supportsWebP;
        }

        // Check via canvas
        if (!self.createImageBitmap) {
            this.supportsWebP = false;
            return false;
        }

        try {
            const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
            const blob = await fetch(webpData).then(r => r.blob());
            this.supportsWebP = await createImageBitmap(blob).then(() => true, () => false);
        } catch {
            this.supportsWebP = false;
        }

        return this.supportsWebP;
    }

    /**
     * Get optimal image URL (WebP if supported, original otherwise)
     * @param {string} imageUrl - Original image URL
     * @returns {Promise<string>} Optimal image URL
     */
    async getOptimalImageUrl(imageUrl) {
        if (!imageUrl) return '';

        const supportsWebP = await this.checkWebPSupport();
        
        if (supportsWebP && !imageUrl.endsWith('.webp')) {
            // Try to get WebP version (assumes naming convention)
            const webpUrl = imageUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            return webpUrl;
        }

        return imageUrl;
    }

    /**
     * Create picture element with WebP and fallback sources
     * @param {Object} options - Image options
     * @returns {HTMLPictureElement}
     */
    createPictureElement(options) {
        const {
            src,
            webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
            alt = '',
            className = '',
            width,
            height,
            loading = 'lazy',
            sizes = '100vw'
        } = options;

        const picture = document.createElement('picture');

        // WebP source (modern browsers)
        if (webpSrc && webpSrc !== src) {
            const webpSource = document.createElement('source');
            webpSource.srcset = webpSrc;
            webpSource.type = 'image/webp';
            if (sizes) webpSource.sizes = sizes;
            picture.appendChild(webpSource);
        }

        // Fallback image (all browsers)
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        if (className) img.className = className;
        if (width) img.width = width;
        if (height) img.height = height;
        img.loading = loading;
        
        picture.appendChild(img);

        return picture;
    }

    /**
     * Create responsive picture element with multiple sizes
     * @param {Object} options - Image options with srcset
     * @returns {HTMLPictureElement}
     */
    createResponsivePicture(options) {
        const {
            sources = [], // Array of { src, webpSrc, media, sizes }
            fallbackSrc,
            alt = '',
            className = '',
            loading = 'lazy'
        } = options;

        const picture = document.createElement('picture');

        // Add source elements for each breakpoint
        sources.forEach(source => {
            // WebP source
            if (source.webpSrc) {
                const webpSource = document.createElement('source');
                webpSource.srcset = source.webpSrc;
                webpSource.type = 'image/webp';
                if (source.media) webpSource.media = source.media;
                if (source.sizes) webpSource.sizes = source.sizes;
                picture.appendChild(webpSource);
            }

            // Regular source
            const regularSource = document.createElement('source');
            regularSource.srcset = source.src;
            if (source.media) regularSource.media = source.media;
            if (source.sizes) regularSource.sizes = source.sizes;
            picture.appendChild(regularSource);
        });

        // Fallback image
        const img = document.createElement('img');
        img.src = fallbackSrc;
        img.alt = alt;
        if (className) img.className = className;
        img.loading = loading;
        
        picture.appendChild(img);

        return picture;
    }

    /**
     * Replace img tags with picture elements
     * @param {HTMLElement} container - Container to search for images
     */
    upgradeToPictureElements(container = document.body) {
        const images = container.querySelectorAll('img[data-webp-upgrade]');

        images.forEach(img => {
            const src = img.src || img.dataset.src;
            const webpSrc = img.dataset.webpSrc || src.replace(/\.(jpg|jpeg|png)$/i, '.webp');

            const picture = this.createPictureElement({
                src,
                webpSrc,
                alt: img.alt,
                className: img.className,
                width: img.width,
                height: img.height,
                loading: img.loading || 'lazy'
            });

            img.parentNode.replaceChild(picture, img);
        });
    }

    /**
     * Get WebP URL for Cloudinary image
     * @param {string} cloudinaryUrl - Original Cloudinary URL
     * @returns {string} WebP URL
     */
    getCloudinaryWebP(cloudinaryUrl) {
        if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
            return cloudinaryUrl;
        }

        // Insert f_auto,q_auto for automatic format and quality
        const urlParts = cloudinaryUrl.split('/upload/');
        if (urlParts.length === 2) {
            return `${urlParts[0]}/upload/f_auto,q_auto/${urlParts[1]}`;
        }

        return cloudinaryUrl;
    }

    /**
     * Create optimized Cloudinary picture element
     * @param {Object} options - Cloudinary image options
     * @returns {HTMLPictureElement}
     */
    createCloudinaryPicture(options) {
        const {
            cloudinaryUrl,
            alt = '',
            className = '',
            loading = 'lazy',
            transformations = [] // Array of { width, quality, crop }
        } = options;

        const sources = transformations.map(transform => {
            const { width, quality = 'auto', crop = 'fill', media } = transform;
            
            const urlParts = cloudinaryUrl.split('/upload/');
            const params = [`w_${width}`, `q_${quality}`, `c_${crop}`].join(',');
            
            const webpUrl = `${urlParts[0]}/upload/f_webp,${params}/${urlParts[1]}`;
            const fallbackUrl = `${urlParts[0]}/upload/${params}/${urlParts[1]}`;

            return {
                webpSrc: webpUrl,
                src: fallbackUrl,
                media: media || `(max-width: ${width}px)`
            };
        });

        // Fallback for browsers that don't support sources
        const fallbackSrc = this.getCloudinaryWebP(cloudinaryUrl);

        return this.createResponsivePicture({
            sources,
            fallbackSrc,
            alt,
            className,
            loading
        });
    }
}

// Create global instance
window.webpHelper = new WebPImageHelper();

/**
 * Utility function to replace image URLs with WebP versions
 */
async function useWebPIfSupported(imageUrl) {
    return window.webpHelper.getOptimalImageUrl(imageUrl);
}

/**
 * Initialize WebP support on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Upgrade any images marked for WebP
    window.webpHelper.upgradeToPictureElements();
    
    // Add support class to HTML element
    window.webpHelper.checkWebPSupport().then(supported => {
        document.documentElement.classList.add(supported ? 'webp' : 'no-webp');
    });
});

// Export for use in other modules
window.useWebPIfSupported = useWebPIfSupported;
