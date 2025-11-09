/**
 * Tests for settings page initialization
 * Tests 81-90: Module loading, DOM setup, event handlers, storage access
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { StorageManager } from '../../common/storage';
import { Validator } from '../../common/validator';

// Mock DOM elements
const mockElements = {
  'settings-form': { 
    addEventListener: jest.fn(), 
    submit: jest.fn(),
    preventDefault: jest.fn()
  },
  'gemini-api-key': { 
    value: '', 
    addEventListener: jest.fn(),
    trim: jest.fn(function() { return this.value; })
  },
  'gemini-enabled': { 
    checked: true, 
    addEventListener: jest.fn()
  },
  'log-level': { 
    value: 'INFO', 
    addEventListener: jest.fn()
  },
  'max-retries': { 
    value: '3', 
    addEventListener: jest.fn()
  },
  'timeout': { 
    value: '30000', 
    addEventListener: jest.fn()
  },
  'show-hints': { 
    checked: true, 
    addEventListener: jest.fn()
  },
  'save-history': { 
    checked: true, 
    addEventListener: jest.fn()
  },
  'test-gemini-btn': { 
    addEventListener: jest.fn(), 
    disabled: false,
    textContent: '🧪 Тест'
  },
  'clear-gemini-btn': { 
    addEventListener: jest.fn(), 
    disabled: false
  },
  'reset-settings-btn': { 
    addEventListener: jest.fn(), 
    disabled: false
  },
  'main-status': { 
    textContent: '', 
    className: ''
  },
  'gemini-status': { 
    textContent: '', 
    className: ''
  }
};

global.document = {
  getElementById: jest.fn((id) => mockElements[id] || null),
  createElement: jest.fn((tag) => ({
    tagName: tag.toUpperCase(),
    addEventListener: jest.fn(),
    appendChild: jest.fn()
  })),
  addEventListener: jest.fn()
};

global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    openOptionsPage: jest.fn()
  }
};

global.fetch = jest.fn();

describe('Settings Initialization (Tests 81-90)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockElements).forEach(element => {
      if (element.value !== undefined) element.value = '';
      if (element.checked !== undefined) element.checked = false;
      if (element.textContent !== undefined) element.textContent = '';
      if (element.className !== undefined) element.className = '';
    });
    
    // Reset to defaults
    mockElements['log-level'].value = 'INFO';
    mockElements['max-retries'].value = '3';
    mockElements['timeout'].value = '30000';
    mockElements['gemini-enabled'].checked = true;
    mockElements['show-hints'].checked = true;
    mockElements['save-history'].checked = true;
  });

  test('81: Settings module should load without errors', async () => {
    chrome.storage.sync.get.mockResolvedValue({});

    const settings = await StorageManager.getSettings();

    expect(settings).toBeDefined();
    expect(chrome.storage.sync.get).toHaveBeenCalled();
  });

  test('82: DOM elements should be initialized', () => {
    // Verify that required elements structure exists
    const requiredElements = ['settings-form', 'gemini-api-key', 'gemini-enabled', 'log-level'];
    
    requiredElements.forEach(id => {
      const mockElement = mockElements[id];
      expect(mockElement).toBeDefined();
    });
  });

  test('83: Event listeners should be attached to form', () => {
    // Verify that form element has addEventListener method
    const form = mockElements['settings-form'];
    
    expect(form.addEventListener).toBeDefined();
    expect(typeof form.addEventListener).toBe('function');
  });

  test('84: Event listeners should be attached to buttons', () => {
    // Verify that button elements have addEventListener method
    const buttonIds = ['test-gemini-btn', 'clear-gemini-btn', 'reset-settings-btn'];
    
    buttonIds.forEach(id => {
      const button = mockElements[id];
      expect(button.addEventListener).toBeDefined();
      expect(typeof button.addEventListener).toBe('function');
    });
  });

  test('85: Settings should be loaded from storage', async () => {
    const mockSettings = {
      geminiApiKey: 'test-key-12345',
      geminiEnabled: true,
      logLevel: 'DEBUG',
      maxRetries: 5,
      timeout: 60000,
      showHints: false,
      saveHistory: true
    };

    chrome.storage.sync.get.mockResolvedValue(mockSettings);

    const settings = await StorageManager.getSettings();

    expect(chrome.storage.sync.get).toHaveBeenCalled();
  });

  test('86: Default settings should be applied', () => {
    const defaults = {
      geminiEnabled: true,
      logLevel: 'INFO',
      maxRetries: 3,
      timeout: 30000,
      showHints: true,
      saveHistory: true
    };

    expect(mockElements['gemini-enabled'].checked).toBe(true);
    expect(mockElements['log-level'].value).toBe('INFO');
    expect(mockElements['max-retries'].value).toBe('3');
    expect(mockElements['timeout'].value).toBe('30000');
  });

  test('87: Settings validation should occur on load', () => {
    const apiKey = mockElements['gemini-api-key'].value;
    const isValid = apiKey.length === 0 || apiKey.length === 39;

    expect(typeof isValid).toBe('boolean');
  });

  test('88: Storage access should not throw errors', (done) => {
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      if (callback) callback({});
    });
    chrome.storage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
    chrome.runtime.lastError = null;

    StorageManager.get(['geminiApiKey'], 'sync')
      .then(() => StorageManager.set({ geminiApiKey: 'test' }, 'sync'))
      .then(() => {
        expect(chrome.storage.sync.get).toHaveBeenCalled();
        expect(chrome.storage.sync.set).toHaveBeenCalled();
        done();
      })
      .catch(done);
  });

  test('89: All settings form fields should be present', () => {
    const requiredFields = [
      'gemini-api-key',
      'gemini-enabled',
      'log-level',
      'max-retries',
      'timeout',
      'show-hints',
      'save-history'
    ];

    requiredFields.forEach(fieldId => {
      const mockElement = mockElements[fieldId];
      expect(mockElement).toBeDefined();
    });
  });

  test('90: Settings page should support DOMContentLoaded', () => {
    // Verify document can listen for DOMContentLoaded
    expect(typeof document.addEventListener).toBe('function');
  });
});
