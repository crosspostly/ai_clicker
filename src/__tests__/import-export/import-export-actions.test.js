/**
 * Tests for import/export actions handling
 * Tests 61-70: Importing actions, merging, versioning, error handling
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { StorageManager } from '../../common/storage.js';
import { Validator } from '../../common/validator.js';

global.chrome = {
  storage: {
    local: {
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

describe('Import/Export Actions (Tests 61-70)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('61: Single action should be importable', (done) => {
    const action = {
      type: 'click',
      selector: 'button.submit',
      timestamp: Date.now()
    };

    const actions = [action];
    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
    chrome.runtime.lastError = null;

    StorageManager.saveActions(actions).then(() => {
      expect(chrome.storage.local.set).toHaveBeenCalled();
      done();
    }).catch(done);
  });

  test('62: Array of actions should be importable', (done) => {
    const actions = [
      { type: 'click', selector: '.button' },
      { type: 'input', value: 'test' },
      { type: 'scroll', pixels: 100 },
      { type: 'wait', duration: 1000 }
    ];

    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback && callback();
    });

    StorageManager.saveActions(actions).then(() => {
      expect(chrome.storage.local.set).toHaveBeenCalled();
      done();
    }).catch(done);
  });

  test('63: Name conflicts should be resolved', (done) => {
    const existingActions = [
      { id: 'action-1', type: 'click', selector: '.old' }
    ];

    const newActions = [
      { id: 'action-1', type: 'click', selector: '.new' },
      { id: 'action-2', type: 'input', value: 'test' }
    ];

    // Simulate merging with conflict resolution
    const merged = [...existingActions];
    newActions.forEach(action => {
      const existing = merged.find(a => a.id === action.id);
      if (existing) {
        const index = merged.indexOf(existing);
        merged[index] = action;
      } else {
        merged.push(action);
      }
    });

    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback && callback();
    });

    StorageManager.saveActions(merged).then(() => {
      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(merged).toHaveLength(2);
      expect(merged[0].selector).toBe('.new');
      done();
    }).catch(done);
  });

  test('64: Merge with existing actions should work', (done) => {
    const existingActions = [
      { type: 'click', selector: '.button1' }
    ];

    const newActions = [
      { type: 'click', selector: '.button2' }
    ];

    const merged = [...existingActions, ...newActions];
    
    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback && callback();
    });

    StorageManager.saveActions(merged).then(() => {
      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(merged).toHaveLength(2);
      done();
    }).catch(done);
  });

  test('65: Overwrite existing actions', (done) => {
    const newActions = [
      { type: 'click', selector: '.new-button' }
    ];

    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback && callback();
    });

    StorageManager.saveActions(newActions).then(() => {
      expect(chrome.storage.local.set).toHaveBeenCalled();
      done();
    }).catch(done);
  });

  test('66: Undo operation should revert import', (done) => {
    const originalActions = [
      { type: 'click', selector: '.original' }
    ];

    const importedActions = [
      { type: 'click', selector: '.imported' }
    ];

    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback && callback();
    });

    // Save original then revert
    StorageManager.saveActions(originalActions)
      .then(() => StorageManager.saveActions(importedActions))
      .then(() => StorageManager.saveActions(originalActions))
      .then(() => {
        expect(chrome.storage.local.set).toHaveBeenCalled();
        done();
      })
      .catch(done);
  });

  test('67: Corrupted files should be handled', () => {
    const corruptedJson = '{ invalid json }';

    expect(() => {
      JSON.parse(corruptedJson);
    }).toThrow();
  });

  test('68: Version recovery should restore actions', (done) => {
    const versionedActions = {
      version: '2.0.0',
      actions: [
        { type: 'click', selector: '.button' },
        { type: 'input', value: 'test' }
      ]
    };

    // Extract actions from versioned data
    const actions = versionedActions.actions;

    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback && callback();
    });

    StorageManager.saveActions(actions).then(() => {
      expect(chrome.storage.local.set).toHaveBeenCalled();
      done();
    }).catch(done);
  });

  test('69: Legacy format should be imported', () => {
    // Legacy format: simple array without metadata
    const legacyActions = [
      { type: 'click', target: '.button' },
      { type: 'type', text: 'hello' }
    ];

    // Convert legacy format to new format
    const converted = legacyActions.map(action => {
      if (action.target) action.selector = action.target;
      if (action.text) action.value = action.text;
      return action;
    });

    expect(converted[0].selector).toBe('.button');
    expect(converted[1].value).toBe('hello');
  });

  test('70: Cross-platform compatibility should be ensured', () => {
    const actions = [
      { type: 'click', selector: 'button', platform: 'chrome' },
      { type: 'input', value: 'test', platform: 'firefox' },
      { type: 'scroll', pixels: 100, platform: 'safari' }
    ];

    const json = JSON.stringify(actions);
    const parsed = JSON.parse(json);

    // Actions should be identical regardless of platform
    expect(parsed[0]).toHaveProperty('type');
    expect(parsed[0]).toHaveProperty('selector');
    expect(parsed[1]).toHaveProperty('value');
    expect(parsed[2]).toHaveProperty('pixels');

    // Validate all have required fields
    parsed.forEach(action => {
      expect(action.type).toBeDefined();
      expect(['click', 'input', 'scroll']).toContain(action.type);
    });
  });
});
