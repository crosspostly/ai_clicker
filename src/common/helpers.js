/**
 * Helpers - Utility functions for common operations
 */
class Helpers {
  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if element is visible on page
   * @param {Element} element - Element to check
   * @returns {boolean}
   */
  static isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetParent !== null
    );
  }

  /**
   * Scroll element into view smoothly
   * @param {Element} element - Element to scroll into view
   */
  static scrollIntoView(element) {
    try {
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      Logger.error('Helpers', 'scrollIntoView failed', error);
    }
  }

  /**
   * Generate CSS selector for element
   * @param {Element} element - Element to generate selector for
   * @returns {string}
   */
  static generateSelector(element) {
    if (!element) return '';

    if (element.id && element.id.trim()) {
      return `#${element.id}`;
    }

    if (
      element.className &&
      typeof element.className === 'string' &&
      element.className.trim()
    ) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function}
   */
  static debounce(func, delay) {
    let timeoutId;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function}
   */
  static throttle(func, limit) {
    let inThrottle;
    return function throttled(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  /**
   * Get all parents of element
   * @param {Element} element - Element to get parents for
   * @returns {Array<Element>}
   */
  static getParents(element) {
    const parents = [];
    let current = element;
    while (current) {
      parents.push(current);
      current = current.parentElement;
    }
    return parents;
  }

  /**
   * Get offset position of element
   * @param {Element} element - Element to get offset for
   * @returns {Object} {top, left}
   */
  static getOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    };
  }

  /**
   * Check if element has class
   * @param {Element} element - Element to check
   * @param {string} className - Class name
   * @returns {boolean}
   */
  static hasClass(element, className) {
    return element?.classList.contains(className) || false;
  }

  /**
   * Add class to element
   * @param {Element} element - Element to add class to
   * @param {string} className - Class name
   */
  static addClass(element, className) {
    element?.classList.add(className);
  }

  /**
   * Remove class from element
   * @param {Element} element - Element to remove class from
   * @param {string} className - Class name
   */
  static removeClass(element, className) {
    element?.classList.remove(className);
  }

  /**
   * Get element text content
   * @param {Element} element - Element to get text from
   * @returns {string}
   */
  static getText(element) {
    return element?.textContent?.trim() || '';
  }

  /**
   * Wait for element to appear in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Element>}
   * @throws {Error} If element not found within timeout
   */
  static async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await this.delay(100);
    }
    throw new Error(`Element not found: ${selector}`);
  }

  /**
   * Execute function with retry
   * @param {Function} func - Function to execute
   * @param {number} retries - Number of retries
   * @param {number} delay - Delay between retries in milliseconds
   * @returns {Promise<*>}
   */
  static async retry(func, retries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await func();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await this.delay(delay);
        }
      }
    }
    throw lastError;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Helpers;
}
