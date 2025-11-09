/**
 * Tests for Storage Service
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { StorageService, storageService } from '../../src/services/storageService.js';
import { STORAGE_KEYS } from '../../src/common/constants.js';

// Mock Chrome APIs
const mockChromeStorage = {
  sync: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    getBytesInUse: jest.fn(),
  },
  local: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  },
  onChanged: {
    addListener: jest.fn(),
  },
};

global.chrome = {
  storage: mockChromeStorage,
  runtime: {
    lastError: null,
  },
};

// Mock localStorage
const mockLocalStorage = {
  data: {},
  getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage.data[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete mockLocalStorage.data[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.data = {};
  }),
};

global.localStorage = mockLocalStorage;

describe('StorageService', () => {
  let service;

  beforeEach(() => {
    service = new StorageService();
    jest.clearAllMocks();
    mockLocalStorage.data = {};
    
    // Reset Chrome storage mocks
    Object.values(mockChromeStorage.sync).forEach(method => {
      if (typeof method === 'function') {
        method.mockReset();
      }
    });
    Object.values(mockChromeStorage.local).forEach(method => {
      if (typeof method === 'function') {
        method.mockReset();
      }
    });
  });

  afterEach(() => {
    service.listeners.clear();
    service.cache.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(service.isReady).toBe(false);
      expect(service.cache).toBeInstanceOf(Map);
      expect(service.listeners).toBeInstanceOf(Set);
    });

    it('should load cache on initialization', async () => {
      const testData = { key1: 'value1', key2: 'value2' };
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback(testData);
      });

      await service._initialize();

      expect(service.isReady).toBe(true);
      expect(service.cache.get('key1')).toBe('value1');
      expect(service.cache.get('key2')).toBe('value2');
    });

    it('should setup change listener', async () => {
      await service._initialize();

      expect(mockChromeStorage.onChanged.addListener).toHaveBeenCalled();
    });
  });

  describe('Sync Storage Operations', () => {
    beforeEach(async () => {
      await service._initialize();
    });

    it('should get data from sync storage', async () => {
      const testData = { testKey: 'testValue' };
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback(testData);
      });

      const result = await service.getSync('testKey');

      expect(result).toBe('testValue');
      expect(mockChromeStorage.sync.get).toHaveBeenCalledWith('testKey', expect.any(Function));
    });

    it('should get all data when key is null', async () => {
      const testData = { key1: 'value1', key2: 'value2' };
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback(testData);
      });

      const result = await service.getSync(null);

      expect(result).toEqual(testData);
    });

    it('should handle Chrome storage errors', async () => {
      chrome.runtime.lastError = { message: 'Storage error' };
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      await expect(service.getSync('testKey')).rejects.toThrow('Storage error');
    });

    it('should set data to sync storage', async () => {
      mockChromeStorage.sync.set.mockImplementation((data, callback) => {
        callback();
      });
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback({ key1: 'value1' });
      });

      await service.setSync('testKey', 'testValue');

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        { testKey: 'testValue' },
        expect.any(Function)
      );
      expect(service.cache.get('testKey')).toBe('testValue');
    });

    it('should create local backup', async () => {
      mockChromeStorage.sync.set.mockImplementation((data, callback) => {
        callback();
      });
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      await service.setSync('testKey', 'testValue');

      expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
        { backup_testKey: 'testValue' },
        expect.any(Function)
      );
    });

    it('should handle set errors', async () => {
      chrome.runtime.lastError = { message: 'Set error' };
      mockChromeStorage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      await expect(service.setSync('testKey', 'testValue')).rejects.toThrow('Set error');
    });
  });

  describe('Local Storage Operations', () => {
    beforeEach(async () => {
      await service._initialize();
    });

    it('should get data from local storage', async () => {
      const testData = { localKey: 'localValue' };
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback(testData);
      });

      const result = await service.getLocal('localKey');

      expect(result).toBe('localValue');
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith('localKey', expect.any(Function));
    });

    it('should get all local data when key is null', async () => {
      const testData = { local1: 'value1', local2: 'value2' };
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback(testData);
      });

      const result = await service.getLocal(null);

      expect(result).toEqual(testData);
    });
  });

  describe('Remove Operations', () => {
    beforeEach(async () => {
      await service._initialize();
      service.cache.set('testKey', 'testValue');
    });

    it('should remove single key', async () => {
      mockChromeStorage.sync.remove.mockImplementation((keys, callback) => {
        callback();
      });
      mockChromeStorage.local.remove.mockImplementation((keys, callback) => {
        callback();
      });

      await service.remove('testKey');

      expect(service.cache.has('testKey')).toBe(false);
      expect(mockChromeStorage.sync.remove).toHaveBeenCalledWith(['testKey'], expect.any(Function));
      expect(mockChromeStorage.local.remove).toHaveBeenCalledWith(['testKey'], expect.any(Function));
    });

    it('should remove multiple keys', async () => {
      service.cache.set('key1', 'value1');
      service.cache.set('key2', 'value2');
      
      mockChromeStorage.sync.remove.mockImplementation((keys, callback) => {
        callback();
      });
      mockChromeStorage.local.remove.mockImplementation((keys, callback) => {
        callback();
      });

      await service.remove(['key1', 'key2']);

      expect(service.cache.has('key1')).toBe(false);
      expect(service.cache.has('key2')).toBe(false);
      expect(mockChromeStorage.sync.remove).toHaveBeenCalledWith(['key1', 'key2'], expect.any(Function));
    });
  });

  describe('Clear Operations', () => {
    beforeEach(async () => {
      await service._initialize();
      service.cache.set('key1', 'value1');
      service.cache.set('key2', 'value2');
    });

    it('should clear all storage', async () => {
      mockChromeStorage.sync.clear.mockImplementation((callback) => {
        callback();
      });
      mockChromeStorage.local.clear.mockImplementation((callback) => {
        callback();
      });

      await service.clear();

      expect(service.cache.size).toBe(0);
      expect(mockChromeStorage.sync.clear).toHaveBeenCalled();
      expect(mockChromeStorage.local.clear).toHaveBeenCalled();
    });
  });

  describe('Import/Export Operations', () => {
    beforeEach(async () => {
      await service._initialize();
    });

    it('should export settings as JSON', async () => {
      const testData = { setting1: 'value1', setting2: 'value2' };
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback(testData);
      });

      const exportData = await service.exportSettings();

      const parsed = JSON.parse(exportData);
      expect(parsed.version).toBe('3.0.0');
      expect(parsed.data).toEqual(testData);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should import settings from JSON', async () => {
      const importData = {
        version: '3.0.0',
        timestamp: Date.now(),
        data: { setting1: 'newValue1', setting2: 'newValue2' },
      };

      mockChromeStorage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      const result = await service.importSettings(JSON.stringify(importData));

      expect(result.success).toBe(true);
      expect(result.importedKeys).toEqual(['setting1', 'setting2']);
      expect(result.version).toBe('3.0.0');
      expect(mockChromeStorage.sync.set).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid import data', async () => {
      const invalidJson = '{ invalid json }';

      await expect(service.importSettings(invalidJson)).rejects.toThrow();
    });

    it('should handle missing data in import', async () => {
      const invalidImport = { version: '3.0.0' };

      await expect(service.importSettings(JSON.stringify(invalidImport))).rejects.toThrow(
        'Invalid import data format'
      );
    });
  });

  describe('Usage Information', () => {
    beforeEach(async () => {
      await service._initialize();
    });

    it('should get usage info', async () => {
      const syncData = { key1: 'value1' };
      const localData = { localKey: 'localValue' };
      
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => callback(syncData));
      mockChromeStorage.local.get.mockImplementation((keys, callback) => callback(localData));

      const usage = await service.getUsageInfo();

      expect(usage.syncBytes).toBeGreaterThan(0);
      expect(usage.localBytes).toBeGreaterThan(0);
      expect(usage.totalBytes).toBeGreaterThan(0);
      expect(usage.syncKeys).toBe(1);
      expect(usage.localKeys).toBe(1);
    });

    it('should get quota info', async () => {
      mockChromeStorage.sync.getBytesInUse.mockImplementation((callback) => {
        callback(50000); // 50KB
      });

      const quota = await service.getQuotaInfo();

      expect(quota.available).toBe(102400); // 100KB
      expect(quota.used).toBe(50000);
      expect(quota.percentage).toBeCloseTo(48.8, 1);
    });

    it('should handle missing getBytesInUse', async () => {
      delete mockChromeStorage.sync.getBytesInUse;

      const quota = await service.getQuotaInfo();

      expect(quota.available).toBe(102400);
      expect(quota.used).toBe(0);
      expect(quota.percentage).toBe(0);
    });
  });

  describe('Change Listeners', () => {
    beforeEach(async () => {
      await service._initialize();
    });

    it('should add and remove listeners', () => {
      const listener = jest.fn();

      const removeListener = service.addListener(listener);
      expect(service.listeners.has(listener)).toBe(true);

      removeListener();
      expect(service.listeners.has(listener)).toBe(false);
    });

    it('should notify listeners of changes', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      service.addListener(listener1);
      service.addListener(listener2);

      const changes = { testKey: { newValue: 'newValue', oldValue: 'oldValue' } };
      service._notifyListeners('testKey', 'newValue', 'oldValue');

      expect(listener1).toHaveBeenCalledWith('testKey', 'newValue', 'oldValue');
      expect(listener2).toHaveBeenCalledWith('testKey', 'newValue', 'oldValue');
    });

    it('should handle listener errors gracefully', () => {
      const goodListener = jest.fn();
      const badListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      service.addListener(goodListener);
      service.addListener(badListener);

      // Should not throw despite bad listener
      expect(() => {
        service._notifyListeners('testKey', 'newValue', 'oldValue');
      }).not.toThrow();

      expect(goodListener).toHaveBeenCalled();
      expect(badListener).toHaveBeenCalled();
    });
  });

  describe('Cache Operations', () => {
    beforeEach(async () => {
      await service._initialize();
    });

    it('should get cached value', () => {
      service.cache.set('cachedKey', 'cachedValue');

      const result = service.getCached('cachedKey');

      expect(result).toBe('cachedValue');
    });

    it('should return undefined for non-existent cache key', () => {
      const result = service.getCached('nonExistentKey');

      expect(result).toBeUndefined();
    });
  });

  describe('Fallback Operations', () => {
    beforeEach(() => {
      // Remove Chrome storage to test fallback
      delete global.chrome.storage;
    });

    it('should fallback to localStorage for get', async () => {
      mockLocalStorage.data.fallbackKey = '"fallbackValue"';

      const result = await service.getSync('fallbackKey');

      expect(result).toBe('fallbackValue');
    });

    it('should fallback to localStorage for set', async () => {
      await service.setSync('fallbackKey', 'newValue');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'fallbackKey',
        JSON.stringify('newValue')
      );
    });

    it('should handle fallback errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await service.getSync('errorKey');

      expect(result).toBeUndefined();
    });
  });

  describe('Ready State', () => {
    it('should return ready state', async () => {
      expect(service.ready()).toBe(false);

      await service._initialize();

      expect(service.ready()).toBe(true);
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(storageService).toBeInstanceOf(StorageService);
    });

    it('should maintain state across imports', () => {
      const instance1 = storageService;
      const { storageService: instance2 } = require('../../src/services/storageService.js');

      expect(instance1).toBe(instance2);
    });
  });
});