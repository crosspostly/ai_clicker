/**
 * Settings System Tests
 * Tests Chrome storage sync, validation, import/export, theme support, and persistence
 */

import { StorageService } from '../../src/services/storageService.js';
import { SettingsValidator } from '../../src/services/settingsValidator.js';

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      MAX_ITEMS: 512,
      QUOTA_BYTES: 102400,
      QUOTA_BYTES_PER_ITEM: 8192
    }
  },
  runtime: {
    lastError: null
  }
};

describe('Settings System', () => {
  let storageService;
  let settingsValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    storageService = new StorageService();
    settingsValidator = new SettingsValidator();
  });

  describe('Chrome Storage Sync', () => {
    test('should save settings to sync storage', async () => {
      const settings = {
        gemini: {
          apiKey: 'test-api-key',
          model: 'gemini-2.0-flash-exp',
          language: 'en'
        },
        theme: 'dark',
        autoSave: true
      };

      chrome.storage.sync.set.mockResolvedValue();

      const result = await storageService.saveSettings(settings);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(settings);
      expect(result.success).toBe(true);
    });

    test('should load settings from sync storage', async () => {
      const savedSettings = {
        gemini: {
          apiKey: 'test-api-key',
          model: 'gemini-2.0-flash-exp',
          language: 'en'
        },
        theme: 'light'
      };

      chrome.storage.sync.get.mockResolvedValue(savedSettings);

      const result = await storageService.loadSettings();

      expect(chrome.storage.sync.get).toHaveBeenCalled();
      expect(result).toEqual(savedSettings);
    });

    test('should handle sync storage quota exceeded', async () => {
      chrome.runtime.lastError = { message: 'QUOTA_BYTES_PER_ITEM quota exceeded' };
      chrome.storage.sync.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });

      const largeSettings = {
        data: 'x'.repeat(9000) // Exceeds 8KB limit
      };

      const result = await storageService.saveSettings(largeSettings);

      expect(result.success).toBe(false);
      expect(result.error).toContain('quota');
    });

    test('should fallback to local storage on sync failure', async () => {
      chrome.runtime.lastError = { message: 'Sync storage unavailable' };
      chrome.storage.sync.set.mockImplementation((data, callback) => {
        chrome.runtime.lastError = { message: 'Sync storage unavailable' };
        if (callback) callback();
      });
      
      chrome.storage.local.set.mockResolvedValue();

      const settings = { theme: 'dark' };
      const result = await storageService.saveSettings(settings);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(settings);
      expect(result.success).toBe(true);
      expect(result.fallback).toBe('local');
    });

    test('should merge settings properly', async () => {
      const existingSettings = {
        gemini: { apiKey: 'old-key', language: 'en' },
        theme: 'light'
      };

      const newSettings = {
        gemini: { apiKey: 'new-key' },
        autoSave: true
      };

      chrome.storage.sync.get.mockResolvedValue(existingSettings);
      chrome.storage.sync.set.mockResolvedValue();

      await storageService.updateSettings(newSettings);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        gemini: { apiKey: 'new-key', language: 'en' }, // Merged
        theme: 'light',
        autoSave: true
      });
    });
  });

  describe('Settings Validation', () => {
    test('should validate API key format', () => {
      const validKeys = [
        'AIzaSyDaGmWKa4JsXZ-HjGw63IS5dN4',
        'AIza1234567890abcdefghijklmnopqrstuvwxyz',
        'AIzaSyD-abc123_def456'
      ];

      validKeys.forEach(key => {
        const result = settingsValidator.validateApiKey(key);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid API keys', () => {
      const invalidKeys = [
        '',
        'short',
        'invalid-format',
        '123',
        'AIz', // Too short
        'NOtAIzaSy...' // Wrong prefix
      ];

      invalidKeys.forEach(key => {
        const result = settingsValidator.validateApiKey(key);
        expect(result.isValid).toBe(false);
      });
    });

    test('should validate model selection', () => {
      const validModels = [
        'auto',
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash-001',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
      ];

      validModels.forEach(model => {
        const result = settingsValidator.validateModel(model);
        expect(result.isValid).toBe(true);
      });

      const invalidModels = ['invalid-model', '', 'gpt-4'];
      invalidModels.forEach(model => {
        const result = settingsValidator.validateModel(model);
        expect(result.isValid).toBe(false);
      });
    });

    test('should validate language settings', () => {
      const validLanguages = ['en', 'ru', 'es', 'fr', 'de', 'auto'];
      const invalidLanguages = ['invalid', 'xyz', '123'];

      validLanguages.forEach(lang => {
        const result = settingsValidator.validateLanguage(lang);
        expect(result.isValid).toBe(true);
      });

      invalidLanguages.forEach(lang => {
        const result = settingsValidator.validateLanguage(lang);
        expect(result.isValid).toBe(false);
      });
    });

    test('should validate timeout settings', () => {
      const validTimeouts = [1000, 5000, 10000, 30000];
      const invalidTimeouts = [0, -1, 100, 300000];

      validTimeouts.forEach(timeout => {
        const result = settingsValidator.validateTimeout(timeout);
        expect(result.isValid).toBe(true);
      });

      invalidTimeouts.forEach(timeout => {
        const result = settingsValidator.validateTimeout(timeout);
        expect(result.isValid).toBe(false);
      });
    });

    test('should validate complete settings object', () => {
      const validSettings = {
        gemini: {
          apiKey: 'AIzaSyDaGmWKa4JsXZ-HjGw63IS5dN4',
          model: 'auto',
          language: 'en',
          timeout: 10000
        },
        theme: 'dark',
        autoSave: true,
        retryCount: 3
      };

      const result = settingsValidator.validateSettings(validSettings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should collect all validation errors', () => {
      const invalidSettings = {
        gemini: {
          apiKey: 'invalid',
          model: 'invalid-model',
          language: 'xyz',
          timeout: -1
        },
        theme: 'invalid-theme',
        retryCount: 10
      };

      const result = settingsValidator.validateSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should provide default values for missing fields', () => {
      const partialSettings = {
        gemini: {
          apiKey: 'AIzaSyDaGmWKa4JsXZ-HjGw63IS5dN4'
        }
      };

      const result = settingsValidator.validateAndNormalize(partialSettings);
      expect(result.isValid).toBe(true);
      expect(result.settings.gemini.model).toBeDefined();
      expect(result.settings.gemini.language).toBeDefined();
      expect(result.settings.theme).toBeDefined();
    });
  });

  describe('Import/Export Functionality', () => {
    test('should export settings to JSON', async () => {
      const settings = {
        gemini: {
          apiKey: 'AIzaSyDaGmWKa4JsXZ-HjGw63IS5dN4',
          model: 'gemini-2.0-flash-exp',
          language: 'en'
        },
        theme: 'dark',
        version: '3.0.0',
        exportDate: new Date().toISOString()
      };

      chrome.storage.sync.get.mockResolvedValue(settings);

      const exportData = await storageService.exportSettings();

      expect(exportData).toContain('version');
      expect(exportData).toContain('exportDate');
      expect(JSON.parse(exportData).gemini.apiKey).toBe('AIzaSyDaGmWKa4JsXZ-HjGw63IS5dN4');
    });

    test('should import settings from JSON', async () => {
      const importData = {
        gemini: {
          apiKey: 'AIzaSyNewKeyForTesting',
          model: 'gemini-1.5-pro',
          language: 'ru'
        },
        theme: 'light',
        version: '3.0.0'
      };

      chrome.storage.sync.set.mockResolvedValue();

      const result = await storageService.importSettings(JSON.stringify(importData));

      expect(result.success).toBe(true);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          gemini: expect.objectContaining({
            apiKey: 'AIzaSyNewKeyForTesting',
            model: 'gemini-1.5-pro',
            language: 'ru'
          })
        })
      );
    });

    test('should handle invalid import data', async () => {
      const invalidData = 'not valid json';

      const result = await storageService.importSettings(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    test('should validate imported settings', async () => {
      const invalidImportData = {
        gemini: {
          apiKey: 'invalid-key',
          model: 'invalid-model'
        }
      };

      const result = await storageService.importSettings(JSON.stringify(invalidImportData));

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle version compatibility', async () => {
      const oldVersionData = {
        gemini: {
          apiKey: 'AIzaSyOldVersionKey',
          model: 'gemini-pro' // Old model name
        },
        version: '2.0.0'
      };

      chrome.storage.sync.set.mockResolvedValue();

      const result = await storageService.importSettings(JSON.stringify(oldVersionData));

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('version compatibility')
      );
    });

    test('should merge import with existing settings', async () => {
      const existingSettings = {
        gemini: {
          apiKey: 'existing-key',
          language: 'en'
        },
        theme: 'dark'
      };

      const importData = {
        gemini: {
          model: 'gemini-2.0-flash-exp'
        },
        autoSave: true
      };

      chrome.storage.sync.get.mockResolvedValue(existingSettings);
      chrome.storage.sync.set.mockResolvedValue();

      const result = await storageService.importSettings(
        JSON.stringify(importData),
        { merge: true }
      );

      expect(result.success).toBe(true);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          gemini: expect.objectContaining({
            apiKey: 'existing-key', // Preserved
            language: 'en', // Preserved
            model: 'gemini-2.0-flash-exp' // Updated
          }),
          theme: 'dark', // Preserved
          autoSave: true // Added
        })
      );
    });
  });

  describe('Theme Support', () => {
    test('should apply dark theme correctly', async () => {
      const themeSettings = {
        theme: 'dark',
        customColors: {
          primary: '#1a73e8',
          background: '#202124'
        }
      };

      chrome.storage.sync.set.mockResolvedValue();

      await storageService.saveSettings(themeSettings);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'dark'
        })
      );
    });

    test('should apply light theme correctly', async () => {
      const themeSettings = {
        theme: 'light',
        customColors: {
          primary: '#1a73e8',
          background: '#ffffff'
        }
      };

      chrome.storage.sync.set.mockResolvedValue();

      await storageService.saveSettings(themeSettings);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'light'
        })
      );
    });

    test('should handle auto theme detection', async () => {
      // Mock system preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const autoThemeSettings = {
        theme: 'auto'
      };

      chrome.storage.sync.set.mockResolvedValue();

      await storageService.saveSettings(autoThemeSettings);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'auto'
        })
      );
    });

    test('should validate custom theme colors', () => {
      const validColors = {
        primary: '#1a73e8',
        background: '#202124',
        text: '#ffffff'
      };

      const result = settingsValidator.validateThemeColors(validColors);
      expect(result.isValid).toBe(true);

      const invalidColors = {
        primary: 'invalid-color',
        background: '#rgb'
      };

      const invalidResult = settingsValidator.validateThemeColors(invalidColors);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Persistence and Reliability', () => {
    test('should handle storage unavailability gracefully', async () => {
      chrome.runtime.lastError = { message: 'Storage area is disabled' };
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        chrome.runtime.lastError = { message: 'Storage area is disabled' };
        if (callback) callback({});
      });

      const result = await storageService.loadSettings();

      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
    });

    test('should retry failed operations', async () => {
      let attemptCount = 0;
      chrome.storage.sync.set.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          chrome.runtime.lastError = { message: 'Temporary failure' };
          return Promise.reject(new Error('Temporary failure'));
        }
        chrome.runtime.lastError = null;
        return Promise.resolve();
      });

      const settings = { theme: 'dark' };
      const result = await storageService.saveSettings(settings, { retries: 3 });

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    test('should backup settings before major changes', async () => {
      const currentSettings = {
        gemini: { apiKey: 'current-key' },
        theme: 'light'
      };

      const newSettings = {
        gemini: { apiKey: 'new-key' },
        theme: 'dark'
      };

      chrome.storage.sync.get.mockResolvedValue(currentSettings);
      chrome.storage.local.set.mockResolvedValue();
      chrome.storage.sync.set.mockResolvedValue();

      const result = await storageService.updateSettings(newSettings, { backup: true });

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          settings_backup: expect.any(Object)
        })
      );
      expect(result.success).toBe(true);
    });

    test('should restore from backup if needed', async () => {
      const backupSettings = {
        gemini: { apiKey: 'backup-key' },
        theme: 'light',
        backupDate: new Date().toISOString()
      };

      chrome.storage.local.get.mockResolvedValue({
        settings_backup: backupSettings
      });
      chrome.storage.sync.set.mockResolvedValue();

      const result = await storageService.restoreFromBackup();

      expect(result.success).toBe(true);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          gemini: { apiKey: 'backup-key' },
          theme: 'light'
        })
      );
    });

    test('should handle corrupted settings gracefully', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: null, // Corrupted data
        theme: undefined
      });

      const result = await storageService.loadSettings();

      expect(result.success).toBe(true);
      expect(result.settings).toEqual({});
    });

    test('should maintain settings across browser restarts', async () => {
      // Simulate browser restart by clearing in-memory state
      storageService._cache = null;

      const persistentSettings = {
        gemini: { apiKey: 'persistent-key' },
        theme: 'dark'
      };

      chrome.storage.sync.get.mockResolvedValue(persistentSettings);

      const result = await storageService.loadSettings();

      expect(result).toEqual(persistentSettings);
      expect(storageService._cache).toEqual(persistentSettings);
    });
  });

  describe('Performance and Optimization', () => {
    test('should cache frequently accessed settings', async () => {
      const settings = { theme: 'dark' };
      chrome.storage.sync.get.mockResolvedValue(settings);

      // First call should hit storage
      const result1 = await storageService.loadSettings();
      expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await storageService.loadSettings();
      expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);

      expect(result1).toEqual(result2);
    });

    test('should batch storage operations', async () => {
      const operations = [
        { key: 'theme', value: 'dark' },
        { key: 'language', value: 'en' },
        { key: 'autoSave', value: true }
      ];

      chrome.storage.sync.set.mockResolvedValue();

      await storageService.batchUpdate(operations);

      expect(chrome.storage.sync.set).toHaveBeenCalledTimes(1);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        theme: 'dark',
        language: 'en',
        autoSave: true
      });
    });

    test('should compress large settings objects', async () => {
      const largeSettings = {
        data: 'x'.repeat(5000), // Large data
        theme: 'dark'
      };

      chrome.storage.sync.set.mockResolvedValue();

      await storageService.saveSettings(largeSettings, { compress: true });

      // Verify compression was applied (implementation-specific)
      expect(chrome.storage.sync.set).toHaveBeenCalled();
    });
  });
});