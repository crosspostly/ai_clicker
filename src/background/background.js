/**
 * Background Service Worker - Main background process
 */

class BackgroundService {
  constructor() {
    this.messageHandlers = new Map();
    this.initialized = false;
  }

  /**
   * Initialize background service
   */
  async init() {
    try {
      console.log('[BACKGROUND] Initializing');

      this.setupMessageListeners();
      this.setupExtensionListeners();

      this.initialized = true;
      console.log('[BACKGROUND] Initialized successfully');
    } catch (error) {
      console.error('[BACKGROUND] Initialization failed', error);
    }
  }

  /**
   * Setup message listeners from content scripts and popup
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
      this.handleMessage(message, sender, _sendResponse);
      return true;
    });
  }

  /**
   * Setup extension listeners
   */
  setupExtensionListeners() {
    chrome.runtime.onInstalled.addListener(details => {
      this.handleInstall(details);
    });

    chrome.tabs.onActivated.addListener(activeInfo => {
      this.handleTabActivated(activeInfo);
    });
  }

  /**
   * Handle messages from content scripts and popup
   * @param {Object} message - Message object
   * @param {Object} sender - Sender info
   * @param {Function} sendResponse - Response callback
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('[BACKGROUND] Message received', message.type);

      switch (message.type) {
        case 'recording-started':
          return this.handleRecordingStarted(message, sender, sendResponse);

        case 'recording-stopped':
          return this.handleRecordingStopped(message, sender, sendResponse);

        case 'action-recorded':
          return this.handleActionRecorded(message, sender, sendResponse);

        case 'execution-started':
          return this.handleExecutionStarted(message, sender, sendResponse);

        case 'action-completed':
          return this.handleActionCompleted(message, sender, sendResponse);

        case 'action-failed':
          return this.handleActionFailed(message, sender, sendResponse);

        case 'execution-completed':
          return this.handleExecutionCompleted(message, sender, sendResponse);

        case 'execution-error':
          return this.handleExecutionError(message, sender, sendResponse);

        case 'get-settings':
          return this.handleGetSettings(sendResponse);

        case 'save-settings':
          return this.handleSaveSettings(message, sendResponse);

        default:
          console.warn('[BACKGROUND] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[BACKGROUND] Error handling message', error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle recording started
   * @param {Object} message - Message
   * @param {Object} sender - Sender info
   * @param {Function} sendResponse - Response callback
   */
  handleRecordingStarted(message, sender, sendResponse) {
    console.log('[BACKGROUND] Recording started on tab', sender.tab.id);
    this.updateExtensionBadge('REC', '#f56565');
    sendResponse({ success: true });
  }

  /**
   * Handle recording stopped
   * @param {Object} message - Message
   * @param {Object} sender - Sender info
   * @param {Function} sendResponse - Response callback
   */
  async handleRecordingStopped(message, sender, sendResponse) {
    console.log('[BACKGROUND] Recording stopped, saving actions');
    const { actions } = message.data;

    try {
      await chrome.storage.local.set({
        recordedActions: actions,
        lastRecordedAt: new Date().toISOString(),
      });

      this.updateExtensionBadge('');
      sendResponse({ success: true });
    } catch (error) {
      console.error('[BACKGROUND] Failed to save actions', error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle action recorded
   * @param {Object} message - Message
   * @param {Object} sender - Sender info
   * @param {Function} sendResponse - Response callback
   */
  handleActionRecorded(message, sender, sendResponse) {
    const { action } = message.data;
    console.log('[BACKGROUND] Action recorded:', action.type);
    sendResponse({ success: true });
  }

  /**
   * Handle execution started
   * @param {Object} message - Message
   * @param {Object} sender - Sender info
   * @param {Function} sendResponse - Response callback
   */
  handleExecutionStarted(message, sender, sendResponse) {
    const { count } = message.data;
    console.log('[BACKGROUND] Execution started with', count, 'actions');
    this.updateExtensionBadge('RUN', '#667eea');
    sendResponse({ success: true });
  }

  /**
   * Handle action completed
   * @param {Object} message - Message
   * @param {Object} sender - Sender info
   * @param {Function} sendResponse - Response callback
   */
  handleActionCompleted(message, sender, sendResponse) {
    const { progress } = message.data;
    console.log('[BACKGROUND] Action completed, progress:', progress.toFixed(0) + '%');
    this.updateExtensionBadge(Math.ceil(progress) + '%', '#667eea');
    sendResponse({ success: true });
  }

  /**
   * Handle action failed
   * @param {Object} message - Message
   * @param {Object} sender - Sender info
   * @param {Function} sendResponse - Response callback
   */
  handleActionFailed(message, sender, sendResponse) {
    const { error } = message.data;
    console.warn('[BACKGROUND] Action failed:', error.message);
    sendResponse({ success: true });
  }

  /**
   * Handle execution completed
   * @param {Object} message - Message
   * @param {Object} sender - Sender info
   * @param {Function} sendResponse - Response callback
   */
  handleExecutionCompleted(message, sender, sendResponse) {
    const { results } = message.data;
    console.log('[BACKGROUND] Execution completed', results);
    this.updateExtensionBadge('');
    sendResponse({ success: true });
  }

  /**
   * Handle execution error
   * @param {Object} message - Message
   * @param {Object} sender - Sender info
   * @param {Function} sendResponse - Response callback
   */
  handleExecutionError(message, sender, sendResponse) {
    const { error } = message.data;
    console.error('[BACKGROUND] Execution error:', error);
    this.updateExtensionBadge('ERR', '#f56565');
    sendResponse({ success: true });
  }

  /**
   * Handle get settings
   * @param {Function} sendResponse - Response callback
   */
  async handleGetSettings(sendResponse) {
    try {
      const settings = await chrome.storage.sync.get([
        'geminiApiKey',
        'geminiEnabled',
        'logLevel',
        'maxRetries',
        'timeout',
        'showHints',
        'saveHistory',
      ]);

      sendResponse({ success: true, settings });
    } catch (error) {
      console.error('[BACKGROUND] Failed to get settings', error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle save settings
   * @param {Object} message - Message with settings
   * @param {Function} sendResponse - Response callback
   */
  async handleSaveSettings(message, sendResponse) {
    try {
      const { settings } = message;
      await chrome.storage.sync.set(settings);

      console.log('[BACKGROUND] Settings saved');
      sendResponse({ success: true });
    } catch (error) {
      console.error('[BACKGROUND] Failed to save settings', error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handle extension installation
   * @param {Object} details - Installation details
   */
  handleInstall(details) {
    if (details.reason === 'install') {
      console.log('[BACKGROUND] Extension installed');
      chrome.tabs.create({ url: 'settings/settings.html' });
    } else if (details.reason === 'update') {
      console.log('[BACKGROUND] Extension updated');
    }
  }

  /**
   * Handle tab activation
   * @param {Object} activeInfo - Active tab info
   */
  handleTabActivated(activeInfo) {
    console.log('[BACKGROUND] Tab activated:', activeInfo.tabId);
  }

  /**
   * Update extension badge
   * @param {string} text - Badge text
   * @param {string} color - Badge color (optional)
   */
  updateExtensionBadge(text, color = '#667eea') {
    chrome.action.setBadgeText({ text });
    if (text) {
      chrome.action.setBadgeBackgroundColor({ color });
    }
  }

  /**
   * Send message to content script
   * @param {number} tabId - Tab ID
   * @param {Object} message - Message to send
   */
  sendToContent(tabId, message) {
    chrome.tabs.sendMessage(tabId, message, _response => {
      if (chrome.runtime.lastError) {
        console.error(
          '[BACKGROUND] Failed to send message to tab',
          chrome.runtime.lastError,
        );
      }
    });
  }

  /**
   * Send message to popup
   * @param {Object} message - Message to send
   */
  sendToPopup(message) {
    chrome.runtime.sendMessage(message, _response => {
      if (chrome.runtime.lastError) {
        console.debug('[BACKGROUND] Popup not open');
      }
    });
  }
}

const backgroundService = new BackgroundService();
backgroundService.init();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundService;
}
