/**
 * Validator utility for input validation and sanitization
 * Provides methods to validate and sanitize user inputs
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class Validator {
  /**
   * Validate API key format
   */
  static validateApiKey(key) {
    if (!key || typeof key !== "string") {
      throw new ValidationError("API key must be a non-empty string");
    }
    if (key.length < 10) {
      throw new ValidationError("API key is too short");
    }
    if (key.length > 500) {
      throw new ValidationError("API key is too long");
    }
    return true;
  }

  /**
   * Validate instructions text
   */
  static validateInstructions(instructions) {
    if (!instructions || typeof instructions !== "string") {
      throw new ValidationError("Instructions must be a non-empty string");
    }
    if (instructions.trim().length === 0) {
      throw new ValidationError("Instructions cannot be empty");
    }
    if (instructions.length > 5000) {
      throw new ValidationError(
        "Instructions text is too long (max 5000 chars)",
      );
    }
    return true;
  }

  /**
   * Validate action object
   */
  static validateAction(action) {
    if (!action || typeof action !== "object") {
      throw new ValidationError("Action must be an object");
    }
    if (!action.type || typeof action.type !== "string") {
      throw new ValidationError("Action must have a valid type");
    }
    const validTypes = [
      "click",
      "input",
      "hover",
      "scroll",
      "wait",
      "select",
      "double_click",
      "right_click",
    ];
    if (!validTypes.includes(action.type)) {
      throw new ValidationError(`Invalid action type: ${action.type}`);
    }
    return true;
  }

  /**
   * Validate URL
   */
  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      throw new ValidationError(`Invalid URL: ${url}`);
    }
  }

  /**
   * Validate DOM selector
   */
  static validateSelector(selector) {
    if (!selector || typeof selector !== "string") {
      throw new ValidationError("Selector must be a non-empty string");
    }
    try {
      document.querySelector(selector);
      return true;
    } catch {
      throw new ValidationError(`Invalid CSS selector: ${selector}`);
    }
  }

  /**
   * Validate XPath
   */
  static validateXPath(xpath) {
    if (!xpath || typeof xpath !== "string") {
      throw new ValidationError("XPath must be a non-empty string");
    }
    try {
      document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      );
      return true;
    } catch {
      throw new ValidationError(`Invalid XPath: ${xpath}`);
    }
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  static sanitizeHtml(html) {
    if (typeof html !== "string") {
      return "";
    }

    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Sanitize text input
   */
  static sanitizeText(text, maxLength = 1000) {
    if (typeof text !== "string") {
      return "";
    }

    const sanitized = text.trim().slice(0, maxLength).replace(/[<>]/g, "");

    return sanitized;
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    if (!email || typeof email !== "string") {
      throw new ValidationError("Email must be a non-empty string");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError(`Invalid email format: ${email}`);
    }
    return true;
  }

  /**
   * Validate number within range
   */
  static validateRange(value, min, max) {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(`Value must be a number, got: ${value}`);
    }
    if (num < min || num > max) {
      throw new ValidationError(
        `Value must be between ${min} and ${max}, got: ${num}`,
      );
    }
    return true;
  }

  /**
   * Validate duration in milliseconds
   */
  static validateDuration(duration) {
    if (typeof duration !== "number" || duration < 0 || duration > 300000) {
      throw new ValidationError(
        "Duration must be a number between 0 and 300000ms",
      );
    }
    return true;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Validator, ValidationError };
}
