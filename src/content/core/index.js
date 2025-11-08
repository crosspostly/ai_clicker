/**
 * Content Core - Initialize and expose core modules
 */

class ContentCore {
  static instance = null;

  constructor() {
    this.elementFinder = null;
    this.actionRecorder = null;
    this.actionExecutor = null;
    this.isInitialized = false;
  }

  /**
   * Get singleton instance
   * @returns {ContentCore}
   */
  static getInstance() {
    if (!ContentCore.instance) {
      ContentCore.instance = new ContentCore();
    }
    return ContentCore.instance;
  }

  /**
   * Initialize core modules
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      Logger.warn('ContentCore', 'Already initialized');
      return;
    }

    try {
      Logger.info('ContentCore', 'Initializing');

      this.elementFinder = new ElementFinder();
      this.actionRecorder = new ActionRecorder(this.elementFinder);
      this.actionExecutor = new ActionExecutor(this.elementFinder);

      this.isInitialized = true;
      Logger.info('ContentCore', 'Initialized successfully');
    } catch (error) {
      Logger.error('ContentCore', 'Initialization failed', error);
      throw error;
    }
  }

  /**
   * Get element finder
   * @returns {ElementFinder}
   */
  getElementFinder() {
    if (!this.isInitialized) {
      throw new Error('ContentCore not initialized');
    }
    return this.elementFinder;
  }

  /**
   * Get action recorder
   * @returns {ActionRecorder}
   */
  getActionRecorder() {
    if (!this.isInitialized) {
      throw new Error('ContentCore not initialized');
    }
    return this.actionRecorder;
  }

  /**
   * Get action executor
   * @returns {ActionExecutor}
   */
  getActionExecutor() {
    if (!this.isInitialized) {
      throw new Error('ContentCore not initialized');
    }
    return this.actionExecutor;
  }

  /**
   * Get status of all core modules
   * @returns {Object}
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      recorder: this.actionRecorder?.getStatus(),
      executor: this.actionExecutor?.getStatus(),
      cache: this.elementFinder?.getCacheStats(),
    };
  }

  /**
   * Reset all core modules
   */
  reset() {
    if (this.actionRecorder?.isRecording) {
      this.actionRecorder.stop();
    }

    if (this.elementFinder) {
      this.elementFinder.clearCache();
    }

    Logger.info('ContentCore', 'Reset complete');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentCore;
}
