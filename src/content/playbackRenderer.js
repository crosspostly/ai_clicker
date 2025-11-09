/**
 * Playback Renderer - Executes actions in the page context
 * Handles visual feedback and element interaction
 */

import { ACTION_TYPES } from '../common/constants.js';

export class PlaybackRenderer {
  constructor() {
    this.highlights = new Set();
    this.originalStates = new Map();
    this.isInitialized = false;
    this._initializeStyles();
  }

  /**
   * Initialize CSS styles for highlighting
   * @private
   */
  _initializeStyles() {
    if (document.getElementById('playback-renderer-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'playback-renderer-styles';
    style.textContent = `
      .playback-highlight {
        outline: 2px solid #ff6b35 !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 107, 53, 0.1) !important;
        transition: all 0.3s ease !important;
        z-index: 999999 !important;
        position: relative !important;
      }
      
      .playback-highlight::before {
        content: '' !important;
        position: absolute !important;
        top: -4px !important;
        left: -4px !important;
        right: -4px !important;
        bottom: -4px !important;
        border: 2px solid #ff6b35 !important;
        border-radius: 4px !important;
        pointer-events: none !important;
        z-index: 999999 !important;
      }
      
      .playback-hover {
        background-color: rgba(255, 193, 7, 0.2) !important;
        outline: 1px solid #ffc107 !important;
      }
    `;
    document.head.appendChild(style);
    this.isInitialized = true;
  }

  /**
   * Execute single action in page
   * @param {Object} action - Action to execute
   * @returns {Promise<Object>} Execution result
   */
  async execute(action) {
    if (!this.isInitialized) {
      this._initializeStyles();
    }

    try {
      switch (action.type) {
        case ACTION_TYPES.CLICK:
          return await this._executeClick(action);
        
        case ACTION_TYPES.INPUT:
          return await this._executeInput(action);
        
        case ACTION_TYPES.SCROLL:
          return await this._executeScroll(action);
        
        case ACTION_TYPES.HOVER:
          return await this._executeHover(action);
        
        case ACTION_TYPES.DOUBLE_CLICK:
          return await this._executeDoubleClick(action);
        
        case ACTION_TYPES.RIGHT_CLICK:
          return await this._executeRightClick(action);
        
        case ACTION_TYPES.WAIT:
          return await this._executeWait(action);
        
        default:
          return {
            success: false,
            error: `Unsupported action type: ${action.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute click action
   * @private
   */
  async _executeClick(action) {
    const element = await this._findElement(action.selector);
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${action.selector}`,
      };
    }

    // Highlight before action
    await this.highlight(action.selector, 300);

    // Ensure element is visible and clickable
    if (!this._isElementVisible(element)) {
      return {
        success: false,
        error: `Element not visible: ${action.selector}`,
      };
    }

    // Scroll element into view if needed
    this._scrollIntoView(element);

    // Create and dispatch click event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    element.dispatchEvent(clickEvent);

    // Wait for any async handlers
    await new Promise(resolve => setTimeout(resolve, 50));

    return { success: true };
  }

  /**
   * Execute input action
   * @private
   */
  async _executeInput(action) {
    const element = await this._findElement(action.selector);
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${action.selector}`,
      };
    }

    // Highlight before action
    await this.highlight(action.selector, 300);

    // Check if element is input-able
    const tagName = element.tagName.toLowerCase();
    if (!['input', 'textarea', 'select'].includes(tagName) && !element.isContentEditable) {
      return {
        success: false,
        error: `Element is not input-able: ${action.selector}`,
      };
    }

    // Focus element
    element.focus();

    // Clear existing value if specified
    if (action.clear !== false) {
      if (tagName === 'select') {
        element.selectedIndex = 0;
      } else if (element.isContentEditable) {
        element.textContent = '';
      } else {
        element.value = '';
      }
    }

    // Set new value
    if (action.value !== undefined) {
      if (tagName === 'select') {
        element.value = action.value;
      } else if (element.isContentEditable) {
        element.textContent = action.value;
      } else {
        element.value = action.value;
      }

      // Trigger input and change events
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      
      element.dispatchEvent(inputEvent);
      element.dispatchEvent(changeEvent);
    }

    // Wait for any async handlers
    await new Promise(resolve => setTimeout(resolve, 50));

    return { success: true };
  }

  /**
   * Execute scroll action
   * @private
   */
  async _executeScroll(action) {
    let target = window;
    const x = action.x || 0;
    const y = action.y || 0;

    // If selector provided, scroll element into view or to position
    if (action.selector) {
      const element = await this._findElement(action.selector);
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${action.selector}`,
        };
      }

      if (action.x !== undefined || action.y !== undefined) {
        // Scroll element to specific position
        target = element;
      } else {
        // Scroll element into view
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: action.block || 'center',
          inline: action.inline || 'center',
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }
    }

    // Perform scroll
    if (target === window) {
      window.scrollTo({ 
        left: x, 
        top: y, 
        behavior: action.behavior || 'smooth', 
      });
    } else {
      target.scrollTo({ 
        left: x, 
        top: y, 
        behavior: action.behavior || 'smooth', 
      });
    }

    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true };
  }

  /**
   * Execute hover action
   * @private
   */
  async _executeHover(action) {
    const element = await this._findElement(action.selector);
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${action.selector}`,
      };
    }

    // Highlight before action
    await this.highlight(action.selector, 300);

    // Scroll element into view if needed
    this._scrollIntoView(element);

    // Add hover class for visual feedback
    element.classList.add('playback-hover');
    this.originalStates.set(element, element.classList.contains('playback-hover'));

    // Dispatch mouse events
    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    const mouseOverEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    element.dispatchEvent(mouseEnterEvent);
    element.dispatchEvent(mouseOverEvent);

    // Wait for any async handlers
    await new Promise(resolve => setTimeout(resolve, 100));

    return { success: true };
  }

  /**
   * Execute double click action
   * @private
   */
  async _executeDoubleClick(action) {
    const element = await this._findElement(action.selector);
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${action.selector}`,
      };
    }

    // Highlight before action
    await this.highlight(action.selector, 300);

    // Ensure element is visible
    if (!this._isElementVisible(element)) {
      return {
        success: false,
        error: `Element not visible: ${action.selector}`,
      };
    }

    // Scroll element into view if needed
    this._scrollIntoView(element);

    // Create and dispatch double click event
    const dblClickEvent = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    element.dispatchEvent(dblClickEvent);

    // Wait for any async handlers
    await new Promise(resolve => setTimeout(resolve, 50));

    return { success: true };
  }

  /**
   * Execute right click action
   * @private
   */
  async _executeRightClick(action) {
    const element = await this._findElement(action.selector);
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${action.selector}`,
      };
    }

    // Highlight before action
    await this.highlight(action.selector, 300);

    // Ensure element is visible
    if (!this._isElementVisible(element)) {
      return {
        success: false,
        error: `Element not visible: ${action.selector}`,
      };
    }

    // Scroll element into view if needed
    this._scrollIntoView(element);

    // Create and dispatch context menu event
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    element.dispatchEvent(contextMenuEvent);

    // Wait for any async handlers
    await new Promise(resolve => setTimeout(resolve, 50));

    return { success: true };
  }

  /**
   * Execute wait action
   * @private
   */
  async _executeWait(action) {
    const duration = action.duration || 1000;
    await new Promise(resolve => setTimeout(resolve, duration));
    return { success: true };
  }

  /**
   * Find element by selector
   * @private
   */
  async _findElement(selector) {
    try {
      // Try standard CSS selector first
      let element = document.querySelector(selector);
      
      if (element) {
        return element;
      }

      // Try XPath if CSS selector fails
      if (selector.startsWith('//') || selector.startsWith('./')) {
        const result = document.evaluate(
          selector,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        element = result.singleNodeValue;
        if (element) {
          return element;
        }
      }

      // Try in iframes if not found in main document
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          element = iframeDoc.querySelector(selector);
          if (element) {
            return element;
          }
        } catch (e) {
          // Cross-origin iframe, skip
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding element:', error);
      return null;
    }
  }

  /**
   * Check if element is visible
   * @private
   */
  _isElementVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  /**
   * Scroll element into view
   * @private
   */
  _scrollIntoView(element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center',
    });
  }

  /**
   * Highlight element for visual feedback
   * @param {string} selector - Element selector
   * @param {number} duration - Highlight duration in ms
   */
  async highlight(selector, duration = 500) {
    const element = await this._findElement(selector);
    if (!element) {
      return;
    }

    // Add highlight class
    element.classList.add('playback-highlight');
    this.highlights.add(element);

    // Remove after duration
    setTimeout(() => {
      element.classList.remove('playback-highlight');
      this.highlights.delete(element);
    }, duration);
  }

  /**
   * Cleanup highlights and restore state
   */
  cleanup() {
    // Remove all highlights
    this.highlights.forEach(element => {
      element.classList.remove('playback-highlight');
      element.classList.remove('playback-hover');
    });
    this.highlights.clear();

    // Restore original states
    this.originalStates.forEach((hadHover, element) => {
      if (!hadHover) {
        element.classList.remove('playback-hover');
      }
    });
    this.originalStates.clear();

    // Remove styles if no longer needed
    const styleElement = document.getElementById('playback-renderer-styles');
    if (styleElement && this.highlights.size === 0) {
      styleElement.remove();
      this.isInitialized = false;
    }
  }
}