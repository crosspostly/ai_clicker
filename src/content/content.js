/**
 * Content Script - Main entry point for webpage interaction
 */

class ContentScript {
  constructor() {
    this.core = null;
    this.messagePort = null;
    this.initialized = false;
  }

  /**
   * Initialize content script
   */
  async init() {
    try {
      Logger.info('ContentScript', 'Initializing');

      this.core = ContentCore.getInstance();
      await this.core.initialize();

      this.setupMessageListeners();
      this.setupEventListeners();

      this.initialized = true;
      Logger.info('ContentScript', 'Initialized successfully');
    } catch (error) {
      Logger.error('ContentScript', 'Initialization failed', error);
    }
  }

  /**
   * Setup message listeners from background script
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const recorder = this.core.getActionRecorder();
    const executor = this.core.getActionExecutor();

    recorder.on('started', () => {
      Logger.info('ContentScript', 'Recording started');
      this.sendToBackground({
        type: 'recording-started',
      });
    });

    recorder.on('stopped', actions => {
      Logger.info('ContentScript', 'Recording stopped', { count: actions.length });
      this.sendToBackground({
        type: 'recording-stopped',
        data: { actions },
      });
    });

    recorder.on('action-recorded', action => {
      this.sendToBackground({
        type: 'action-recorded',
        data: { action },
      });
    });

    executor.on('started', actions => {
      Logger.info('ContentScript', 'Execution started', { count: actions.length });
      this.sendToBackground({
        type: 'execution-started',
        data: { count: actions.length },
      });
    });

    executor.on('action-completed', data => {
      this.sendToBackground({
        type: 'action-completed',
        data,
      });
    });

    executor.on('action-failed', data => {
      Logger.warn('ContentScript', 'Action failed', data);
      this.sendToBackground({
        type: 'action-failed',
        data,
      });
    });

    executor.on('completed', results => {
      Logger.info('ContentScript', 'Execution completed', results);
      this.sendToBackground({
        type: 'execution-completed',
        data: { results },
      });
    });

    executor.on('error', error => {
      Logger.error('ContentScript', 'Execution error', error);
      this.sendToBackground({
        type: 'execution-error',
        data: { error: error.message },
      });
    });
  }

  /**
   * Handle message from background script
   * @param {Object} message - Message object
   * @param {Object} sender - Message sender info
   * @param {Function} sendResponse - Response callback
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'start-recording':
          return this.handleStartRecording(sendResponse);

        case 'stop-recording':
          return this.handleStopRecording(sendResponse);

        case 'execute-actions':
          return this.handleExecuteActions(message, sendResponse);

        case 'stop-execution':
          return this.handleStopExecution(sendResponse);

        case 'pause-execution':
          return this.handlePauseExecution(sendResponse);

        case 'resume-execution':
          return this.handleResumeExecution(sendResponse);

        case 'get-status':
          return this.handleGetStatus(sendResponse);

        case 'clear-actions':
          return this.handleClearActions(sendResponse);

        default:
          Logger.warn('ContentScript', `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      Logger.error('ContentScript', 'Error handling message', error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Start recording actions
   * @param {Function} sendResponse - Response callback
   */
  handleStartRecording(sendResponse) {
    try {
      const recorder = this.core.getActionRecorder();
      recorder.start();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Stop recording actions
   * @param {Function} sendResponse - Response callback
   */
  handleStopRecording(sendResponse) {
    try {
      const recorder = this.core.getActionRecorder();
      const actions = recorder.stop();
      sendResponse({ success: true, actions });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Execute actions
   * @param {Object} message - Message with actions
   * @param {Function} sendResponse - Response callback
   */
  async handleExecuteActions(message, sendResponse) {
    try {
      const { actions, settings } = message;
      const executor = this.core.getActionExecutor();

      if (settings) {
        executor.settings = { ...executor.settings, ...settings };
      }

      const results = await executor.execute(actions);
      sendResponse({ success: true, results });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Stop execution
   * @param {Function} sendResponse - Response callback
   */
  handleStopExecution(sendResponse) {
    try {
      const executor = this.core.getActionExecutor();
      executor.stop();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Pause execution
   * @param {Function} sendResponse - Response callback
   */
  handlePauseExecution(sendResponse) {
    try {
      const executor = this.core.getActionExecutor();
      executor.pause();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Resume execution
   * @param {Function} sendResponse - Response callback
   */
  handleResumeExecution(sendResponse) {
    try {
      const executor = this.core.getActionExecutor();
      executor.resume();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Get status
   * @param {Function} sendResponse - Response callback
   */
  handleGetStatus(sendResponse) {
    try {
      const status = this.core.getStatus();
      sendResponse({ success: true, status });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Clear actions
   * @param {Function} sendResponse - Response callback
   */
  handleClearActions(sendResponse) {
    try {
      const recorder = this.core.getActionRecorder();
      recorder.clear();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  /**
   * Send message to background script
   * @param {Object} message - Message to send
   */
  sendToBackground(message) {
    try {
      chrome.runtime.sendMessage(message, _response => {
        if (chrome.runtime.lastError) {
          Logger.warn('ContentScript', 'Message error', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      Logger.error('ContentScript', 'Failed to send message', error);
    }
  }

  /**
   * Cleanup on script unload
   */
  cleanup() {
    try {
      this.core?.reset();
      Logger.info('ContentScript', 'Cleanup complete');
    } catch (error) {
      Logger.error('ContentScript', 'Cleanup error', error);
    }
  }
}

const contentScript = new ContentScript();
contentScript.init();

window.addEventListener('unload', () => {
  contentScript.cleanup();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentScript;
}
