/**
 * ElementFinder - Smart element finding with caching
 */
class ElementFinder extends EventEmitter {
  constructor() {
    super();
    this.selectorCache = new Map();
    this.maxCacheSize = 500;
  }

  /**
   * Find element by CSS selector with caching
   * @param {string} selector - CSS selector
   * @returns {Element|null}
   * @throws {Error} If selector is invalid
   */
  find(selector) {
    Validator.validateSelector(selector);

    if (this.selectorCache.has(selector)) {
      const element = this.selectorCache.get(selector);
      if (document.contains(element)) {
        return element;
      }
      this.selectorCache.delete(selector);
    }

    const element = document.querySelector(selector);

    if (element) {
      this.selectorCache.set(selector, element);
      if (this.selectorCache.size > this.maxCacheSize) {
        const firstKey = this.selectorCache.keys().next().value;
        this.selectorCache.delete(firstKey);
      }
    }

    return element;
  }

  /**
   * Find element by text content
   * @param {string} text - Text to search for
   * @returns {Element|null}
   */
  findByText(text) {
    const xpath = `//*[contains(text(), '${text.replace(/'/g, "\\'")}')]`;
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      );
      return result.singleNodeValue;
    } catch (error) {
      Logger.error('ElementFinder', 'XPath evaluation failed', error);
      return null;
    }
  }

  /**
   * Find all elements matching selector
   * @param {string} selector - CSS selector
   * @returns {Array<Element>}
   * @throws {Error} If selector is invalid
   */
  findAll(selector) {
    Validator.validateSelector(selector);
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (error) {
      Logger.error('ElementFinder', 'findAll failed', error);
      return [];
    }
  }

  /**
   * Find element by attribute
   * @param {string} attribute - Attribute name
   * @param {string} value - Attribute value
   * @returns {Element|null}
   */
  findByAttribute(attribute, value) {
    try {
      return document.querySelector(`[${attribute}="${value}"]`);
    } catch (error) {
      Logger.error('ElementFinder', 'findByAttribute failed', error);
      return null;
    }
  }

  /**
   * Find parent element matching selector
   * @param {Element} element - Starting element
   * @param {string} selector - CSS selector
   * @returns {Element|null}
   */
  findParent(element, selector) {
    let current = element;
    while (current && current !== document) {
      if (current.matches && current.matches(selector)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Find element by role attribute
   * @param {string} role - ARIA role
   * @returns {Element|null}
   */
  findByRole(role) {
    try {
      return document.querySelector(`[role="${role}"]`);
    } catch (error) {
      Logger.error('ElementFinder', 'findByRole failed', error);
      return null;
    }
  }

  /**
   * Find closest element matching selector
   * @param {Element} element - Starting element
   * @param {string} selector - CSS selector
   * @returns {Element|null}
   */
  findClosest(element, selector) {
    try {
      return element?.closest(selector);
    } catch (error) {
      Logger.error('ElementFinder', 'findClosest failed', error);
      return null;
    }
  }

  /**
   * Generate CSS selector for element
   * @param {Element} element - Element to generate selector for
   * @returns {string}
   */
  generateSelector(element) {
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
   * Clear selector cache
   */
  clearCache() {
    this.selectorCache.clear();
    this.emit('cache-cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return {
      size: this.selectorCache.size,
      maxSize: this.maxCacheSize,
      usage: `${this.selectorCache.size}/${this.maxCacheSize}`,
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ElementFinder;
}
