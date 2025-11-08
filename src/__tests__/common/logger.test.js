/**
 * Tests for logger utility
 */

import { Logger, globalLogger } from '../../common/logger.js';

describe('Logger (Static API)', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
    Logger.setLevel(Logger.LEVELS.DEBUG); // Enable all logs for testing
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    Logger.setLevel(Logger.LEVELS.INFO); // Reset to default
  });

  describe('setLevel()', () => {
    it('should set the minimum log level', () => {
      Logger.setLevel(Logger.LEVELS.WARN);
      expect(Logger.currentLevel).toBe(Logger.LEVELS.WARN);
    });

    it('should clamp level to valid range', () => {
      Logger.setLevel(-1);
      expect(Logger.currentLevel).toBe(Logger.LEVELS.DEBUG);
      
      Logger.setLevel(10);
      expect(Logger.currentLevel).toBe(Logger.LEVELS.ERROR);
    });
  });

  describe('debug()', () => {
    it('should log debug messages when debug level is enabled', () => {
      Logger.debug('TestModule', 'Test debug message');
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        'Test debug message',
      );
    });

    it('should not log debug messages when level is higher', () => {
      Logger.setLevel(Logger.LEVELS.INFO);
      Logger.debug('TestModule', 'Test debug message');
      
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should log debug messages with data', () => {
      const testData = { key: 'value' };
      Logger.debug('TestModule', 'Test debug message', testData);
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        'Test debug message',
        testData,
      );
    });
  });

  describe('info()', () => {
    it('should log info messages', () => {
      Logger.info('TestModule', 'Test info message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        'Test info message',
      );
    });

    it('should log info messages with data', () => {
      const testData = { key: 'value' };
      Logger.info('TestModule', 'Test info message', testData);
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        'Test info message',
        testData,
      );
    });
  });

  describe('warn()', () => {
    it('should log warning messages', () => {
      Logger.warn('TestModule', 'Test warning message');
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        'Test warning message',
      );
    });

    it('should log warning messages with data', () => {
      const testData = { key: 'value' };
      Logger.warn('TestModule', 'Test warning message', testData);
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        'Test warning message',
        testData,
      );
    });
  });

  describe('error()', () => {
    it('should log error messages', () => {
      Logger.error('TestModule', 'Test error message');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        'Test error message',
      );
    });

    it('should log error messages with data', () => {
      const error = new Error('Test error');
      Logger.error('TestModule', 'Error occurred', error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        'Error occurred',
        error,
      );
    });
  });
});

describe('Logger (Instance API)', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = new Logger('TestLogger', 'DEBUG');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('constructor()', () => {
    it('should initialize with default values', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger.name).toBe('AI-Autoclicker');
      expect(defaultLogger.level).toBe('INFO');
      expect(defaultLogger.logs).toEqual([]);
      expect(defaultLogger.maxLogs).toBe(500);
    });

    it('should accept custom name and level', () => {
      const customLogger = new Logger('CustomLogger', 'DEBUG');
      expect(customLogger.name).toBe('CustomLogger');
      expect(customLogger.level).toBe('DEBUG');
    });
  });

  describe('debug()', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('Test debug message'),
      );
    });

    it('should store debug message in logs', () => {
      logger.debug('Test debug message');
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0].level).toBe('DEBUG');
      expect(logger.logs[0].message).toBe('Test debug message');
    });
  });

  describe('info()', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Test info message'),
      );
    });
  });

  describe('warn()', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('Test warning message'),
      );
    });
  });

  describe('error()', () => {
    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Test error message'),
      );
    });
  });

  describe('setLevel()', () => {
    it('should set valid log levels', () => {
      logger.setLevel('WARN');
      expect(logger.level).toBe('WARN');
    });

    it('should ignore invalid log levels', () => {
      logger.setLevel('INVALID');
      expect(logger.level).toBe('DEBUG');
    });
  });

  describe('getLogs()', () => {
    beforeEach(() => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
    });

    it('should return all logs by default', () => {
      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
    });

    it('should filter logs by level', () => {
      const debugLogs = logger.getLogs('DEBUG');
      expect(debugLogs).toHaveLength(1);
      expect(debugLogs[0].level).toBe('DEBUG');
    });

    it('should limit number of logs returned', () => {
      const logs = logger.getLogs(null, 2);
      expect(logs).toHaveLength(2);
    });
  });

  describe('clear()', () => {
    it('should clear all logs', () => {
      logger.info('Test message');
      expect(logger.logs).toHaveLength(1);
      
      logger.clear();
      expect(logger.logs).toHaveLength(0);
    });
  });

  describe('export()', () => {
    it('should export logs as JSON', () => {
      logger.info('Test message');
      const exported = logger.export();
      
      expect(() => JSON.parse(exported)).not.toThrow();
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test message');
    });
  });
});