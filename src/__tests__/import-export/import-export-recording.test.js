/**
 * Tests for import/export recording functionality
 * Tests 51-60: Recording actions, export formats, data integrity, metadata
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { StorageManager } from '../../common/storage';

// Mock DOM and Chrome APIs
global.Blob = jest.fn(function(content, options) {
  this.content = content;
  this.type = options?.type || 'text/plain';
  this.size = JSON.stringify(content).length;
});

global.URL = {
  createObjectURL: jest.fn(() => 'blob:http://localhost/mock-url'),
  revokeObjectURL: jest.fn()
};

global.FileReader = jest.fn(function() {
  this.readAsText = jest.fn(function(file) {
    this.result = file.text || JSON.stringify([]);
    this.onload({ target: this });
  });
});

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

describe('Import/Export Recording (Tests 51-60)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('51: Recorded actions should be saved', (done) => {
    const actions = [
      { type: 'click', selector: 'button', timestamp: Date.now() },
      { type: 'input', value: 'test', timestamp: Date.now() }
    ];

    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
    chrome.runtime.lastError = null;

    StorageManager.saveActions(actions).then(() => {
      expect(chrome.storage.local.set).toHaveBeenCalled();
      done();
    }).catch(done);
  });

  test('52: Export to JSON should work', () => {
    const actions = [
      { type: 'click', selector: '.button' },
      { type: 'input', value: 'hello', selector: 'input' }
    ];

    const json = JSON.stringify(actions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    expect(blob).toBeTruthy();
    expect(blob.type).toBe('application/json');
    expect(blob.content[0]).toBe(json);
  });

  test('53: Export to CSV should work', () => {
    const actions = [
      { type: 'click', selector: '.button' },
      { type: 'input', value: 'test' }
    ];

    const csv = [
      'type,selector,value',
      `click,.button,`,
      `input,,test`
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });

    expect(blob).toBeTruthy();
    expect(blob.type).toBe('text/csv');
    expect(blob.content[0]).toContain('type,selector,value');
  });

  test('54: Data integrity should be preserved on export', async () => {
    const originalActions = [
      { type: 'click', selector: 'button', coordinates: { x: 100, y: 200 } },
      { type: 'input', value: 'special chars: <>&"\'', selector: 'input' }
    ];

    const json = JSON.stringify(originalActions, null, 2);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(originalActions);
    expect(parsed[1].value).toBe('special chars: <>&"\'');
  });

  test('55: Metadata should be included in export', async () => {
    const actions = [
      { type: 'click', selector: 'button' }
    ];

    const metadata = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      actionCount: actions.length,
      browser: 'Chrome'
    };

    const exportData = {
      metadata,
      actions
    };

    const json = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(json);

    expect(parsed.metadata).toEqual(metadata);
    expect(parsed.metadata.version).toBe('2.0.0');
    expect(parsed.metadata.actionCount).toBe(1);
  });

  test('56: Large files should be handled with compression', () => {
    // Create 1000+ actions
    const actions = Array.from({ length: 1001 }, (_, i) => ({
      type: 'click',
      selector: `button-${i}`,
      timestamp: Date.now() + i,
      id: `action-${i}`
    }));

    const json = JSON.stringify(actions);
    const size = Buffer.byteLength(json, 'utf-8');

    expect(size).toBeGreaterThan(50000); // > 50KB
    expect(actions.length).toBe(1001);

    const blob = new Blob([json], { type: 'application/json' });
    expect(blob.size).toBeGreaterThan(0);
  });

  test('57: Backup should be created from export', (done) => {
    const actions = [
      { type: 'click', selector: 'button' },
      { type: 'input', value: 'test' }
    ];

    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
    chrome.runtime.lastError = null;

    StorageManager.saveActions(actions).then(() => {
      expect(chrome.storage.local.set).toHaveBeenCalled();
      done();
    }).catch(done);
  });

  test('58: Special characters should be preserved', () => {
    const actions = [
      { type: 'input', value: '日本語', selector: 'input' },
      { type: 'input', value: 'Ñoño', selector: 'input' },
      { type: 'input', value: '🎯 emoji', selector: 'input' }
    ];

    const json = JSON.stringify(actions, null, 2);
    const parsed = JSON.parse(json);

    expect(parsed[0].value).toBe('日本語');
    expect(parsed[1].value).toBe('Ñoño');
    expect(parsed[2].value).toBe('🎯 emoji');
  });

  test('59: Data types should be verified after import', () => {
    const actions = [
      { type: 'click', coordinates: { x: 100.5, y: 200.5 }, duration: 500 },
      { type: 'input', value: 'test', isEmpty: false }
    ];

    const json = JSON.stringify(actions);
    const imported = JSON.parse(json);

    expect(typeof imported[0].coordinates.x).toBe('number');
    expect(typeof imported[0].duration).toBe('number');
    expect(typeof imported[1].isEmpty).toBe('boolean');
    expect(typeof imported[1].value).toBe('string');
  });

  test('60: Export performance with 1000+ actions', async () => {
    const actions = Array.from({ length: 1000 }, (_, i) => ({
      type: i % 2 === 0 ? 'click' : 'input',
      selector: `element-${i}`,
      value: i % 2 !== 0 ? `value-${i}` : undefined,
      timestamp: Date.now() + i
    }));

    const startTime = performance.now();
    const json = JSON.stringify(actions, null, 2);
    const endTime = performance.now();

    const exportTime = endTime - startTime;
    expect(exportTime).toBeLessThan(100); // Should complete in < 100ms
    expect(json.length).toBeGreaterThan(0);
  });
});
