/**
 * Logger - System logging with levels and filtering
 */
class Logger {
  static LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  static currentLevel = Logger.LEVELS.INFO;

  /**
   * Set logging level
   * @param {number} level - Log level (0-3)
   */
  static setLevel(level) {
    this.currentLevel = Math.max(0, Math.min(3, level));
  }

  /**
   * Log message with timestamp and module
   * @param {number} level - Log level constant
   * @param {string} module - Module name
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  static log(level, module, message, data = null) {
    if (level < this.currentLevel) return;

    const timestamp = new Date().toLocaleTimeString('ru-RU');
    const prefix = `[${timestamp}] [${module}]`;

    const logFn = {
      [Logger.LEVELS.DEBUG]: console.debug,
      [Logger.LEVELS.INFO]: console.info,
      [Logger.LEVELS.WARN]: console.warn,
      [Logger.LEVELS.ERROR]: console.error,
    }[level];

    if (data) {
      logFn(prefix, message, data);
    } else {
      logFn(prefix, message);
    }
  }

  /**
   * Debug level log
   * @param {string} module - Module name
   * @param {string} msg - Message
   * @param {*} data - Optional data
   */
  static debug(module, msg, data) {
    this.log(this.LEVELS.DEBUG, module, msg, data);
  }

  /**
   * Info level log
   * @param {string} module - Module name
   * @param {string} msg - Message
   * @param {*} data - Optional data
   */
  static info(module, msg, data) {
    this.log(this.LEVELS.INFO, module, msg, data);
  }

  /**
   * Warning level log
   * @param {string} module - Module name
   * @param {string} msg - Message
   * @param {*} data - Optional data
   */
  static warn(module, msg, data) {
    this.log(this.LEVELS.WARN, module, msg, data);
  }

  /**
   * Error level log
   * @param {string} module - Module name
   * @param {string} msg - Message
   * @param {*} data - Optional data
   */
  static error(module, msg, data) {
    this.log(this.LEVELS.ERROR, module, msg, data);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}
