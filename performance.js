/**
 * Performance Monitoring Client
 * Tracks and reports performance metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            navigation: {},
            resources: [],
            marks: {},
            measures: {},
        };

        this.init();
    }

    init() {
        if (!window.performance) {
            console.warn('[Perf] Performance API not supported');
            return;
        }

        // Capture navigation timing on load
        if (document.readyState === 'complete') {
            this.captureNavigationTiming();
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.captureNavigationTiming(), 0);
            });
        }

        // Observe resource timing
        this.observeResources();

        // Capture Web Vitals
        this.captureWebVitals();
    }

    captureNavigationTiming() {
        const navigation = performance.getEntriesByType('navigation')[0];

        if (!navigation) return;

        this.metrics.navigation = {
            // DNS lookup
            dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,

            // TCP connection
            tcpTime: navigation.connectEnd - navigation.connectStart,

            // Request/Response
            requestTime: navigation.responseStart - navigation.requestStart,
            responseTime: navigation.responseEnd - navigation.responseStart,

            // DOM Processing
            domProcessing: navigation.domComplete - navigation.domLoading,
            domInteractive: navigation.domInteractive - navigation.domLoading,
            domContentLoaded:
                navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,

            // Load Complete
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,

            // Total times
            totalTime: navigation.loadEventEnd - navigation.fetchStart,
            ttfb: navigation.responseStart - navigation.requestStart, // Time to First Byte

            // Page ready times
            domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            windowLoad: navigation.loadEventEnd - navigation.fetchStart,
        };

        console.log('📊 Navigation Timing:', this.metrics.navigation);
    }

    observeResources() {
        // Get existing resources
        const resources = performance.getEntriesByType('resource');
        this.metrics.resources = resources.map(r => this.formatResource(r));

        // Observe new resources
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver(list => {
                for (const entry of list.getEntries()) {
                    this.metrics.resources.push(this.formatResource(entry));
                }
            });

            observer.observe({ entryTypes: ['resource'] });
        }
    }

    formatResource(resource) {
        return {
            name: resource.name,
            type: resource.initiatorType,
            duration: Math.round(resource.duration),
            size: resource.transferSize || 0,
            cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
        };
    }

    captureWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver(list => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);
                    console.log('🎯 LCP:', this.metrics.lcp, 'ms');
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                // LCP not supported
            }

            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver(list => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.fid = Math.round(entry.processingStart - entry.startTime);
                        console.log('⚡ FID:', this.metrics.fid, 'ms');
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                // FID not supported
            }

            // Cumulative Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver(list => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.metrics.cls = Math.round(clsValue * 1000) / 1000;
                    console.log('📐 CLS:', this.metrics.cls);
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                // CLS not supported
            }
        }
    }

    // Custom performance marks
    mark(name) {
        if (window.performance && performance.mark) {
            performance.mark(name);
            this.metrics.marks[name] = performance.now();
        }
    }

    // Measure between two marks
    measure(name, startMark, endMark) {
        if (window.performance && performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name, 'measure')[0];
                this.metrics.measures[name] = Math.round(measure.duration);
                return measure.duration;
            } catch (e) {
                console.warn('[Perf] Measure failed:', e);
            }
        }
        return null;
    }

    // Get summary report
    getReport() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
            connection: this.getConnectionInfo(),
        };
    }

    getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData,
            };
        }
        return null;
    }

    // Display performance summary
    showSummary() {
        const nav = this.metrics.navigation;

        console.group('⚡ Performance Summary');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (nav.ttfb) {
            console.log(`📡 Time to First Byte: ${nav.ttfb}ms`);
        }
        if (nav.domReady) {
            console.log(`📄 DOM Ready: ${nav.domReady}ms`);
        }
        if (nav.windowLoad) {
            console.log(`✅ Window Load: ${nav.windowLoad}ms`);
        }

        if (this.metrics.lcp) {
            const lcpStatus =
                this.metrics.lcp < 2500 ? '✅' : this.metrics.lcp < 4000 ? '⚠️' : '❌';
            console.log(`${lcpStatus} LCP: ${this.metrics.lcp}ms`);
        }

        if (this.metrics.fid) {
            const fidStatus = this.metrics.fid < 100 ? '✅' : this.metrics.fid < 300 ? '⚠️' : '❌';
            console.log(`${fidStatus} FID: ${this.metrics.fid}ms`);
        }

        if (this.metrics.cls !== undefined) {
            const clsStatus = this.metrics.cls < 0.1 ? '✅' : this.metrics.cls < 0.25 ? '⚠️' : '❌';
            console.log(`${clsStatus} CLS: ${this.metrics.cls}`);
        }

        // Resource summary
        const totalResources = this.metrics.resources.length;
        const cachedResources = this.metrics.resources.filter(r => r.cached).length;
        const totalSize = this.metrics.resources.reduce((sum, r) => sum + r.size, 0);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📦 Total Resources: ${totalResources}`);
        console.log(
            `💾 Cached: ${cachedResources} (${Math.round((cachedResources / totalResources) * 100)}%)`
        );
        console.log(`📊 Total Size: ${(totalSize / 1024).toFixed(2)} KB`);

        console.groupEnd();
    }

    // Send to analytics/monitoring service
    sendToAnalytics(endpoint) {
        if (!endpoint) return;

        const report = this.getReport();

        // Use sendBeacon for reliable delivery even on page unload
        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, JSON.stringify(report));
        } else {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report),
                keepalive: true,
            }).catch(err => console.error('[Perf] Failed to send metrics:', err));
        }
    }
}

// Auto-initialize
let perfMonitor = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        perfMonitor = new PerformanceMonitor();

        // Show summary after full load
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (perfMonitor) perfMonitor.showSummary();
            }, 1000);
        });
    });
} else {
    perfMonitor = new PerformanceMonitor();

    setTimeout(() => {
        if (perfMonitor) perfMonitor.showSummary();
    }, 1000);
}

// Export for manual use
window.PerformanceMonitor = PerformanceMonitor;
window.perfMonitor = perfMonitor;
