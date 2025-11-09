/**
 * Chrome Storage service wrapper with sync and local backup
 */

import { STORAGE_KEYS } from '../common/constants.js';

export class StorageService {
  constructor() {
    this.isReady = false;
    this.cache = new Map();
    this.listeners = new Set();
    this._initialize();
  }

  /**
   * Initialize storage service
   */
  async _initialize() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Load initial data into cache
        await this._loadCache();
        this._setupChangeListener();
        this.isReady = true;
      } else {
        console.warn('Chrome storage API not available, using fallback');
        this.isReady = true;
      }
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      this.isReady = true;
    }
  }

  /**
   * Load all storage data into cache
   */
  async _loadCache() {
    try {
      const data = await this.getSync(null);
      Object.entries(data).forEach(([key, value]) => {
        this.cache.set(key, value);
      });
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }

  /**
   * Setup storage change listener
   */
  _setupChangeListener() {
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
          Object.entries(changes).forEach(([key, change]) => {
            this.cache.set(key, change.newValue);
            this._notifyListeners(key, change.newValue, change.oldValue);
          });
        }
      });
    }
  }

  /**
   * Notify all listeners of storage changes
   */
  _notifyListeners(key, newValue, oldValue) {
    this.listeners.forEach(listener => {
      try {
        listener(key, newValue, oldValue);
      } catch (error) {
        console.error('Error in storage listener:', error);
      }
    });
  }

  /**
   * Get data from sync storage
   */
  async getSync(key) {
    return new Promise((resolve, reject) => {
      if (!chrome.storage || !chrome.storage.sync) {
        // Fallback to cache or localStorage
        resolve(this._getFallback(key));
        return;
      }

      chrome.storage.sync.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(key ? result[key] : result);
        }
      });
    });
  }

  /**
   * Set data to sync storage with local backup
   */
  async setSync(key, value) {
    try {
      // Update cache first
      this.cache.set(key, value);
      
      // Set to sync storage
      await this._setSyncStorage(key, value);
      
      // Create local backup
      await this._setLocalBackup(key, value);
      
      return true;
    } catch (error) {
      console.error('Failed to set sync storage:', error);
      throw error;
    }
  }

  /**
   * Set data to Chrome sync storage
   */
  async _setSyncStorage(key, value) {
    return new Promise((resolve, reject) => {
      if (!chrome.storage || !chrome.storage.sync) {
        this._setFallback(key, value);
        resolve(true);
        return;
      }

      const data = typeof key === 'object' ? key : { [key]: value };
      
      chrome.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Create local backup
   */
  async _setLocalBackup(key, value) {
    if (!chrome.storage || !chrome.storage.local) {
      return;
    }

    return new Promise((resolve) => {
      const backupKey = `backup_${key}`;
      chrome.storage.local.set({ [backupKey]: value }, () => {
        resolve(true);
      });
    });
  }

  /**
   * Get data from local storage
   */
  async getLocal(key) {
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.local) {
        resolve(this._getFallback(key));
        return;
      }

      chrome.storage.local.get(key, (result) => {
        resolve(key ? result[key] : result);
      });
    });
  }

  /**
   * Remove data from storage
   */
  async remove(keys) {
    try {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      
      // Remove from cache
      keysArray.forEach(key => this.cache.delete(key));
      
      // Remove from sync storage
      if (chrome.storage && chrome.storage.sync) {
        await new Promise((resolve, reject) => {
          chrome.storage.sync.remove(keysArray, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(true);
            }
          });
        });
      }
      
      // Remove from local storage
      if (chrome.storage && chrome.storage.local) {
        await new Promise((resolve) => {
          chrome.storage.local.remove(keysArray, resolve);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to remove storage data:', error);
      throw error;
    }
  }

  /**
   * Clear all storage data
   */
  async clear() {
    try {
      this.cache.clear();
      
      if (chrome.storage && chrome.storage.sync) {
        await new Promise((resolve, reject) => {
          chrome.storage.sync.clear(() => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(true);
            }
          });
        });
      }
      
      if (chrome.storage && chrome.storage.local) {
        await new Promise((resolve) => {
          chrome.storage.local.clear(resolve);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Export settings as JSON
   */
  async exportSettings(keys = null) {
    try {
      const data = keys ? await this.getSync(keys) : await this.getSync(null);
      const exportData = {
        version: '3.0.0',
        timestamp: Date.now(),
        data,
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from JSON
   */
  async importSettings(jsonString) {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.data || typeof importData.data !== 'object') {
        throw new Error('Invalid import data format');
      }
      
      // Validate and import each key
      for (const [key, value] of Object.entries(importData.data)) {
        await this.setSync(key, value);
      }
      
      return {
        success: true,
        importedKeys: Object.keys(importData.data),
        version: importData.version,
      };
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }

  /**
   * Get storage usage info
   */
  async getUsageInfo() {
    try {
      const syncData = await this.getSync(null);
      const localData = await this.getLocal(null);
      
      const syncSize = JSON.stringify(syncData).length;
      const localSize = JSON.stringify(localData).length;
      
      return {
        syncBytes: syncSize,
        localBytes: localSize,
        totalBytes: syncSize + localSize,
        syncKeys: Object.keys(syncData).length,
        localKeys: Object.keys(localData).length,
      };
    } catch (error) {
      console.error('Failed to get usage info:', error);
      return {
        syncBytes: 0,
        localBytes: 0,
        totalBytes: 0,
        syncKeys: 0,
        localKeys: 0,
      };
    }
  }

  /**
   * Add storage change listener
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove storage change listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Fallback getter for when Chrome storage is unavailable
   */
  _getFallback(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : undefined;
      }
    } catch (error) {
      console.warn('Fallback get failed:', error);
    }
    return key ? this.cache.get(key) : Object.fromEntries(this.cache);
  }

  /**
   * Fallback setter for when Chrome storage is unavailable
   */
  _setFallback(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn('Fallback set failed:', error);
    }
  }

  /**
   * Check if storage service is ready
   */
  ready() {
    return this.isReady;
  }

  /**
   * Get cached value immediately (async)
   */
  getCached(key) {
    return this.cache.get(key);
  }

  /**
   * Get storage quota information
   */
  async getQuotaInfo() {
    if (!chrome.storage || !chrome.storage.sync) {
      return { available: 102400, used: 0, percentage: 0 }; // 100KB fallback
    }

    return new Promise((resolve) => {
      if (chrome.storage.sync.getBytesInUse) {
        chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
          resolve({
            available: 102400, // Chrome sync storage limit
            used: bytesInUse,
            percentage: (bytesInUse / 102400) * 100,
          });
        });
      } else {
        resolve({ available: 102400, used: 0, percentage: 0 });
      }
    });
  }
}

// Singleton instance
export const storageService = new StorageService();