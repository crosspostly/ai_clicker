import { Logger } from '../../common/logger.js';
import { Validator, ValidationError } from '../../common/validator.js';
import { StorageManager } from '../../common/storage.js';
import { Helpers } from '../../common/helpers.js';
import { EventEmitter } from '../../common/events.js';

describe('ES6 Modules Integration', () => {
  test('All modules should be importable', () => {
    expect(Logger).toBeDefined();
    expect(Validator).toBeDefined();
    expect(StorageManager).toBeDefined();
    expect(Helpers).toBeDefined();
    expect(EventEmitter).toBeDefined();
  });

  test('Logger and Validator should work together', () => {
    const logger = new Logger('Test');
    const validator = new Validator();
    expect(logger).toBeDefined();
    expect(validator).toBeDefined();
  });

  test('StorageManager and EventEmitter should work together', () => {
    const storage = new StorageManager();
    const emitter = new EventEmitter();
    const listener = jest.fn();
    emitter.on('storage-ready', listener);
    emitter.emit('storage-ready');
    expect(listener).toHaveBeenCalled();
  });

  test('All classes should have proper methods', () => {
    const logger = new Logger('Test');
    const validator = new Validator();
    const storage = new StorageManager();
    const helpers = new Helpers();
    const emitter = new EventEmitter();

    expect(typeof logger.log).toBe('function');
    expect(typeof validator.isString).toBe('function');
    expect(typeof storage.get).toBe('function');
    expect(typeof helpers.delay).toBe('function');
    expect(typeof emitter.on).toBe('function');
  });

  test('Error classes should be throwable', () => {
    expect(() => {
      throw new ValidationError('Test error');
    }).toThrow(ValidationError);

    expect(() => {
      throw new Error('Test error');
    }).toThrow();
  });
});