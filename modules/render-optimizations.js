// ============================================
// Rendering Optimizations Module
// Utilities for optimizing UI rendering
// ============================================

/**
 * Debounce function
 * Delays execution until after wait time has elapsed since last call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 * Ensures function is called at most once per specified time period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 100) {
    let inThrottle;

    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Virtual List Renderer
 * Renders only visible items in a long list
 */
class VirtualList {
    constructor(container, items, renderItem, itemHeight = 60) {
        this.container = container;
        this.items = items;
        this.renderItem = renderItem;
        this.itemHeight = itemHeight;
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.scrollTop = 0;

        this.init();
    }

    /**
     * Initialize virtual list
     */
    init() {
        // Create viewport
        this.viewport = document.createElement('div');
        this.viewport.style.cssText = `
            height: 100%;
            overflow-y: auto;
            position: relative;
        `;

        // Create content container
        this.content = document.createElement('div');
        this.content.style.cssText = `
            position: relative;
            height: ${this.items.length * this.itemHeight}px;
        `;

        this.viewport.appendChild(this.content);
        this.container.appendChild(this.viewport);

        // Handle scroll with throttling
        this.viewport.addEventListener('scroll', throttle(() => {
            this.handleScroll();
        }, 16)); // ~60fps

        // Initial render
        this.render();
    }

    /**
     * Handle scroll event
     */
    handleScroll() {
        this.scrollTop = this.viewport.scrollTop;
        this.render();
    }

    /**
     * Calculate visible range
     */
    calculateVisibleRange() {
        const viewportHeight = this.viewport.clientHeight;
        const scrollTop = this.scrollTop;

        // Add buffer for smooth scrolling
        const buffer = 5;

        this.visibleStart = Math.max(0, Math.floor(scrollTop / this.itemHeight) - buffer);
        this.visibleEnd = Math.min(
            this.items.length,
            Math.ceil((scrollTop + viewportHeight) / this.itemHeight) + buffer
        );
    }

    /**
     * Render visible items
     */
    render() {
        this.calculateVisibleRange();

        // Clear content
        this.content.innerHTML = '';

        // Render only visible items
        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            const item = this.items[i];
            const element = this.renderItem(item, i);

            // Position element
            element.style.position = 'absolute';
            element.style.top = `${i * this.itemHeight}px`;
            element.style.width = '100%';

            this.content.appendChild(element);
        }
    }

    /**
     * Update items and re-render
     * @param {Array} newItems - New items array
     */
    updateItems(newItems) {
        this.items = newItems;
        this.content.style.height = `${this.items.length * this.itemHeight}px`;
        this.render();
    }

    /**
     * Scroll to specific index
     * @param {number} index - Item index
     */
    scrollToIndex(index) {
        this.viewport.scrollTop = index * this.itemHeight;
    }

    /**
     * Destroy virtual list
     */
    destroy() {
        this.viewport.remove();
    }
}

/**
 * Lazy Image Loader
 * Loads images only when they enter viewport
 */
class LazyImageLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px',
            threshold: 0.01,
            ...options
        };

        this.observer = null;
        this.init();
    }

    /**
     * Initialize Intersection Observer
     */
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersection(entries),
                this.options
            );
        }
    }

    /**
     * Handle intersection
     * @param {Array} entries - Intersection entries
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    /**
     * Load image
     * @param {HTMLElement} img - Image element
     */
    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        img.src = src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
    }

    /**
     * Observe an image
     * @param {HTMLElement} img - Image element
     */
    observe(img) {
        if (this.observer) {
            this.observer.observe(img);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadImage(img);
        }
    }

    /**
     * Observe multiple images
     * @param {NodeList|Array} images - Image elements
     */
    observeAll(images) {
        images.forEach(img => this.observe(img));
    }

    /**
     * Disconnect observer
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Input Debouncer
 * Debounces input events for better performance
 */
class InputDebouncer {
    constructor(input, callback, delay = 300) {
        this.input = input;
        this.callback = callback;
        this.delay = delay;
        this.debouncedCallback = debounce(callback, delay);

        this.init();
    }

    /**
     * Initialize event listener
     */
    init() {
        this.input.addEventListener('input', (e) => {
            this.debouncedCallback(e.target.value, e);
        });
    }

    /**
     * Update delay
     * @param {number} newDelay - New delay in milliseconds
     */
    setDelay(newDelay) {
        this.delay = newDelay;
        this.debouncedCallback = debounce(this.callback, newDelay);
    }
}

/**
 * Batch DOM Updates
 * Batches multiple DOM updates for better performance
 */
class BatchUpdater {
    constructor() {
        this.updates = [];
        this.scheduled = false;
    }

    /**
     * Add update to batch
     * @param {Function} updateFn - Update function
     */
    add(updateFn) {
        this.updates.push(updateFn);
        this.schedule();
    }

    /**
     * Schedule batch execution
     */
    schedule() {
        if (this.scheduled) return;

        this.scheduled = true;
        requestAnimationFrame(() => {
            this.flush();
        });
    }

    /**
     * Execute all batched updates
     */
    flush() {
        this.updates.forEach(fn => fn());
        this.updates = [];
        this.scheduled = false;
    }
}

// Export utilities
const renderOptimizations = {
    debounce,
    throttle,
    VirtualList,
    LazyImageLoader,
    InputDebouncer,
    BatchUpdater
};
