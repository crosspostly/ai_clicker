/**
 * Tests for Settings Validator service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SettingsValidator, settingsValidator } from '../../src/services/settingsValidator.js';
import { DEFAULT_SETTINGS, LANGUAGES, THEMES, API_CONFIG } from '../../src/common/constants.js';

describe('SettingsValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new SettingsValidator();
  });

  describe('Initialization', () => {
    it('should initialize with validation rules', () => {
      expect(validator.validationRules).toBeDefined();
      expect(validator.validationRules.gemini).toBeDefined();
      expect(validator.validationRules.ui).toBeDefined();
      expect(validator.validationRules.shortcuts).toBeDefined();
    });

    it('should have correct API key validation rules', () => {
      const apiKeyRules = validator.validationRules.gemini.apiKey;
      
      expect(apiKeyRules.type).toBe('string');
      expect(apiKeyRules.required).toBe(false);
      expect(apiKeyRules.minLength).toBe(39);
      expect(apiKeyRules.maxLength).toBe(39);
      expect(apiKeyRules.pattern).toBe(/^AIza[0-9A-Za-z_-]{35}$/);
    });

    it('should have correct model validation rules', () => {
      const modelRules = validator.validationRules.gemini.model;
      
      expect(modelRules.type).toBe('string');
      expect(modelRules.required).toBe(true);
      expect(modelRules.enum).toContain('auto');
      expect(modelRules.enum).toContain('gemini-2.0-flash-exp');
      expect(modelRules.default).toBe('auto');
    });

    it('should have correct timeout validation rules', () => {
      const timeoutRules = validator.validationRules.gemini.timeout;
      
      expect(timeoutRules.type).toBe('number');
      expect(timeoutRules.required).toBe(true);
      expect(timeoutRules.min).toBe(5000);
      expect(timeoutRules.max).toBe(600000);
      expect(timeoutRules.default).toBe(120000);
    });

    it('should have correct theme validation rules', () => {
      const themeRules = validator.validationRules.ui.theme;
      
      expect(themeRules.type).toBe('string');
      expect(themeRules.required).toBe(true);
      expect(themeRules.enum).toEqual(Object.values(THEMES));
      expect(themeRules.default).toBe('dark');
    });

    it('should have correct shortcut validation rules', () => {
      const shortcutRules = validator.validationRules.shortcuts.toggleRecording;
      
      expect(shortcutRules.type).toBe('string');
      expect(shortcutRules.required).toBe(true);
      expect(shortcutRules.pattern).toBe(/^(Ctrl|Alt|Shift|Meta)\+\w( \+ (Ctrl|Alt|Shift|Meta)\+\w)*$/);
      expect(shortcutRules.default).toBe('Ctrl+Shift+R');
    });
  });

  describe('Settings Validation', () => {
    it('should validate complete valid settings', () => {
      const validSettings = {
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
          model: 'auto',
          timeout: 120000,
          language: 'auto',
        },
        ui: {
          theme: 'dark',
          compactMode: false,
        },
        shortcuts: {
          toggleRecording: 'Ctrl+Shift+R',
          toggleVoice: 'Ctrl+Shift+V',
          playback: 'Ctrl+Shift+P',
        },
      };

      const result = validator.validateSettings(validSettings);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedSettings).toEqual(validSettings);
    });

    it('should handle missing required fields', () => {
      const invalidSettings = {
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
          // missing model, timeout, language
        },
        ui: {
          // missing theme, compactMode
        },
        shortcuts: {
          // missing all shortcuts
        },
      };

      const result = validator.validateSettings(invalidSettings);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.sanitizedSettings.gemini.model).toBe('auto');
      expect(result.sanitizedSettings.gemini.timeout).toBe(120000);
      expect(result.sanitizedSettings.ui.theme).toBe('dark');
    });

    it('should validate API key format', () => {
      const settingsWithInvalidKey = {
        ...DEFAULT_SETTINGS,
        gemini: {
          ...DEFAULT_SETTINGS.gemini,
          apiKey: 'invalid-key',
        },
      };

      const result = validator.validateSettings(settingsWithInvalidKey);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('API key'))).toBe(true);
    });

    it('should validate timeout range', () => {
      const settingsWithInvalidTimeout = {
        ...DEFAULT_SETTINGS,
        gemini: {
          ...DEFAULT_SETTINGS.gemini,
          timeout: 1000, // Too low
        },
      };

      const result = validator.validateSettings(settingsWithInvalidTimeout);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('timeout'))).toBe(true);
    });

    it('should validate model enum', () => {
      const settingsWithInvalidModel = {
        ...DEFAULT_SETTINGS,
        gemini: {
          ...DEFAULT_SETTINGS.gemini,
          model: 'invalid-model',
        },
      };

      const result = validator.validateSettings(settingsWithInvalidModel);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('model'))).toBe(true);
    });

    it('should validate language enum', () => {
      const settingsWithInvalidLanguage = {
        ...DEFAULT_SETTINGS,
        gemini: {
          ...DEFAULT_SETTINGS.gemini,
          language: 'invalid-language',
        },
      };

      const result = validator.validateSettings(settingsWithInvalidLanguage);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('language'))).toBe(true);
    });

    it('should validate theme enum', () => {
      const settingsWithInvalidTheme = {
        ...DEFAULT_SETTINGS,
        ui: {
          ...DEFAULT_SETTINGS.ui,
          theme: 'invalid-theme',
        },
      };

      const result = validator.validateSettings(settingsWithInvalidTheme);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('theme'))).toBe(true);
    });

    it('should validate shortcut format', () => {
      const settingsWithInvalidShortcut = {
        ...DEFAULT_SETTINGS,
        shortcuts: {
          ...DEFAULT_SETTINGS.shortcuts,
          toggleRecording: 'invalid-shortcut',
        },
      };

      const result = validator.validateSettings(settingsWithInvalidShortcut);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Shortcut'))).toBe(true);
    });

    it('should handle unknown fields with warnings', () => {
      const settingsWithUnknownFields = {
        ...DEFAULT_SETTINGS,
        gemini: {
          ...DEFAULT_SETTINGS.gemini,
          unknownField: 'value',
        },
      };

      const result = validator.validateSettings(settingsWithUnknownFields);

      expect(result.warnings.some(warning => warning.includes('unknownField'))).toBe(true);
      expect(result.sanitizedSettings.gemini.unknownField).toBe('value');
    });

    it('should perform cross-section validation', () => {
      const settingsWithApiKeyNoModel = {
        ...DEFAULT_SETTINGS,
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
          model: null, // Invalid model
          timeout: 120000,
          language: 'auto',
        },
      };

      const result = validator.validateSettings(settingsWithApiKeyNoModel);

      expect(result.warnings.some(warning => warning.includes('API key provided'))).toBe(true);
    });
  });

  describe('Type Coercion', () => {
    it('should coerce string to number', () => {
      const fieldRules = { type: 'number', min: 0, max: 100 };
      const result = validator._validateField('test', '42', fieldRules);

      expect(result.sanitizedValue).toBe(42);
      expect(result.isValid).toBe(true);
    });

    it('should coerce string to boolean', () => {
      const fieldRules = { type: 'boolean' };
      
      let result = validator._validateField('test', 'true', fieldRules);
      expect(result.sanitizedValue).toBe(true);

      result = validator._validateField('test', 'false', fieldRules);
      expect(result.sanitizedValue).toBe(false);

      result = validator._validateField('test', '1', fieldRules);
      expect(result.sanitizedValue).toBe(true);

      result = validator._validateField('test', '0', fieldRules);
      expect(result.sanitizedValue).toBe(false);
    });

    it('should coerce to string', () => {
      const fieldRules = { type: 'string' };
      const result = validator._validateField('test', 123, fieldRules);

      expect(result.sanitizedValue).toBe('123');
      expect(result.isValid).toBe(true);
    });

    it('should handle coercion errors gracefully', () => {
      const fieldRules = { type: 'number' };
      const result = validator._validateField('test', 'not-a-number', fieldRules);

      expect(result.sanitizedValue).toBe(0); // Fallback value
      expect(result.isValid).toBe(true); // Should not fail on coercion
    });
  });

  describe('Default Settings', () => {
    it('should return default settings', () => {
      const defaults = validator.getDefaults();

      expect(defaults).toEqual(DEFAULT_SETTINGS);
    });

    it('should merge with defaults', () => {
      const partialSettings = {
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
        },
      };

      const merged = validator.mergeWithDefaults(partialSettings);

      expect(merged.gemini.apiKey).toBe('AIza123456789012345678901234567890123456');
      expect(merged.gemini.model).toBe('auto');
      expect(merged.gemini.timeout).toBe(120000);
      expect(merged.ui.theme).toBe('dark');
    });

    it('should deep merge nested objects', () => {
      const settings = {
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
          timeout: 60000,
        },
      };

      const merged = validator.mergeWithDefaults(settings);

      expect(merged.gemini.apiKey).toBe('AIza123456789012345678901234567890123456');
      expect(merged.gemini.timeout).toBe(60000);
      expect(merged.gemini.model).toBe('auto'); // Should be preserved from defaults
    });
  });

  describe('Validate and Sanitize', () => {
    it('should return success for valid settings', () => {
      const validSettings = DEFAULT_SETTINGS;
      const result = validator.validateAndSanitize(validSettings);

      expect(result.success).toBe(true);
      expect(result.settings).toEqual(validSettings);
      expect(result.errors).toBeUndefined();
    });

    it('should return failure for invalid settings', () => {
      const invalidSettings = {
        ...DEFAULT_SETTINGS,
        gemini: {
          ...DEFAULT_SETTINGS.gemini,
          timeout: 1000, // Invalid
        },
      };

      const result = validator.validateAndSanitize(invalidSettings);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Field-specific Validation', () => {
    it('should validate API key', () => {
      const validKey = 'AIza123456789012345678901234567890123456';
      const invalidKey = 'invalid-key';

      let result = validator.validateApiKey(validKey);
      expect(result.valid).toBe(true);
      expect(result.message).toBe('API key is valid');

      result = validator.validateApiKey(invalidKey);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('API key must be a valid');
    });

    it('should validate timeout', () => {
      let result = validator.validateTimeout(120000);
      expect(result.valid).toBe(true);

      result = validator.validateTimeout(1000); // Too low
      expect(result.valid).toBe(false);
      expect(result.sanitized).toBe(5000); // Should be coerced to min value

      result = validator.validateTimeout(700000); // Too high
      expect(result.valid).toBe(false);
      expect(result.sanitized).toBe(600000); // Should be coerced to max value
    });

    it('should validate language', () => {
      let result = validator.validateLanguage('auto');
      expect(result.valid).toBe(true);

      result = validator.validateLanguage('ru');
      expect(result.valid).toBe(true);

      result = validator.validateLanguage('invalid');
      expect(result.valid).toBe(false);
    });

    it('should validate theme', () => {
      let result = validator.validateTheme('dark');
      expect(result.valid).toBe(true);

      result = validator.validateTheme('light');
      expect(result.valid).toBe(true);

      result = validator.validateTheme('invalid');
      expect(result.valid).toBe(false);
    });

    it('should validate shortcut', () => {
      let result = validator.validateShortcut('Ctrl+Shift+R');
      expect(result.valid).toBe(true);

      result = validator.validateShortcut('Alt+F');
      expect(result.valid).toBe(true);

      result = validator.validateShortcut('invalid');
      expect(result.valid).toBe(false);
    });
  });

  describe('Migration Compatibility', () => {
    it('should check migration compatibility', () => {
      const oldSettings = {
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
          model: 'gemini-pro',
        },
      };

      const newSettings = {
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
          model: 'auto',
          timeout: 120000,
          language: 'auto',
        },
      };

      const result = validator.checkMigrationCompatibility(oldSettings, newSettings);

      expect(result.compatible).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect removed fields', () => {
      const oldSettings = {
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
          oldField: 'value',
        },
      };

      const newSettings = {
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
        },
      };

      const result = validator.checkMigrationCompatibility(oldSettings, newSettings);

      expect(result.compatible).toBe(false);
      expect(result.issues.some(issue => issue.includes('oldField'))).toBe(true);
    });

    it('should detect type changes', () => {
      const oldSettings = {
        gemini: {
          timeout: '120000', // String
        },
      };

      const newSettings = {
        gemini: {
          timeout: 120000, // Number
        },
      };

      const result = validator.checkMigrationCompatibility(oldSettings, newSettings);

      expect(result.migrations.some(migration => 
        migration.includes('timeout') && migration.includes('type change')
      )).toBe(true);
    });
  });

  describe('Field Rules Access', () => {
    it('should get field rules', () => {
      const rules = validator.getFieldRules('gemini', 'apiKey');

      expect(rules).toBeDefined();
      expect(rules.type).toBe('string');
      expect(rules.pattern).toBeDefined();
    });

    it('should return null for non-existent field', () => {
      const rules = validator.getFieldRules('nonexistent', 'field');

      expect(rules).toBeNull();
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(settingsValidator).toBeInstanceOf(SettingsValidator);
    });

    it('should maintain state across imports', () => {
      const instance1 = settingsValidator;
      const { settingsValidator: instance2 } = require('../../src/services/settingsValidator.js');

      expect(instance1).toBe(instance2);
    });
  });
});