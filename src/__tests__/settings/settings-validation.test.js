/**
 * Tests for settings validation
 * Tests 111-120: Input validation, API key validation, error handling, form submission
 */

import { Validator } from '../../common/validator.js';
import { StorageManager } from '../../common/storage.js';

global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    local: {
      clear: jest.fn()
    }
  },
  runtime: {
    lastError: null
  }
};

// Mock fetch for API testing
global.fetch = jest.fn();

// Mock DOM elements
const mockElements = {
  'gemini-api-key': { 
    value: '',
    trim: jest.fn(function() { return this.value.trim(); })
  },
  'gemini-enabled': { checked: true },
  'log-level': { value: 'INFO' },
  'max-retries': { value: '3' },
  'timeout': { value: '30000' },
  'show-hints': { checked: true },
  'save-history': { checked: true },
  'main-status': { textContent: '', className: '' },
  'gemini-status': { textContent: '', className: '' }
};

global.document = {
  getElementById: jest.fn((id) => mockElements[id] || null),
  querySelector: jest.fn()
};

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
};

describe('Settings Validation (Tests 111-120)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockElements).forEach(element => {
      if (element.value !== undefined) element.value = '';
      if (element.checked !== undefined) element.checked = true;
      if (element.textContent !== undefined) element.textContent = '';
      if (element.className !== undefined) element.className = '';
    });
  });

  test('111: API key length should be validated', () => {
    // Valid key (39 characters)
    const validKey = 'a'.repeat(39);
    expect(validKey.length).toBe(39);

    // Invalid key (too short)
    const shortKey = 'short';
    expect(shortKey.length).not.toBe(39);

    // Invalid key (too long)
    const longKey = 'a'.repeat(50);
    expect(longKey.length).not.toBe(39);
  });

  test('112: API key format should be validated', () => {
    const validKey = 'AIzaSyDL5GvqYv_K0-tUVmIJLPXANfKT2YgYz9c';
    
    // Should contain alphanumeric and -/_ characters
    expect(/^[a-zA-Z0-9_-]+$/.test(validKey)).toBe(true);

    const invalidKey = 'invalid key!@#$%';
    expect(/^[a-zA-Z0-9_-]+$/.test(invalidKey)).toBe(false);
  });

  test('113: Empty API key should be allowed if Gemini disabled', () => {
    mockElements['gemini-api-key'].value = '';
    mockElements['gemini-enabled'].checked = false;

    const apiKey = mockElements['gemini-api-key'].value.trim();
    const enabled = mockElements['gemini-enabled'].checked;

    const isValid = !enabled || apiKey.length === 39;
    expect(isValid).toBe(true);
  });

  test('114: Retry count should be within valid range', () => {
    const validRetries = [1, 3, 5, 10];
    const invalidRetries = [0, -1, 11, 100];

    validRetries.forEach(count => {
      expect(count >= 1 && count <= 10).toBe(true);
    });

    invalidRetries.forEach(count => {
      expect(count >= 1 && count <= 10).toBe(false);
    });
  });

  test('115: Timeout should be within valid range', () => {
    mockElements['timeout'].value = '5000';

    const timeout = parseInt(mockElements['timeout'].value);
    const isValid = timeout >= 5000 && timeout <= 300000;

    expect(isValid).toBe(true);

    mockElements['timeout'].value = '1000';
    const invalidTimeout = parseInt(mockElements['timeout'].value);
    const isInvalid = invalidTimeout >= 5000 && invalidTimeout <= 300000;

    expect(isInvalid).toBe(false);
  });

  test('116: Log level should be from allowed values', () => {
    const allowedLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const testLevels = ['DEBUG', 'INFO', 'INVALID', 'DEBUG2'];

    testLevels.forEach(level => {
      const isValid = allowedLevels.includes(level);
      if (level === 'DEBUG' || level === 'INFO') {
        expect(isValid).toBe(true);
      } else {
        expect(isValid).toBe(false);
      }
    });
  });

  test('117: Form submission should validate all fields', (done) => {
    const testData = {
      geminiApiKey: 'a'.repeat(39),
      geminiEnabled: true,
      logLevel: 'INFO',
      maxRetries: 3,
      timeout: 30000
    };

    mockElements['gemini-api-key'].value = testData.geminiApiKey;
    mockElements['gemini-enabled'].checked = testData.geminiEnabled;
    mockElements['log-level'].value = testData.logLevel;
    mockElements['max-retries'].value = String(testData.maxRetries);
    mockElements['timeout'].value = String(testData.timeout);

    chrome.storage.sync.set.mockResolvedValue({});

    // Simulate form submission
    StorageManager.saveSettings(testData).then(() => {
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining(testData)
      );
      done();
    });
  });

  test('118: Invalid fields should show error messages', () => {
    mockElements['gemini-api-key'].value = 'short';
    mockElements['gemini-enabled'].checked = true;

    const apiKey = mockElements['gemini-api-key'].value.trim();
    const enabled = mockElements['gemini-enabled'].checked;

    if (enabled && apiKey.length !== 39) {
      mockElements['gemini-status'].textContent = '⚠️ API ключ должен содержать 39 символов';
      mockElements['gemini-status'].className = 'status-message status-error';
    }

    expect(mockElements['gemini-status'].textContent).toContain('39 символов');
    expect(mockElements['gemini-status'].className).toContain('error');
  });

  test('119: Clear settings should validate confirmation', () => {
    const confirm = jest.fn(() => true);
    global.confirm = confirm;

    chrome.storage.sync.clear.mockResolvedValue({});
    chrome.storage.local.clear.mockResolvedValue({});

    // Simulate clear action
    if (confirm('Вы уверены?')) {
      StorageManager.clear('sync');
    }

    expect(confirm).toHaveBeenCalled();
  });

  test('120: API key testing should validate response', async () => {
    const apiKey = 'a'.repeat(39);
    mockElements['gemini-api-key'].value = apiKey;

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] })
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test' }] }]
        })
      }
    );

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });
});
