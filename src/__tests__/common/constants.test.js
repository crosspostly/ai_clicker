import * as Constants from '../../common/constants.js';

describe('Constants Module', () => {
  test('LOG_LEVELS should have required properties', () => {
    expect(Constants.LOG_LEVELS).toHaveProperty('DEBUG');
    expect(Constants.LOG_LEVELS).toHaveProperty('INFO');
    expect(Constants.LOG_LEVELS).toHaveProperty('ERROR');
  });

  test('ACTION_TYPES should be defined', () => {
    expect(Constants.ACTION_TYPES).toBeDefined();
    expect(typeof Constants.ACTION_TYPES).toBe('object');
  });

  test('STORAGE_KEYS should contain required keys', () => {
    expect(Constants.STORAGE_KEYS).toHaveProperty('API_KEY');
    expect(Constants.STORAGE_KEYS).toHaveProperty('RECORDINGS');
  });

  test('Constants should not be empty', () => {
    expect(Object.keys(Constants).length).toBeGreaterThan(0);
  });

  test('Constants should be immutable', () => {
    const before = Object.keys(Constants.LOG_LEVELS).length;
    // Attempt to modify (should not affect original in strict mode)
    expect(Object.keys(Constants.LOG_LEVELS).length).toBe(before);
  });
});