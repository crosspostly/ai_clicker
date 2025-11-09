/**
 * Playback Handler - Background script job management
 * Handles playback state, message routing, and storage
 */

import { PLAYBACK_MESSAGES, PLAYBACK_SPEEDS, PLAYBACK_RETRY, PLAYBACK_TIMEOUT } from '../common/constants.js';
import { PlaybackEngine } from '../services/playbackEngine.js';

export class PlaybackHandler {
  constructor() {
    this.jobs = new Map();
    this.nextJobId = 1;
    this.storageKey = 'playback_state';
    this.engines = new Map(); // jobId -> PlaybackEngine
    this._setupMessageListener();
    this._cleanupOldJobs();
  }

  /**
   * Setup message listener for playback commands
   * @private
   */
  _setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      (async () => {
        try {
          switch (request.type) {
            case PLAYBACK_MESSAGES.START: {
              const jobId = await this.start(request.actions, request.options);
              sendResponse({ success: true, jobId });
              break;
            }

            case PLAYBACK_MESSAGES.STOP: {
              const stopResult = await this.stop(request.jobId);
              sendResponse(stopResult);
              break;
            }

            case PLAYBACK_MESSAGES.PAUSE: {
              const pauseResult = await this.pause(request.jobId);
              sendResponse(pauseResult);
              break;
            }

            case PLAYBACK_MESSAGES.RESUME: {
              const resumeResult = await this.resume(request.jobId);
              sendResponse(resumeResult);
              break;
            }

            case PLAYBACK_MESSAGES.STATUS: {
              const status = await this.getStatus(request.jobId);
              sendResponse({ success: true, status });
              break;
            }

            case PLAYBACK_MESSAGES.EXECUTE:
              // Handle response from content script
              if (request.response) {
                await this._handleActionResponse(request.jobId, request.actionIndex, request.response);
              }
              sendResponse({ success: true });
              break;

            default:
              sendResponse({ success: false, error: `Unknown message type: ${request.type}` });
          }
        } catch (error) {
          console.error('[PlaybackHandler] Message error:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true; // Keep message channel open for async response
    });
  }

  /**
   * Start new playback job
   * @param {Array} actions - Actions to execute
   * @param {Object} options - Playback options
   * @returns {Promise<string>} Job ID
   */
  async start(actions, options = {}) {
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error('Actions must be a non-empty array');
    }

    const jobId = `job_${this.nextJobId++}`;
    const now = Date.now();

    // Validate options
    const speed = options.speed || 1;
    if (!PLAYBACK_SPEEDS.includes(speed)) {
      throw new Error(`Invalid speed: ${speed}. Must be one of ${PLAYBACK_SPEEDS.join(', ')}`);
    }

    const retryCount = options.retryCount || PLAYBACK_RETRY.MAX_ATTEMPTS;
    const timeout = options.timeout || PLAYBACK_TIMEOUT.DEFAULT_MS;

    if (timeout < PLAYBACK_TIMEOUT.MIN_MS || timeout > PLAYBACK_TIMEOUT.MAX_MS) {
      throw new Error(`Timeout must be between ${PLAYBACK_TIMEOUT.MIN_MS} and ${PLAYBACK_TIMEOUT.MAX_MS}ms`);
    }

    // Create PlaybackEngine instance
    const engine = new PlaybackEngine();
    
    // Set up action executor that relays to content script
    engine.setActionExecutor({
      execute: async (action) => {
        return await this._relayToContent(await this._getActiveTabId(), action, jobId, 0);
      },
    });

    // Set up progress listener
    engine.addProgressListener((progress) => {
      const job = this.jobs.get(jobId);
      if (job) {
        job.progress = {
          current: progress.current,
          total: progress.total,
          completed: progress.completed,
          failed: progress.failed,
        };
        this._saveJobState(job);
      }
    });

    this.engines.set(jobId, engine);

    // Create job record
    const job = {
      id: jobId,
      actions,
      options: { speed, retryCount, timeout },
      status: 'running',
      progress: {
        current: 0,
        total: actions.length,
        completed: 0,
        failed: 0,
      },
      startTime: now,
      endTime: null,
      errors: [],
      tabId: await this._getActiveTabId(),
    };

    this.jobs.set(jobId, job);
    await this._saveJobState(job);

    // Start execution
    try {
      const result = await engine.replay(actions, options);
      
      // Update job with result
      job.status = result.success ? 'complete' : 'error';
      job.endTime = Date.now();
      job.errors = result.errors;
      await this._saveJobState(job);
      
    } catch (error) {
      job.status = 'error';
      job.endTime = Date.now();
      job.errors.push({ error: error.message });
      await this._saveJobState(job);
    } finally {
      // Cleanup engine
      this.engines.delete(jobId);
      engine.cleanup();
    }

    return jobId;
  }

  /**
   * Stop playback job
   * @param {string} jobId - Job ID to stop
   * @returns {Promise<Object>} Stop result
   */
  async stop(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return { success: false, error: `Job not found: ${jobId}` };
    }

    if (job.status === 'complete' || job.status === 'error') {
      return { success: false, error: `Job already finished: ${jobId}` };
    }

    // Stop the engine
    const engine = this.engines.get(jobId);
    if (engine) {
      engine.stop();
    }

    job.status = 'stopped';
    job.endTime = Date.now();
    await this._saveJobState(job);

    // Send stop message to content script
    if (job.tabId) {
      try {
        await chrome.tabs.sendMessage(job.tabId, {
          type: PLAYBACK_MESSAGES.STOP,
          jobId,
        });
      } catch (error) {
        console.warn(`[PlaybackHandler] Failed to send stop to tab ${job.tabId}:`, error);
      }
    }

    return { success: true };
  }

  /**
   * Pause playback job
   * @param {string} jobId - Job ID to pause
   * @returns {Promise<Object>} Pause result
   */
  async pause(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return { success: false, error: `Job not found: ${jobId}` };
    }

    if (job.status !== 'running') {
      return { success: false, error: `Job not running: ${jobId}` };
    }

    // Pause the engine
    const engine = this.engines.get(jobId);
    if (engine) {
      engine.pause();
    }

    job.status = 'paused';
    await this._saveJobState(job);

    // Send pause message to content script
    if (job.tabId) {
      try {
        await chrome.tabs.sendMessage(job.tabId, {
          type: PLAYBACK_MESSAGES.PAUSE,
          jobId,
        });
      } catch (error) {
        console.warn(`[PlaybackHandler] Failed to send pause to tab ${job.tabId}:`, error);
      }
    }

    return { success: true };
  }

  /**
   * Resume playback job
   * @param {string} jobId - Job ID to resume
   * @returns {Promise<Object>} Resume result
   */
  async resume(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return { success: false, error: `Job not found: ${jobId}` };
    }

    if (job.status !== 'paused') {
      return { success: false, error: `Job not paused: ${jobId}` };
    }

    // Resume the engine
    const engine = this.engines.get(jobId);
    if (engine) {
      engine.resume();
    }

    job.status = 'running';
    await this._saveJobState(job);

    // Send resume message to content script
    if (job.tabId) {
      try {
        await chrome.tabs.sendMessage(job.tabId, {
          type: PLAYBACK_MESSAGES.RESUME,
          jobId,
        });
      } catch (error) {
        console.warn(`[PlaybackHandler] Failed to send resume to tab ${job.tabId}:`, error);
      }
    }

    return { success: true };
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID (optional, returns all if not provided)
   * @returns {Promise<Object>} Job status
   */
  async getStatus(jobId) {
    if (jobId) {
      const job = this.jobs.get(jobId);
      if (!job) {
        return { error: `Job not found: ${jobId}` };
      }
      return this._sanitizeJob(job);
    }

    // Return all jobs
    const allJobs = Array.from(this.jobs.values()).map(job => this._sanitizeJob(job));
    return { jobs: allJobs };
  }

  /**
   * Relay action to content script
   * @private
   */
  async _relayToContent(tabId, action, jobId, actionIndex) {
    if (!tabId) {
      return { success: false, error: 'No active tab' };
    }

    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: PLAYBACK_MESSAGES.EXECUTE,
        action,
        jobId,
        actionIndex,
      });

      return response || { success: false, error: 'No response from content script' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle action response from content script
   * @private
   */
  async _handleActionResponse(jobId, actionIndex, response) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    // Update job state based on response
    if (response.success) {
      job.progress.completed++;
    } else {
      job.progress.failed++;
      job.errors.push({
        action: job.actions[actionIndex],
        error: response.error,
        index: actionIndex,
      });
    }

    await this._saveJobState(job);
  }

  /**
   * Get active tab ID
   * @private
   */
  async _getActiveTabId() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0]?.id || null;
    } catch (error) {
      console.warn('[PlaybackHandler] Failed to get active tab:', error);
      return null;
    }
  }

  /**
   * Save job state to storage
   * @private
   */
  async _saveJobState(job) {
    try {
      const storage = await chrome.storage.local.get(this.storageKey);
      const state = storage[this.storageKey] || {};
      state[job.id] = job;
      await chrome.storage.local.set({ [this.storageKey]: state });
    } catch (error) {
      console.error('[PlaybackHandler] Failed to save job state:', error);
    }
  }

  /**
   * Load job states from storage
   * @private
   */
  async _loadJobStates() {
    try {
      const storage = await chrome.storage.local.get(this.storageKey);
      const state = storage[this.storageKey] || {};
      
      Object.entries(state).forEach(([jobId, job]) => {
        // Only load non-completed jobs
        if (!['complete', 'error', 'stopped'].includes(job.status)) {
          this.jobs.set(jobId, job);
        }
      });
    } catch (error) {
      console.error('[PlaybackHandler] Failed to load job states:', error);
    }
  }

  /**
   * Clean up old jobs (older than 24 hours)
   * @private
   */
  async _cleanupOldJobs() {
    try {
      const storage = await chrome.storage.local.get(this.storageKey);
      const state = storage[this.storageKey] || {};
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      
      Object.entries(state).forEach(([jobId, job]) => {
        if (job.endTime && (now - job.endTime) > dayMs) {
          delete state[jobId];
          this.jobs.delete(jobId);
        }
      });
      
      await chrome.storage.local.set({ [this.storageKey]: state });
    } catch (error) {
      console.error('[PlaybackHandler] Failed to cleanup old jobs:', error);
    }
  }

  /**
   * Sanitize job for external consumption
   * @private
   */
  _sanitizeJob(job) {
    return {
      id: job.id,
      status: job.status,
      progress: { ...job.progress },
      startTime: job.startTime,
      endTime: job.endTime,
      errorCount: job.errors.length,
      duration: job.endTime ? job.endTime - job.startTime : Date.now() - job.startTime,
    };
  }
}