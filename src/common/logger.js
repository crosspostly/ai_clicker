/**
 * Logger utility for debugging and monitoring
 * Provides structured logging with levels and timestamps
 */

export class Logger {
  static LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  static currentLevel = Logger.LEVELS.INFO;

  /**
   * Set the minimum log level
   * @param {number} level - Log level (0-3)
   */
  static setLevel(level) {
    this.currentLevel = Math.max(0, Math.min(3, level));
  }

  /**
   * Core logging method
   * @param {number} level - Log level constant
   * @param {string} module - Module/component name
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
   * Log debug level message
   * @param {string} module - Module/component name
   * @param {string} msg - Log message
   * @param {*} data - Optional data
   */
  static debug(module, msg, data) {
    this.log(this.LEVELS.DEBUG, module, msg, data);
  }

  /**
   * Log info level message
   * @param {string} module - Module/component name
   * @param {string} msg - Log message
   * @param {*} data - Optional data
   */
  static info(module, msg, data) {
    this.log(this.LEVELS.INFO, module, msg, data);
  }

  /**
   * Log warning level message
   * @param {string} module - Module/component name
   * @param {string} msg - Log message
   * @param {*} data - Optional data
   */
  static warn(module, msg, data) {
    this.log(this.LEVELS.WARN, module, msg, data);
  }

  /**
   * Log error level message
   * @param {string} module - Module/component name
   * @param {string} msg - Log message
   * @param {*} data - Optional data
   */
  static error(module, msg, data) {
    this.log(this.LEVELS.ERROR, module, msg, data);
  }

  // Instance-based API for backward compatibility
  constructor(name = 'AI-Autoclicker', level = 'INFO') {
    this.name = name;
    this.level = level;
    this.logs = [];
    this.maxLogs = 500;
  }

  /**
   * Get current log level numeric value
   */
  getLogLevelValue(level) {
    const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    return levels[level] || 1;
  }

  /**
   * Check if message should be logged based on level
   */
  shouldLog(level) {
    return this.getLogLevelValue(level) >= this.getLogLevelValue(this.level);
  }

  /**
   * Format timestamp
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString().split('T')[1].slice(0, 12);
  }

  /**
   * Get styled console output
   */
  getConsoleStyle(level) {
    const styles = {
      DEBUG: 'color: #888; font-weight: normal;',
      INFO: 'color: #0066cc; font-weight: normal;',
      WARN: 'color: #ff9900; font-weight: bold;',
      ERROR: 'color: #cc0000; font-weight: bold;',
    };
    return styles[level] || '';
  }

  /**
   * Core instance logging method
   */
  instanceLog(level, message, data = null) {
    if (!this.shouldLog(level)) return;

    const timestamp = this.getTimestamp();
    const prefix = `[${timestamp}] [${this.name}] [${level}]`;
    const fullMessage = `${prefix} ${message}`;

    this.logs.push({ level, message, data, timestamp });
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const style = this.getConsoleStyle(level);
    if (data !== null && typeof data === 'object') {
      console.log(`%c${fullMessage}`, style, data);
    } else {
      console.log(`%c${fullMessage}`, style);
    }
  }

  /**
   * Instance debug method
   */
  debug(message, data = null) {
    this.instanceLog('DEBUG', message, data);
  }

  /**
   * Instance info method
   */
  info(message, data = null) {
    this.instanceLog('INFO', message, data);
  }

  /**
   * Instance warn method
   */
  warn(message, data = null) {
    this.instanceLog('WARN', message, data);
  }

  /**
   * Instance error method
   */
  error(message, data = null) {
    this.instanceLog('ERROR', message, data);
  }

  /**
   * Get all stored logs
   */
  getLogs(level = null, limit = 100) {
    let logs = this.logs;
    if (level) {
      logs = logs.filter((log) => log.level === level);
    }
    return logs.slice(-limit);
  }

  /**
   * Clear logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  export() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Set instance log level
   */
  setLevel(level) {
    if (['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(level)) {
      this.level = level;
    }
  }
}

// Default logger instance
export const globalLogger = new Logger('AI-Autoclicker', 'INFO');
