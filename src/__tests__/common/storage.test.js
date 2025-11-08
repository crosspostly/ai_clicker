import { StorageManager, StorageError } from '../../common/storage.js';

describe('StorageManager Class', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('StorageError should extend Error', () => {
    const error = new StorageError('Storage failed');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Storage failed');
    expect(error.name).toBe('StorageError');
  });

  test('StorageManager.getLocal() should call chrome.storage.local.get', async () => {
    chrome.storage.local.get.mockResolvedValue({ key: 'value' });
    const result = await StorageManager.getLocal('key');
    expect(chrome.storage.local.get).toHaveBeenCalledWith('key');
    expect(result).toEqual({ key: 'value' });
  });

  test('StorageManager.setLocal() should call chrome.storage.local.set', async () => {
    chrome.storage.local.set.mockResolvedValue({});
    await StorageManager.setLocal({ key: 'value' });
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ key: 'value' });
  });

  test('StorageManager.getSync() should call chrome.storage.sync.get', async () => {
    chrome.storage.sync.get.mockResolvedValue({ key: 'value' });
    const result = await StorageManager.getSync('key');
    expect(chrome.storage.sync.get).toHaveBeenCalledWith('key');
    expect(result).toEqual({ key: 'value' });
  });

  test('StorageManager.setSync() should call chrome.storage.sync.set', async () => {
    chrome.storage.sync.set.mockResolvedValue({});
    await StorageManager.setSync({ key: 'value' });
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ key: 'value' });
  });

  test('StorageManager.remove() should call chrome.storage.local.remove', async () => {
    chrome.storage.local.remove.mockImplementation((keys, callback) => {
      if (callback) callback();
    });
    chrome.runtime.lastError = null;
    await StorageManager.remove('key', 'local');
    expect(chrome.storage.local.remove).toHaveBeenCalledWith('key', expect.any(Function));
  });

  test('StorageManager.remove() should call chrome.storage.sync.remove', async () => {
    chrome.storage.sync.remove.mockImplementation((keys, callback) => {
      if (callback) callback();
    });
    chrome.runtime.lastError = null;
    await StorageManager.remove('key', 'sync');
    expect(chrome.storage.sync.remove).toHaveBeenCalledWith('key', expect.any(Function));
  });

  test('StorageManager.clear() should clear local storage', async () => {
    chrome.storage.local.clear.mockImplementation((callback) => {
      if (callback) callback();
    });
    chrome.runtime.lastError = null;
    await StorageManager.clear('local');
    expect(chrome.storage.local.clear).toHaveBeenCalledWith(expect.any(Function));
  });

  test('StorageManager.clear() should clear sync storage', async () => {
    chrome.storage.sync.clear.mockImplementation((callback) => {
      if (callback) callback();
    });
    chrome.runtime.lastError = null;
    await StorageManager.clear('sync');
    expect(chrome.storage.sync.clear).toHaveBeenCalledWith(expect.any(Function));
  });

  test('StorageManager should handle getLocal errors', async () => {
    chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));
    const result = await StorageManager.getLocal('key');
    expect(result).toEqual({});
  });

  test('StorageManager should handle setLocal errors', async () => {
    chrome.storage.local.set.mockRejectedValue(new Error('Storage error'));
    await expect(StorageManager.setLocal({ key: 'value' })).resolves.toBeUndefined();
  });

  test('StorageManager should handle getSync errors', async () => {
    chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
    const result = await StorageManager.getSync('key');
    expect(result).toEqual({});
  });

  test('StorageManager should handle setSync errors', async () => {
    chrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));
    await expect(StorageManager.setSync({ key: 'value' })).resolves.toBeUndefined();
  });

  test('StorageManager should handle array of keys', async () => {
    chrome.storage.local.get.mockResolvedValue({ key1: 'value1', key2: 'value2' });
    const result = await StorageManager.getLocal(['key1', 'key2']);
    expect(chrome.storage.local.get).toHaveBeenCalledWith(['key1', 'key2']);
    expect(result).toEqual({ key1: 'value1', key2: 'value2' });
  });

  test('StorageManager should handle empty object in setLocal', async () => {
    chrome.storage.local.set.mockResolvedValue({});
    await StorageManager.setLocal({});
    expect(chrome.storage.local.set).toHaveBeenCalledWith({});
  });

  test('StorageManager should handle empty object in setSync', async () => {
    chrome.storage.sync.set.mockResolvedValue({});
    await StorageManager.setSync({});
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({});
  });

  test('StorageManager.getSettings() should call getSync with settings keys', async () => {
    chrome.storage.sync.get.mockResolvedValue({ geminiApiKey: 'test-key' });
    const result = await StorageManager.getSettings();
    expect(chrome.storage.sync.get).toHaveBeenCalledWith([
      'geminiApiKey',
      'geminiEnabled',
      'logLevel',
      'maxRetries',
      'timeout',
    ]);
    expect(result).toEqual({ geminiApiKey: 'test-key' });
  });

  test('StorageManager.saveSettings() should call setSync', async () => {
    chrome.storage.sync.set.mockResolvedValue({});
    const settings = { geminiApiKey: 'new-key' };
    await StorageManager.saveSettings(settings);
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(settings);
  });

  test('StorageManager.get() should work with local storage', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ key: 'local-value' });
    });
    chrome.runtime.lastError = null;
    const result = await StorageManager.get('key', 'local');
    expect(chrome.storage.local.get).toHaveBeenCalledWith('key', expect.any(Function));
    expect(result).toEqual({ key: 'local-value' });
  });

  test('StorageManager.get() should work with sync storage', async () => {
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({ key: 'sync-value' });
    });
    chrome.runtime.lastError = null;
    const result = await StorageManager.get('key', 'sync');
    expect(chrome.storage.sync.get).toHaveBeenCalledWith('key', expect.any(Function));
    expect(result).toEqual({ key: 'sync-value' });
  });

  test('StorageManager.set() should work with local storage', async () => {
    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback();
    });
    chrome.runtime.lastError = null;
    await StorageManager.set({ key: 'value' }, 'local');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ key: 'value' }, expect.any(Function));
  });

  test('StorageManager.set() should work with sync storage', async () => {
    chrome.storage.sync.set.mockImplementation((data, callback) => {
      callback();
    });
    chrome.runtime.lastError = null;
    await StorageManager.set({ key: 'value' }, 'sync');
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ key: 'value' }, expect.any(Function));
  });

  test('StorageManager.getAll() should get all data from local storage', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ key1: 'value1', key2: 'value2' });
    });
    chrome.runtime.lastError = null;
    const result = await StorageManager.getAll('local');
    expect(chrome.storage.local.get).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result).toEqual({ key1: 'value1', key2: 'value2' });
  });

  test('StorageManager.getAll() should get all data from sync storage', async () => {
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({ key1: 'value1', key2: 'value2' });
    });
    chrome.runtime.lastError = null;
    const result = await StorageManager.getAll('sync');
    expect(chrome.storage.sync.get).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result).toEqual({ key1: 'value1', key2: 'value2' });
  });

  test('StorageManager.saveActions() should save actions with timestamps', async () => {
    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback();
    });
    chrome.runtime.lastError = null;
    const actions = [{ type: 'click' }];
    await StorageManager.saveActions(actions, 30);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      recordedActions: {
        actions,
        savedAt: expect.any(Number),
        expiresAt: expect.any(Number)
      }
    }, expect.any(Function));
  });
});