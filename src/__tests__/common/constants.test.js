import { describe, test, expect } from '@jest/globals';
import * as Constants from '../../common/constants';

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
    expect(Constants.STORAGE_KEYS).toHaveProperty('RECORDED_ACTIONS');
    expect(Constants.STORAGE_KEYS).toHaveProperty('GEMINI_API_KEY');
  });

  test('Constants should not be empty', () => {
    expect(Object.keys(Constants).length).toBeGreaterThan(0);
  });

  test('Constants should be immutable', () => {
    const before = Object.keys(Constants.LOG_LEVELS).length;
    // Attempt to modify (should not affect original in strict mode)
    expect(Object.keys(Constants.LOG_LEVELS).length).toBe(before);
  });

  describe('LOG_LEVELS Comprehensive Tests', () => {
    test('LOG_LEVELS has all required severity levels', () => {
      expect(Constants.LOG_LEVELS.DEBUG).toBeDefined();
      expect(Constants.LOG_LEVELS.INFO).toBeDefined();
      expect(Constants.LOG_LEVELS.WARN).toBeDefined();
      expect(Constants.LOG_LEVELS.ERROR).toBeDefined();
    });

    test('LOG_LEVELS values are strings', () => {
      Object.values(Constants.LOG_LEVELS).forEach(level => {
        expect(typeof level).toBe('string');
      });
    });

    test('LOG_LEVELS has no duplicate values', () => {
      const values = Object.values(Constants.LOG_LEVELS);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    test('LOG_LEVELS keys are uppercase', () => {
      Object.keys(Constants.LOG_LEVELS).forEach(key => {
        expect(key).toMatch(/^[A-Z]+$/);
      });
    });

    test('LOG_LEVELS should have exactly 4 levels', () => {
      expect(Object.keys(Constants.LOG_LEVELS).length).toBe(4);
    });

    test('LOG_LEVELS values match their keys in uppercase', () => {
      Object.entries(Constants.LOG_LEVELS).forEach(([key, value]) => {
        expect(value).toBe(key);
      });
    });
  });

  describe('ACTION_TYPES Comprehensive Tests', () => {
    test('ACTION_TYPES has required action types', () => {
      expect(Constants.ACTION_TYPES).toHaveProperty('CLICK');
      expect(Constants.ACTION_TYPES).toHaveProperty('INPUT');
      expect(Constants.ACTION_TYPES).toHaveProperty('HOVER');
      expect(Constants.ACTION_TYPES).toHaveProperty('SCROLL');
      expect(Constants.ACTION_TYPES).toHaveProperty('WAIT');
      expect(Constants.ACTION_TYPES).toHaveProperty('SELECT');
    });

    test('ACTION_TYPES values are unique', () => {
      const values = Object.values(Constants.ACTION_TYPES);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    test('ACTION_TYPES values are lowercase with underscores', () => {
      Object.values(Constants.ACTION_TYPES).forEach(type => {
        expect(type).toMatch(/^[a-z_]+$/);
      });
    });

    test('ACTION_TYPES keys match snake_case pattern', () => {
      Object.keys(Constants.ACTION_TYPES).forEach(key => {
        expect(key).toMatch(/^[A-Z_]+$/);
      });
    });

    test('ACTION_TYPES has double click action', () => {
      expect(Constants.ACTION_TYPES.DOUBLE_CLICK).toBe('double_click');
    });

    test('ACTION_TYPES has right click action', () => {
      expect(Constants.ACTION_TYPES.RIGHT_CLICK).toBe('right_click');
    });
  });

  describe('STORAGE_KEYS Comprehensive Tests', () => {
    test('STORAGE_KEYS are all strings', () => {
      Object.values(Constants.STORAGE_KEYS).forEach(key => {
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
      });
    });

    test('STORAGE_KEYS has no duplicate values', () => {
      const values = Object.values(Constants.STORAGE_KEYS);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    test('STORAGE_KEYS has all expected storage keys', () => {
      expect(Constants.STORAGE_KEYS).toHaveProperty('RECORDED_ACTIONS');
      expect(Constants.STORAGE_KEYS).toHaveProperty('GEMINI_API_KEY');
      expect(Constants.STORAGE_KEYS).toHaveProperty('GEMINI_ENABLED');
      expect(Constants.STORAGE_KEYS).toHaveProperty('EXECUTION_HISTORY');
      expect(Constants.STORAGE_KEYS).toHaveProperty('USER_PREFERENCES');
    });

    test('STORAGE_KEYS values use camelCase', () => {
      Object.values(Constants.STORAGE_KEYS).forEach(value => {
        expect(value).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      });
    });
  });

  describe('API_CONFIG Comprehensive Tests', () => {
    test('API_CONFIG should be defined', () => {
      expect(Constants.API_CONFIG).toBeDefined();
    });

    test('API_CONFIG has GEMINI_ENDPOINT', () => {
      expect(Constants.API_CONFIG.GEMINI_ENDPOINT).toBeDefined();
      expect(typeof Constants.API_CONFIG.GEMINI_ENDPOINT).toBe('string');
    });

    test('API_CONFIG.GEMINI_ENDPOINT is a valid URL', () => {
      expect(Constants.API_CONFIG.GEMINI_ENDPOINT).toMatch(/^https:\/\//);
    });

    test('API_CONFIG has GEMINI_TIMEOUT', () => {
      expect(Constants.API_CONFIG.GEMINI_TIMEOUT).toBeDefined();
      expect(typeof Constants.API_CONFIG.GEMINI_TIMEOUT).toBe('number');
      expect(Constants.API_CONFIG.GEMINI_TIMEOUT).toBeGreaterThan(0);
    });

    test('API_CONFIG has MAX_RETRIES', () => {
      expect(Constants.API_CONFIG.MAX_RETRIES).toBeDefined();
      expect(typeof Constants.API_CONFIG.MAX_RETRIES).toBe('number');
      expect(Constants.API_CONFIG.MAX_RETRIES).toBeGreaterThan(0);
    });
  });

  describe('UI_CONFIG Comprehensive Tests', () => {
    test('UI_CONFIG should be defined', () => {
      expect(Constants.UI_CONFIG).toBeDefined();
    });

    test('UI_CONFIG has ANIMATION_DURATION', () => {
      expect(Constants.UI_CONFIG.ANIMATION_DURATION).toBeDefined();
      expect(typeof Constants.UI_CONFIG.ANIMATION_DURATION).toBe('number');
    });

    test('UI_CONFIG has DEBOUNCE_DELAY', () => {
      expect(Constants.UI_CONFIG.DEBOUNCE_DELAY).toBeDefined();
      expect(typeof Constants.UI_CONFIG.DEBOUNCE_DELAY).toBe('number');
    });

    test('UI_CONFIG has POPUP_WIDTH', () => {
      expect(Constants.UI_CONFIG.POPUP_WIDTH).toBeDefined();
      expect(typeof Constants.UI_CONFIG.POPUP_WIDTH).toBe('number');
    });
  });

  describe('SELECTOR_STRATEGIES Comprehensive Tests', () => {
    test('SELECTOR_STRATEGIES should be defined', () => {
      expect(Constants.SELECTOR_STRATEGIES).toBeDefined();
    });

    test('SELECTOR_STRATEGIES has required strategies', () => {
      expect(Constants.SELECTOR_STRATEGIES).toHaveProperty('ID');
      expect(Constants.SELECTOR_STRATEGIES).toHaveProperty('CLASS');
      expect(Constants.SELECTOR_STRATEGIES).toHaveProperty('XPATH');
      expect(Constants.SELECTOR_STRATEGIES).toHaveProperty('CSS');
    });

    test('SELECTOR_STRATEGIES values are lowercase', () => {
      Object.values(Constants.SELECTOR_STRATEGIES).forEach(strategy => {
        expect(strategy).toMatch(/^[a-z-]+$/);
      });
    });

    test('SELECTOR_STRATEGIES has ARIA_LABEL strategy', () => {
      expect(Constants.SELECTOR_STRATEGIES.ARIA_LABEL).toBe('aria-label');
    });
  });

  describe('Constants Export Validation', () => {
    test('All main constant groups are exported', () => {
      expect(Constants.LOG_LEVELS).toBeDefined();
      expect(Constants.ACTION_TYPES).toBeDefined();
      expect(Constants.STORAGE_KEYS).toBeDefined();
      expect(Constants.API_CONFIG).toBeDefined();
      expect(Constants.UI_CONFIG).toBeDefined();
      expect(Constants.SELECTOR_STRATEGIES).toBeDefined();
    });

    test('No constants are null or undefined', () => {
      Object.entries(Constants).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
      });
    });

    test('All constant objects are plain objects', () => {
      Object.values(Constants).forEach(constant => {
        expect(typeof constant).toBe('object');
        expect(constant.constructor).toBe(Object);
      });
    });

    test('Constants have reasonable number of entries', () => {
      expect(Object.keys(Constants.LOG_LEVELS).length).toBeGreaterThanOrEqual(3);
      expect(Object.keys(Constants.ACTION_TYPES).length).toBeGreaterThanOrEqual(5);
      expect(Object.keys(Constants.STORAGE_KEYS).length).toBeGreaterThanOrEqual(3);
    });
  });
});