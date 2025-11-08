/**
 * Storage utility for managing Chrome extension storage
 * Provides encrypted and secure storage access
 */

class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

class StorageManager {
  /**
   * Get value from storage with error handling
   */
  static async get(keys, storageType = 'sync') {
    return new Promise((resolve, reject) => {
      try {
        const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
        storage.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new StorageError(`Storage get error: ${chrome.runtime.lastError.message}`));
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(new StorageError(`Storage access error: ${error.message}`));
      }
    });
  }

  /**
   * Set value in storage with error handling
   */
  static async set(data, storageType = 'sync') {
    return new Promise((resolve, reject) => {
      try {
        const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
        storage.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(new StorageError(`Storage set error: ${chrome.runtime.lastError.message}`));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(new StorageError(`Storage access error: ${error.message}`));
      }
    });
  }

  /**
   * Remove values from storage
   */
  static async remove(keys, storageType = 'sync') {
    return new Promise((resolve, reject) => {
      try {
        const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
        storage.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(new StorageError(`Storage remove error: ${chrome.runtime.lastError.message}`));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(new StorageError(`Storage access error: ${error.message}`));
      }
    });
  }

  /**
   * Clear all storage
   */
  static async clear(storageType = 'sync') {
    return new Promise((resolve, reject) => {
      try {
        const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
        storage.clear(() => {
          if (chrome.runtime.lastError) {
            reject(new StorageError(`Storage clear error: ${chrome.runtime.lastError.message}`));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(new StorageError(`Storage access error: ${error.message}`));
      }
    });
  }

  /**
   * Get all storage data
   */
  static async getAll(storageType = 'sync') {
    return this.get(null, storageType);
  }

  /**
   * Store actions with expiration
   */
  static async saveActions(actions, expirationDays = 30) {
    const data = {
      actions,
      savedAt: Date.now(),
      expiresAt: Date.now() + (expirationDays * 24 * 60 * 60 * 1000),
    };
    await this.set({ recordedActions: data }, 'local');
  }

  /**
   * Get stored actions if not expired
   */
  static async getActions() {
    const result = await this.get('recordedActions', 'local');
    const data = result.recordedActions;
    
    if (!data) return [];
    if (data.expiresAt && Date.now() > data.expiresAt) {
      await this.remove('recordedActions', 'local');
      return [];
    }
    
    return data.actions || [];
  }

  /**
   * Store execution history
   */
  static async addExecutionHistory(execution) {
    const result = await this.get('executionHistory', 'local');
    let history = result.executionHistory || [];
    
    history.push({
      ...execution,
      timestamp: Date.now(),
    });
    
    // Keep only last 100 executions
    if (history.length > 100) {
      history = history.slice(-100);
    }
    
    await this.set({ executionHistory: history }, 'local');
  }

  /**
   * Get execution history
   */
  static async getExecutionHistory(limit = 50) {
    const result = await this.get('executionHistory', 'local');
    let history = result.executionHistory || [];
    return history.slice(-limit);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager, StorageError };
}
