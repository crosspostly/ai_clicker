/**
 * Tests for Chrome Storage API wrapper
 */

import { Storage } from '../../common/storage.js';

describe('Storage', () => {
  beforeEach(() => {
    // Clear all Chrome storage mocks
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.storage.local.remove.mockClear();
    chrome.storage.local.clear.mockClear();
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
    chrome.storage.sync.remove.mockClear();
    chrome.storage.sync.clear.mockClear();
  });

  describe('get()', () => {
    it('should get value from local storage', async () => {
      const mockData = { key: 'value' };
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(mockData);
      });

      const result = await Storage.get('key');
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith('key', expect.any(Function));
      expect(result).toEqual({ key: 'value' });
    });

    it('should get multiple keys from local storage', async () => {
      const mockData = { key1: 'value1', key2: 'value2' };
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(mockData);
      });

      const result = await Storage.get(['key1', 'key2']);
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['key1', 'key2'], expect.any(Function));
      expect(result).toEqual(mockData);
    });

    it('should get all keys when no keys specified', async () => {
      const mockData = { key1: 'value1', key2: 'value2' };
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(mockData);
      });

      const result = await Storage.get();
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith(null, expect.any(Function));
      expect(result).toEqual(mockData);
    });

    it('should return default value when key not found', async () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const result = await Storage.get('nonexistent', 'default');
      
      expect(result).toBe('default');
    });

    it('should use sync storage when specified', async () => {
      const mockData = { key: 'value' };
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(mockData);
      });

      const result = await Storage.get('key', null, true);
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('key', expect.any(Function));
      expect(chrome.storage.local.get).not.toHaveBeenCalled();
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle storage errors', async () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        chrome.runtime.lastError = { message: 'Storage error' };
        callback({});
      });

      await expect(Storage.get('key')).rejects.toThrow('Storage error');
    });
  });

  describe('set()', () => {
    it('should set value in local storage', async () => {
      chrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      await Storage.set('key', 'value');
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ key: 'value' }, expect.any(Function));
    });

    it('should set multiple values', async () => {
      chrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      await Storage.set({ key1: 'value1', key2: 'value2' });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { key1: 'value1', key2: 'value2' }, 
        expect.any(Function),
      );
    });

    it('should use sync storage when specified', async () => {
      chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      await Storage.set('key', 'value', true);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ key: 'value' }, expect.any(Function));
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      chrome.storage.local.set.mockImplementation((data, callback) => {
        chrome.runtime.lastError = { message: 'Quota exceeded' };
        callback();
      });

      await expect(Storage.set('key', 'value')).rejects.toThrow('Quota exceeded');
    });
  });

  describe('remove()', () => {
    it('should remove key from local storage', async () => {
      chrome.storage.local.remove.mockImplementation((keys, callback) => {
        callback();
      });

      await Storage.remove('key');
      
      expect(chrome.storage.local.remove).toHaveBeenCalledWith('key', expect.any(Function));
    });

    it('should remove multiple keys', async () => {
      chrome.storage.local.remove.mockImplementation((keys, callback) => {
        callback();
      });

      await Storage.remove(['key1', 'key2']);
      
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(['key1', 'key2'], expect.any(Function));
    });

    it('should use sync storage when specified', async () => {
      chrome.storage.sync.remove.mockImplementation((keys, callback) => {
        callback();
      });

      await Storage.remove('key', true);
      
      expect(chrome.storage.sync.remove).toHaveBeenCalledWith('key', expect.any(Function));
      expect(chrome.storage.local.remove).not.toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      chrome.storage.local.remove.mockImplementation((keys, callback) => {
        chrome.runtime.lastError = { message: 'Key not found' };
        callback();
      });

      await expect(Storage.remove('key')).rejects.toThrow('Key not found');
    });
  });

  describe('clear()', () => {
    it('should clear local storage', async () => {
      chrome.storage.local.clear.mockImplementation((callback) => {
        callback();
      });

      await Storage.clear();
      
      expect(chrome.storage.local.clear).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clear sync storage when specified', async () => {
      chrome.storage.sync.clear.mockImplementation((callback) => {
        callback();
      });

      await Storage.clear(true);
      
      expect(chrome.storage.sync.clear).toHaveBeenCalledWith(expect.any(Function));
      expect(chrome.storage.local.clear).not.toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      chrome.storage.local.clear.mockImplementation((callback) => {
        chrome.runtime.lastError = { message: 'Clear failed' };
        callback();
      });

      await expect(Storage.clear()).rejects.toThrow('Clear failed');
    });
  });

  describe('Utility methods', () => {
    beforeEach(() => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({
          scenarios: [
            { id: 1, name: 'Test Scenario 1' },
            { id: 2, name: 'Test Scenario 2' },
          ],
          settings: {
            apiKey: 'test-key',
            autoMode: true,
          },
        });
      });
    });

    it('should get scenarios', async () => {
      const scenarios = await Storage.getScenarios();
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith('scenarios', expect.any(Function));
      expect(scenarios).toEqual([
        { id: 1, name: 'Test Scenario 1' },
        { id: 2, name: 'Test Scenario 2' },
      ]);
    });

    it('should save scenarios', async () => {
      const newScenarios = [{ id: 3, name: 'New Scenario' }];
      chrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      await Storage.saveScenarios(newScenarios);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { scenarios: newScenarios },
        expect.any(Function),
      );
    });

    it('should get settings', async () => {
      const settings = await Storage.getSettings();
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith('settings', expect.any(Function));
      expect(settings).toEqual({
        apiKey: 'test-key',
        autoMode: true,
      });
    });

    it('should save settings', async () => {
      const newSettings = { apiKey: 'new-key', autoMode: false };
      chrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      await Storage.saveSettings(newSettings);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { settings: newSettings },
        expect.any(Function),
      );
    });
  });
});