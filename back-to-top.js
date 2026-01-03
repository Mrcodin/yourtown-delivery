/**
 * Back to Top Button Manager
 * Handles visibility and smooth scrolling
 */

class BackToTopManager {
    constructor() {
        this.button = null;
        this.scrollThreshold = 300; // Show button after scrolling 300px
        this.hasShownOnce = false;
    }

    init() {
        // Create button element
        this.button = document.createElement('button');
        this.button.className = 'back-to-top';
        this.button.innerHTML = '↑';
        this.button.setAttribute('aria-label', 'Back to top');
        this.button.setAttribute('title', 'Back to top');

        // Add click event
        this.button.addEventListener('click', () => this.scrollToTop());

        // Add to page
        document.body.appendChild(this.button);

        // Set up scroll listener
        this.setupScrollListener();
    }

    setupScrollListener() {
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            // Clear previous timeout
            clearTimeout(scrollTimeout);

            // Debounce scroll event
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 100);
        });
    }

    handleScroll() {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollPosition > this.scrollThreshold) {
            // Show button
            if (!this.button.classList.contains('visible')) {
                this.button.classList.add('visible');

                // Add pulse animation on first show
                if (!this.hasShownOnce) {
                    this.button.classList.add('pulse');
                    this.hasShownOnce = true;

                    // Remove pulse class after animation
                    setTimeout(() => {
                        this.button.classList.remove('pulse');
                    }, 6000);
                }
            }
        } else {
            // Hide button
            this.button.classList.remove('visible');
        }
    }

    scrollToTop() {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            // Instant scroll for users who prefer reduced motion
            window.scrollTo(0, 0);
        } else {
            // Smooth scroll for everyone else
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }

        // Optional: Announce to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = 'Scrolled to top of page';
        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const backToTop = new BackToTopManager();
        backToTop.init();
    });
} else {
    // DOM is already loaded
    const backToTop = new BackToTopManager();
    backToTop.init();
}
