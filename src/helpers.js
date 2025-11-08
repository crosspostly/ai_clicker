/**
 * Helper utilities and common functions
 */

class Helpers {
  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if element is visible
   * @param {Element} element - DOM element to check
   * @returns {boolean} True if element is visible
   */
  static isVisible(element) {
    return !!(element && element.offsetParent);
  }

  /**
   * Scroll element into view
   * @param {Element} element - DOM element to scroll to
   */
  static scrollIntoView(element) {
    try {
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      if (typeof Logger !== 'undefined') {
        Logger.error('Helpers', 'scrollIntoView failed', error);
      }
    }
  }

  /**
   * Generate CSS selector for element
   * @param {Element} element - DOM element to generate selector for
   * @returns {string} CSS selector string
   */
  static generateSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Generate unique ID
   */
  static generateId(prefix = '') {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return prefix ? `${prefix}-${id}` : id;
  }

  /**
   * Deep clone object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map((item) => this.deepClone(item));
    }

    if (obj instanceof Object) {
      const clone = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          clone[key] = this.deepClone(obj[key]);
        }
      }
      return clone;
    }
  }

  /**
   * Format bytes to readable size
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Convert array to CSV string
   */
  static arrayToCSV(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return '';
    }

    const headers = Object.keys(array[0]);
    const rows = array.map((obj) =>
      headers
        .map((header) => {
          const value = obj[header];
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Parse CSV to array
   */
  static csvToArray(csv) {
    const lines = csv.split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      return obj;
    });
  }

  /**
   * Get current timestamp
   */
  static getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format timestamp to human readable
   */
  static formatTimestamp(timestamp, locale = 'en-US') {
    return new Date(timestamp).toLocaleString(locale);
  }

  /**
   * Check if element is visible
   */
  static isElementVisible(element) {
    return !!(
      element &&
      element.offsetParent !== null &&
      window.getComputedStyle(element).display !== 'none'
    );
  }

  /**
   * Get element position
   */
  static getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y,
    };
  }

  /**
   * Scroll element into view
   */
  static scrollToElement(element, behavior = 'smooth') {
    element.scrollIntoView({ behavior, block: 'center', inline: 'center' });
  }

  /**
   * Wait for element to exist
   */
  static waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(
            new Error(`Element "${selector}" not found within ${timeout}ms`),
          );
          return;
        }

        requestAnimationFrame(checkElement);
      };

      checkElement();
    });
  }

  /**
   * Get text content from element
   */
  static getElementText(element) {
    return element ? element.innerText || element.textContent || '' : '';
  }

  /**
   * Create and dispatch custom event
   */
  static dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }

  /**
   * Listen to custom event
   */
  static onEvent(eventName, callback) {
    window.addEventListener(eventName, (event) => {
      callback(event.detail);
    });
  }

  /**
   * Get URL parameters
   */
  static getUrlParams(url = window.location.href) {
    const params = {};
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  /**
   * Build query string from object
   */
  static buildQueryString(params) {
    return Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join('&');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Helpers };
}
