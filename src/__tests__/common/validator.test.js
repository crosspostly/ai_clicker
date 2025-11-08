/**
 * Tests for data validation utilities
 */

import { Validator } from '../../common/validator.js';

describe('Validator', () => {
  describe('validateAction()', () => {
    it('should validate valid click action', () => {
      const action = {
        type: 'click',
        target: 'button',
        selector: '.btn',
      };

      const result = Validator.validateAction(action);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid input action', () => {
      const action = {
        type: 'input',
        target: 'email field',
        value: 'test@example.com',
      };

      const result = Validator.validateAction(action);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid wait action', () => {
      const action = {
        type: 'wait',
        duration: 1000,
      };

      const result = Validator.validateAction(action);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject action without type', () => {
      const action = {
        target: 'button',
      };

      const result = Validator.validateAction(action);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action type is required');
    });

    it('should reject invalid action type', () => {
      const action = {
        type: 'invalid_type',
        target: 'button',
      };

      const result = Validator.validateAction(action);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid action type: invalid_type');
    });

    it('should reject input action without value', () => {
      const action = {
        type: 'input',
        target: 'email field',
      };

      const result = Validator.validateAction(action);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input action requires value');
    });

    it('should reject wait action with invalid duration', () => {
      const action = {
        type: 'wait',
        duration: -1000,
      };

      const result = Validator.validateAction(action);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Wait duration must be positive');
    });

    it('should reject non-object action', () => {
      const result = Validator.validateAction('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action must be an object');
    });
  });

  describe('validateScenario()', () => {
    it('should validate valid scenario', () => {
      const scenario = {
        id: 1,
        name: 'Test Scenario',
        description: 'A test scenario',
        actions: [
          { type: 'click', target: 'button' },
          { type: 'input', value: 'test', target: 'field' },
        ],
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = Validator.validateScenario(scenario);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject scenario without name', () => {
      const scenario = {
        id: 1,
        actions: [],
      };

      const result = Validator.validateScenario(scenario);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scenario name is required');
    });

    it('should reject scenario without actions', () => {
      const scenario = {
        id: 1,
        name: 'Test Scenario',
      };

      const result = Validator.validateScenario(scenario);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scenario must have at least one action');
    });

    it('should reject scenario with invalid actions', () => {
      const scenario = {
        id: 1,
        name: 'Test Scenario',
        actions: [
          { type: 'invalid_type' },
        ],
      };

      const result = Validator.validateScenario(scenario);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-object scenario', () => {
      const result = Validator.validateScenario('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scenario must be an object');
    });
  });

  describe('validateApiKey()', () => {
    it('should validate valid Gemini API key', () => {
      const apiKey = 'AIzaSyDaGmWKa4JsXZ-HjGwBGRSgSxOqN7-8h8';
      const result = Validator.validateApiKey(apiKey);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty API key', () => {
      const result = Validator.validateApiKey('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });

    it('should reject null API key', () => {
      const result = Validator.validateApiKey(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });

    it('should reject short API key', () => {
      const result = Validator.validateApiKey('short');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API key is too short');
    });

    it('should reject API key without valid format', () => {
      const result = Validator.validateApiKey('invalid-key-format');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid API key format');
    });
  });

  describe('validateInstruction()', () => {
    it('should validate non-empty instruction', () => {
      const result = Validator.validateInstruction('Click the button');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty instruction', () => {
      const result = Validator.validateInstruction('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Instruction cannot be empty');
    });

    it('should reject whitespace-only instruction', () => {
      const result = Validator.validateInstruction('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Instruction cannot be empty');
    });

    it('should reject null instruction', () => {
      const result = Validator.validateInstruction(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Instruction cannot be empty');
    });

    it('should reject instruction that is too long', () => {
      const longInstruction = 'a'.repeat(10000);
      const result = Validator.validateInstruction(longInstruction);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Instruction is too long');
    });
  });

  describe('validateSettings()', () => {
    it('should validate valid settings', () => {
      const settings = {
        apiKey: 'AIzaSyDaGmWKa4JsXZ-HjGwBGRSgSxOqN7-8h8',
        autoMode: true,
        playbackSpeed: 1.0,
        debugMode: false,
      };

      const result = Validator.validateSettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate settings with invalid API key', () => {
      const settings = {
        apiKey: 'invalid',
        autoMode: true,
      };

      const result = Validator.validateSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid playback speed', () => {
      const settings = {
        playbackSpeed: 5.0,
      };

      const result = Validator.validateSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Playback speed must be between 0.1 and 3.0');
    });

    it('should reject settings with invalid boolean values', () => {
      const settings = {
        autoMode: 'not-a-boolean',
      };

      const result = Validator.validateSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Auto mode must be a boolean');
    });
  });

  describe('validateSelector()', () => {
    it('should validate valid CSS selector', () => {
      const selectors = [
        '.class',
        '#id',
        'button',
        'div.container',
        'input[type="text"]',
        '.class1.class2',
        '#id1 .class1',
      ];

      selectors.forEach(selector => {
        const result = Validator.validateSelector(selector);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid CSS selector', () => {
      const invalidSelectors = [
        '',
        '##double-hash',
        '.class.',
        '[invalid',
        'div > > span',
      ];

      invalidSelectors.forEach(selector => {
        const result = Validator.validateSelector(selector);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject null selector', () => {
      const result = Validator.validateSelector(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Selector cannot be null or empty');
    });
  });

  describe('sanitizeInput()', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = Validator.sanitizeInput(input);
      expect(result).toBe('Hello');
    });

    it('should escape HTML entities', () => {
      const input = '<div>Test & "quotes"</div>';
      const result = Validator.sanitizeInput(input);
      expect(result).not.toContain('<div>');
      expect(result).not.toContain('</div>');
    });

    it('should handle null input', () => {
      const result = Validator.sanitizeInput(null);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = Validator.sanitizeInput(undefined);
      expect(result).toBe('');
    });

    it('should preserve safe text', () => {
      const input = 'Hello World 123!';
      const result = Validator.sanitizeInput(input);
      expect(result).toBe(input);
    });
  });

  describe('isValidUrl()', () => {
    it('should validate valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://www.google.com',
        'https://api.example.com/v1/test',
      ];

      validUrls.forEach(url => {
        expect(Validator.isValidUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        '',
        null,
        undefined,
      ];

      invalidUrls.forEach(url => {
        expect(Validator.isValidUrl(url)).toBe(false);
      });
    });
  });
});