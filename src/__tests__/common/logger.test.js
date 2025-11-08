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

  describe('Logger Comprehensive Tests', () => {
    describe('Logger formatting', () => {
      it('should format module name properly', () => {
        logger.log('Test');
        const message = consoleSpy.log.mock.calls[0][0];
        expect(message).toContain('[TestLogger]');
      });

      it('should include timestamp information', () => {
        logger.log('Timestamped message');
        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should handle long messages', () => {
        const longMessage = 'x'.repeat(1000);
        logger.log(longMessage);
        expect(consoleSpy.log).toHaveBeenCalled();
      });
    });

    describe('Logger data handling', () => {
      it('should handle complex objects', () => {
        const complexObj = { nested: { deep: { value: 123 } }, array: [1, 2, 3] };
        logger.log(complexObj);
        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should handle circular references', () => {
        const obj = { a: 1 };
        obj.self = obj;
        expect(() => logger.log(obj)).not.toThrow();
      });

      it('should handle multiple arguments', () => {
        logger.log('Msg1', 'Msg2', { data: 'test' }, [1, 2, 3]);
        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should preserve data types', () => {
        logger.log(42, 'string', true, null, undefined);
        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should handle large arrays', () => {
        const largeArray = new Array(1000).fill({ item: 'data' });
        logger.log(largeArray);
        expect(consoleSpy.log).toHaveBeenCalled();
      });
    });

    describe('Logger level management', () => {
      it('should filter logs by level', () => {
        Logger.setLevel(Logger.LEVELS.WARN);
        Logger.debug('DebugModule', 'Should not appear');
        Logger.warn('DebugModule', 'Should appear');
        
        expect(consoleSpy.debug).not.toHaveBeenCalled();
        expect(consoleSpy.warn).toHaveBeenCalled();
      });

      it('should respect ERROR level', () => {
        Logger.setLevel(Logger.LEVELS.ERROR);
        Logger.info('InfoModule', 'Should not appear');
        Logger.warn('WarnModule', 'Should not appear');
        Logger.error('ErrorModule', 'Should appear');
        
        expect(consoleSpy.info).not.toHaveBeenCalled();
        expect(consoleSpy.warn).not.toHaveBeenCalled();
        expect(consoleSpy.error).toHaveBeenCalled();
      });

      it('should allow level changes', () => {
        Logger.setLevel(Logger.LEVELS.DEBUG);
        Logger.debug('Module1', 'Message');
        const call1 = consoleSpy.debug.mock.calls.length;
        
        Logger.setLevel(Logger.LEVELS.ERROR);
        Logger.debug('Module2', 'Message');
        const call2 = consoleSpy.debug.mock.calls.length;
        
        expect(call2).toBe(call1);
      });

      it('should clamp invalid log levels', () => {
        Logger.setLevel(-100);
        expect(Logger.currentLevel).toBe(Logger.LEVELS.DEBUG);
        
        Logger.setLevel(1000);
        expect(Logger.currentLevel).toBe(Logger.LEVELS.ERROR);
      });
    });

    describe('Logger instance tests', () => {
      it('should maintain separate log history per instance', () => {
        const logger1 = new Logger('Logger1', 'DEBUG');
        const logger2 = new Logger('Logger2', 'DEBUG');
        
        logger1.info('Message1');
        logger2.info('Message2');
        
        expect(logger1.logs).toHaveLength(1);
        expect(logger2.logs).toHaveLength(1);
        expect(logger1.logs[0].message).toBe('Message1');
        expect(logger2.logs[0].message).toBe('Message2');
      });

      it('should respect maxLogs limit', () => {
        const smallLogger = new Logger('SmallLogger', 'DEBUG', 3);
        
        smallLogger.info('Message1');
        smallLogger.info('Message2');
        smallLogger.info('Message3');
        smallLogger.info('Message4');
        
        expect(smallLogger.logs.length).toBeLessThanOrEqual(3);
      });

      it('should store log metadata', () => {
        logger.info('Test message');
        
        expect(logger.logs[0]).toHaveProperty('level');
        expect(logger.logs[0]).toHaveProperty('message');
        expect(logger.logs[0]).toHaveProperty('timestamp');
      });

      it('should filter logs by level', () => {
        logger.debug('Debug');
        logger.info('Info');
        logger.warn('Warn');
        logger.error('Error');
        
        const debugLogs = logger.getLogs('DEBUG');
        expect(debugLogs).toHaveLength(1);
        expect(debugLogs[0].message).toBe('Debug');
      });

      it('should limit returned logs', () => {
        logger.info('Msg1');
        logger.info('Msg2');
        logger.info('Msg3');
        
        const limited = logger.getLogs(null, 2);
        expect(limited).toHaveLength(2);
      });
    });

    describe('Logger output formatting', () => {
      it('should format all log levels consistently', () => {
        logger.debug('Debug msg');
        logger.info('Info msg');
        logger.warn('Warn msg');
        logger.error('Error msg');
        
        expect(consoleSpy.log).toHaveBeenCalled();
        expect(consoleSpy.warn).toHaveBeenCalled();
        expect(consoleSpy.error).toHaveBeenCalled();
      });

      it('should include context in messages', () => {
        logger.info('Message with context', { userId: 123 });
        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should handle error objects', () => {
        const error = new Error('Test error');
        logger.error('An error occurred', error);
        expect(consoleSpy.error).toHaveBeenCalled();
      });
    });

    describe('Logger export functionality', () => {
      it('should export multiple logs', () => {
        logger.info('Message 1');
        logger.warn('Message 2');
        logger.error('Message 3');
        
        const exported = logger.export();
        const parsed = JSON.parse(exported);
        
        expect(parsed).toHaveLength(3);
      });

      it('should preserve log levels in export', () => {
        logger.debug('Debug');
        logger.error('Error');
        
        const exported = logger.export();
        const parsed = JSON.parse(exported);
        
        expect(parsed[0].level).toBe('DEBUG');
        expect(parsed[1].level).toBe('ERROR');
      });

      it('should export with timestamps', () => {
        logger.info('Test');
        const exported = logger.export();
        const parsed = JSON.parse(exported);
        
        expect(parsed[0].timestamp).toBeDefined();
      });
    });

    describe('Logger clear functionality', () => {
      it('should clear all logs', () => {
        logger.info('Message 1');
        logger.info('Message 2');
        expect(logger.logs).toHaveLength(2);
        
        logger.clear();
        expect(logger.logs).toHaveLength(0);
      });

      it('should clear only the current logger', () => {
        const logger1 = new Logger('Logger1', 'DEBUG');
        const logger2 = new Logger('Logger2', 'DEBUG');
        
        logger1.info('Message1');
        logger2.info('Message2');
        
        logger1.clear();
        expect(logger1.logs).toHaveLength(0);
        expect(logger2.logs).toHaveLength(1);
      });
    });

    describe('Static Logger API', () => {
      it('should use static methods without instance', () => {
        Logger.setLevel(Logger.LEVELS.DEBUG);
        Logger.debug('Static', 'message');
        expect(consoleSpy.debug).toHaveBeenCalled();
      });

      it('should maintain global level', () => {
        Logger.setLevel(Logger.LEVELS.WARN);
        Logger.info('Module', 'Should not appear');
        Logger.warn('Module', 'Should appear');
        
        expect(consoleSpy.info).not.toHaveBeenCalled();
        expect(consoleSpy.warn).toHaveBeenCalled();
      });
    });
  });
});