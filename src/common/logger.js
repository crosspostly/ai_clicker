/**
 * Logger utility for debugging and monitoring
 * Provides structured logging with levels and timestamps
 */

class Logger {
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
   * Core logging method
   */
  log(level, message, data = null) {
    if (!this.shouldLog(level)) return;

    const timestamp = this.getTimestamp();
    const prefix = `[${timestamp}] [${this.name}] [${level}]`;
    const fullMessage = `${prefix} ${message}`;

    // Store in memory
    this.logs.push({ level, message, data, timestamp });
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const style = this.getConsoleStyle(level);
    if (data !== null && typeof data === 'object') {
      console.log(`%c${fullMessage}`, style, data);
    } else {
      console.log(`%c${fullMessage}`, style);
    }
  }

  debug(message, data = null) {
    this.log('DEBUG', message, data);
  }

  info(message, data = null) {
    this.log('INFO', message, data);
  }

  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  error(message, data = null) {
    this.log('ERROR', message, data);
  }

  /**
   * Get all stored logs
   */
  getLogs(level = null, limit = 100) {
    let logs = this.logs;
    if (level) {
      logs = logs.filter(log => log.level === level);
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
   * Set log level
   */
  setLevel(level) {
    if (['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(level)) {
      this.level = level;
    }
  }
}

// Default logger instance
const globalLogger = new Logger('AI-Autoclicker', 'INFO');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, globalLogger };
}
