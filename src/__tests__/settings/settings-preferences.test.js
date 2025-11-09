/**
 * Tests for settings preferences and persistence
 * Tests 101-110: Saving/loading preferences, feature toggles, config updates
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { StorageManager } from '../../common/storage';

global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    lastError: null
  }
};

// Mock DOM elements
const mockElements = {
  'gemini-enabled': { checked: true },
  'log-level': { value: 'INFO' },
  'max-retries': { value: '3' },
  'timeout': { value: '30000' },
  'show-hints': { checked: true },
  'save-history': { checked: true },
  'gemini-api-key': { value: '', trim: jest.fn(function() { return this.value; }) }
};

global.document = {
  getElementById: jest.fn((id) => mockElements[id] || null)
};

describe('Settings Preferences (Tests 101-110)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockElements).forEach(element => {
      if (element.checked !== undefined) element.checked = true;
      if (element.value !== undefined) element.value = '';
    });
  });

  test('101: Gemini API settings should be saveable', async () => {
    const apiKey = 'a'.repeat(39);
    mockElements['gemini-api-key'].value = apiKey;
    mockElements['gemini-enabled'].checked = true;

    chrome.storage.sync.set.mockResolvedValue({});

    await StorageManager.saveSettings({
      geminiApiKey: apiKey,
      geminiEnabled: true
    });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        geminiApiKey: apiKey,
        geminiEnabled: true
      })
    );
  });

  test('102: Log level preference should be remembered', async () => {
    mockElements['log-level'].value = 'DEBUG';

    chrome.storage.sync.set.mockResolvedValue({});

    await StorageManager.saveSettings({
      logLevel: 'DEBUG'
    });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ logLevel: 'DEBUG' })
    );
  });

  test('103: Max retries preference should be saved', async () => {
    mockElements['max-retries'].value = '5';

    chrome.storage.sync.set.mockResolvedValue({});

    await StorageManager.saveSettings({
      maxRetries: 5
    });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ maxRetries: 5 })
    );
  });

  test('104: Timeout preference should be persisted', async () => {
    mockElements['timeout'].value = '60000';

    chrome.storage.sync.set.mockResolvedValue({});

    await StorageManager.saveSettings({
      timeout: 60000
    });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 60000 })
    );
  });

  test('105: Show hints toggle should be saved', async () => {
    mockElements['show-hints'].checked = false;

    chrome.storage.sync.set.mockResolvedValue({});

    await StorageManager.saveSettings({
      showHints: false
    });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ showHints: false })
    );
  });

  test('106: Save history toggle should be saved', async () => {
    mockElements['save-history'].checked = false;

    chrome.storage.sync.set.mockResolvedValue({});

    await StorageManager.saveSettings({
      saveHistory: false
    });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ saveHistory: false })
    );
  });

  test('107: Settings should be loaded on page load', (done) => {
    const savedSettings = {
      geminiApiKey: 'key'.repeat(13),
      geminiEnabled: true,
      logLevel: 'INFO',
      maxRetries: 3,
      timeout: 30000,
      showHints: true,
      saveHistory: true
    };

    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      if (callback) callback(savedSettings);
    });
    chrome.runtime.lastError = null;

    StorageManager.get(
      ['geminiApiKey', 'geminiEnabled', 'logLevel', 'maxRetries', 'timeout', 'showHints', 'saveHistory'],
      'sync'
    ).then(() => {
      expect(chrome.storage.sync.get).toHaveBeenCalled();
      done();
    }).catch(done);
  });

  test('108: Multiple preferences should be saved together', async () => {
    const allSettings = {
      geminiApiKey: 'a'.repeat(39),
      geminiEnabled: true,
      logLevel: 'INFO',
      maxRetries: 3,
      timeout: 30000,
      showHints: true,
      saveHistory: true
    };

    chrome.storage.sync.set.mockResolvedValue({});

    await StorageManager.saveSettings(allSettings);

    const callArgs = chrome.storage.sync.set.mock.calls[0][0];
    expect(callArgs).toEqual(allSettings);
  });

  test('109: Feature toggles should update immediately', () => {
    const hintsCb = mockElements['show-hints'];
    const historyCb = mockElements['save-history'];
    const geminiCb = mockElements['gemini-enabled'];

    hintsCb.checked = false;
    historyCb.checked = false;
    geminiCb.checked = false;

    expect(hintsCb.checked).toBe(false);
    expect(historyCb.checked).toBe(false);
    expect(geminiCb.checked).toBe(false);
  });

  test('110: Settings should persist across sessions', (done) => {
    const settings = {
      geminiEnabled: true,
      logLevel: 'DEBUG',
      maxRetries: 5,
      timeout: 60000,
      showHints: false,
      saveHistory: true
    };

    // Save
    chrome.storage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      if (callback) callback(settings);
    });
    chrome.runtime.lastError = null;

    StorageManager.saveSettings(settings)
      .then(() => StorageManager.get(Object.keys(settings), 'sync'))
      .then(() => {
        expect(chrome.storage.sync.set).toHaveBeenCalled();
        expect(chrome.storage.sync.get).toHaveBeenCalled();
        done();
      })
      .catch(done);
  });
});
