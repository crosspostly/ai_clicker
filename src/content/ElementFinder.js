/**
 * Element finder with caching and multiple selector strategies
 * Provides reliable element location with fallback methods
 */

class ElementFinder {
  constructor() {
    this.selectorCache = new Map();
    this.maxCacheSize = 500;
  }

  /**
   * Find element using multiple strategies
   */
  find(target) {
    try {
      // Try cache first
      if (this.selectorCache.has(target)) {
        const cachedElement = this.selectorCache.get(target);
        if (document.contains(cachedElement)) {
          return cachedElement;
        }
        // Remove stale cache entry
        this.selectorCache.delete(target);
      }

      // Try different strategies
      let element = this.findByText(target);
      if (element) return this.cacheElement(target, element);

      element = this.findBySelector(target);
      if (element) return this.cacheElement(target, element);

      element = this.findByAriaLabel(target);
      if (element) return this.cacheElement(target, element);

      element = this.findByXPath(target);
      if (element) return this.cacheElement(target, element);

      element = this.findByPartialText(target);
      if (element) return this.cacheElement(target, element);

      return null;
    } catch (error) {
      console.error('Error finding element:', error);
      return null;
    }
  }

  /**
   * Find element by exact text content
   */
  findByText(text) {
    const xpath = `//*[text()="${text}" or normalize-space()="${text}"]`;
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find element by CSS selector
   */
  findBySelector(selector) {
    try {
      // Remove quotes if present
      const cleanSelector = selector.replace(/^['"]|['"]$/g, '');
      return document.querySelector(cleanSelector);
    } catch (error) {
      return null;
    }
  }

  /**
   * Find element by aria-label attribute
   */
  findByAriaLabel(label) {
    try {
      return document.querySelector(`[aria-label="${label}"]`);
    } catch (error) {
      return null;
    }
  }

  /**
   * Find element by XPath
   */
  findByXPath(xpath) {
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find element by partial text match
   */
  findByPartialText(text) {
    try {
      // Build XPath that matches partial text
      const xpath = `//*[contains(text(), "${text}") or contains(normalize-space(), "${text}")]`;
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache element for future lookups
   */
  cacheElement(key, element) {
    // Implement basic LRU cache
    if (this.selectorCache.size >= this.maxCacheSize) {
      const firstKey = this.selectorCache.keys().next().value;
      this.selectorCache.delete(firstKey);
    }
    this.selectorCache.set(key, element);
    return element;
  }

  /**
   * Find multiple elements matching selector
   */
  findAll(selector) {
    try {
      const cleanSelector = selector.replace(/^['"]|['"]$/g, '');
      return Array.from(document.querySelectorAll(cleanSelector));
    } catch (error) {
      return [];
    }
  }

  /**
   * Find element by label text (for form inputs)
   */
  findByLabelText(labelText) {
    try {
      const labels = document.querySelectorAll('label');
      for (const label of labels) {
        if (label.textContent.includes(labelText)) {
          const htmlFor = label.getAttribute('for');
          if (htmlFor) {
            return document.getElementById(htmlFor);
          }
          return label.querySelector('input, textarea, select');
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find element by button text
   */
  findByButtonText(text) {
    try {
      const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
      for (const button of buttons) {
        if (button.textContent.trim() === text.trim() || button.value === text) {
          return button;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find input by placeholder
   */
  findByPlaceholder(placeholder) {
    try {
      return document.querySelector(`input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear selector cache
   */
  clearCache() {
    this.selectorCache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.selectorCache.size,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * Find closest parent matching selector
   */
  findClosestParent(element, selector) {
    try {
      const cleanSelector = selector.replace(/^['"]|['"]$/g, '');
      return element.closest(cleanSelector);
    } catch (error) {
      return null;
    }
  }

  /**
   * Find element within specific container
   */
  findInContainer(container, selector) {
    try {
      if (!container) return null;
      const cleanSelector = selector.replace(/^['"]|['"]$/g, '');
      return container.querySelector(cleanSelector);
    } catch (error) {
      return null;
    }
  }

  /**
   * Wait for element to appear in DOM
   */
  async waitFor(target, timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = this.find(target);
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Element "${target}" not found within ${timeout}ms`);
  }

  /**
   * Check if element is interactive
   */
  isInteractive(element) {
    if (!element) return false;
    
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'label'];
    if (interactiveTags.includes(element.tagName.toLowerCase())) {
      return true;
    }
    
    const role = element.getAttribute('role');
    if (role && ['button', 'link', 'menuitem', 'tab'].includes(role)) {
      return true;
    }
    
    return element.onclick !== null || element.style.cursor === 'pointer';
  }

  /**
   * Check if element is visible
   */
  isVisible(element) {
    if (!element) return false;
    
    return !!(
      element.offsetParent !== null &&
      window.getComputedStyle(element).display !== 'none' &&
      window.getComputedStyle(element).visibility !== 'hidden'
    );
  }

  /**
   * Generate CSS selector from element
   */
  generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    const path = [];
    while (element.parentElement) {
      let selector = element.tagName.toLowerCase();
      
      if (element.id) {
        selector += `#${element.id}`;
        path.unshift(selector);
        break;
      }

      let sibling = element;
      let nth = 1;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.tagName.toLowerCase() === selector) {
          nth++;
        }
      }

      if (nth > 1) {
        selector += `:nth-of-type(${nth})`;
      }

      path.unshift(selector);
      element = element.parentElement;
    }

    return path.join(' > ');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ElementFinder };
}
