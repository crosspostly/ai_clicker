/**
 * Storage - Wrapper around Chrome Storage API
 */
class Storage {
  /**
   * Get items from local storage
   * @param {string|Array} keys - Keys to retrieve
   * @returns {Promise<Object>}
   */
  static async getLocal(keys) {
    try {
      return await chrome.storage.local.get(keys);
    } catch (error) {
      Logger.error('Storage', 'getLocal failed', error);
      return {};
    }
  }

  /**
   * Set items in local storage
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  static async setLocal(items) {
    try {
      return await chrome.storage.local.set(items);
    } catch (error) {
      Logger.error('Storage', 'setLocal failed', error);
    }
  }

  /**
   * Remove items from local storage
   * @param {string|Array} keys - Keys to remove
   * @returns {Promise<void>}
   */
  static async removeLocal(keys) {
    try {
      return await chrome.storage.local.remove(keys);
    } catch (error) {
      Logger.error('Storage', 'removeLocal failed', error);
    }
  }

  /**
   * Get items from sync storage
   * @param {string|Array} keys - Keys to retrieve
   * @returns {Promise<Object>}
   */
  static async getSync(keys) {
    try {
      return await chrome.storage.sync.get(keys);
    } catch (error) {
      Logger.error('Storage', 'getSync failed', error);
      return {};
    }
  }

  /**
   * Set items in sync storage
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  static async setSync(items) {
    try {
      return await chrome.storage.sync.set(items);
    } catch (error) {
      Logger.error('Storage', 'setSync failed', error);
    }
  }

  /**
   * Remove items from sync storage
   * @param {string|Array} keys - Keys to remove
   * @returns {Promise<void>}
   */
  static async removeSync(keys) {
    try {
      return await chrome.storage.sync.remove(keys);
    } catch (error) {
      Logger.error('Storage', 'removeSync failed', error);
    }
  }

  /**
   * Get recorded actions
   * @returns {Promise<Array>}
   */
  static async getActions() {
    const result = await this.getLocal('recordedActions');
    return result.recordedActions || [];
  }

  /**
   * Save recorded actions
   * @param {Array} actions - Actions to save
   * @returns {Promise<void>}
   */
  static async saveActions(actions) {
    return await this.setLocal({ recordedActions: actions });
  }

  /**
   * Clear recorded actions
   * @returns {Promise<void>}
   */
  static async clearActions() {
    return await this.removeLocal('recordedActions');
  }

  /**
   * Get extension settings
   * @returns {Promise<Object>}
   */
  static async getSettings() {
    return await this.getSync([
      'geminiApiKey',
      'geminiEnabled',
      'logLevel',
      'maxRetries',
      'timeout',
      'showHints',
      'saveHistory',
    ]);
  }

  /**
   * Save extension settings
   * @param {Object} settings - Settings to save
   * @returns {Promise<void>}
   */
  static async saveSettings(settings) {
    return await this.setSync(settings);
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  static async clear() {
    try {
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();
    } catch (error) {
      Logger.error('Storage', 'clear failed', error);
    }
  }

  /**
   * Get storage usage
   * @returns {Promise<Object>}
   */
  static async getUsage() {
    try {
      const info = await chrome.storage.local.getBytesInUse();
      return { used: info, available: chrome.storage.local.QUOTA_BYTES };
    } catch (error) {
      Logger.error('Storage', 'getUsage failed', error);
      return { used: 0, available: 0 };
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
