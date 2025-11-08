/**
 * Validator - Input validation for all data
 */
class Validator {
  /**
   * Validate action object
   * @param {Object} action - Action to validate
   * @returns {boolean}
   * @throws {Error} If action is invalid
   */
  static validateAction(action) {
    if (!action || typeof action !== 'object') {
      throw new Error('Action must be an object');
    }

    const validTypes = [
      'click',
      'input',
      'select',
      'scroll',
      'wait',
      'double_click',
      'right_click',
      'hover',
    ];

    if (!action.type || !validTypes.includes(action.type)) {
      throw new Error(`Invalid action type: ${action.type}`);
    }

    return true;
  }

  /**
   * Validate CSS selector
   * @param {string} selector - Selector to validate
   * @returns {boolean}
   * @throws {Error} If selector is invalid
   */
  static validateSelector(selector) {
    if (!selector || typeof selector !== 'string') {
      throw new Error('Selector must be a non-empty string');
    }
    if (selector.length > 500) {
      throw new Error('Selector is too long (max 500 chars)');
    }
    return true;
  }

  /**
   * Validate Gemini API key format
   * @param {string} key - API key to validate
   * @returns {boolean}
   * @throws {Error} If key format is invalid
   */
  static validateGeminiKey(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('API key must be a string');
    }
    if (key.length !== 39 || !key.startsWith('AIza')) {
      throw new Error(
        'Invalid Gemini API key format (must be 39 chars, start with AIza)',
      );
    }
    return true;
  }

  /**
   * Validate instruction string
   * @param {string} instructions - Instructions to validate
   * @returns {boolean}
   * @throws {Error} If instructions are invalid
   */
  static validateInstructions(instructions) {
    if (!instructions || typeof instructions !== 'string') {
      throw new Error('Instructions must be a non-empty string');
    }
    if (instructions.length > 5000) {
      throw new Error('Instructions are too long (max 5000 chars)');
    }
    return true;
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean}
   * @throws {Error} If URL is invalid
   */
  static validateUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL must be a non-empty string');
    }
    try {
      new URL(url);
      return true;
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Validate action array
   * @param {Array} actions - Actions array to validate
   * @returns {boolean}
   * @throws {Error} If array is invalid
   */
  static validateActionArray(actions) {
    if (!Array.isArray(actions)) {
      throw new Error('Actions must be an array');
    }
    if (actions.length === 0) {
      throw new Error('Actions array cannot be empty');
    }
    if (actions.length > 1000) {
      throw new Error('Too many actions (max 1000)');
    }
    return true;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validator;
}
