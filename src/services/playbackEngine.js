/**
 * Playback Engine - Core deterministic replay system
 * Executes sequences of actions with timing control and retry logic
 */

import { PLAYBACK_SPEEDS, PLAYBACK_RETRY, PLAYBACK_TIMEOUT } from '../common/constants.js';

export class PlaybackEngine {
  constructor() {
    this.actions = [];
    this.currentIndex = 0;
    this.status = 'idle'; // idle, running, paused, complete, error
    this.speed = 1;
    this.startTime = null;
    this.pauseTime = null;
    this.totalPausedTime = 0;
    this.abortController = null;
    this.progressListeners = new Set();
    this.completedCount = 0;
    this.failedCount = 0;
    this.errors = [];
  }

  /**
   * Execute sequence of actions with timing
   * @param {Array} actions - Array of actions to execute
   * @param {Object} options - Playback options
   * @returns {Promise<Object>} Result object
   */
  async replay(actions, options = {}) {
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error('Actions must be a non-empty array');
    }

    // Reset state
    this.actions = actions;
    this.currentIndex = 0;
    this.status = 'running';
    this.startTime = Date.now();
    this.pauseTime = null;
    this.totalPausedTime = 0;
    this.completedCount = 0;
    this.failedCount = 0;
    this.errors = [];
    this.abortController = new AbortController();

    // Set options
    this.speed = options.speed || 1;
    const pauseAtEach = options.pauseAtEach || false;
    const retryCount = options.retryCount || PLAYBACK_RETRY.MAX_ATTEMPTS;
    const timeout = options.timeout || PLAYBACK_TIMEOUT.DEFAULT_MS;

    // Validate speed
    if (!PLAYBACK_SPEEDS.includes(this.speed)) {
      throw new Error(`Invalid speed: ${this.speed}. Must be one of ${PLAYBACK_SPEEDS.join(', ')}`);
    }

    // Validate timeout
    if (timeout < PLAYBACK_TIMEOUT.MIN_MS || timeout > PLAYBACK_TIMEOUT.MAX_MS) {
      throw new Error(`Timeout must be between ${PLAYBACK_TIMEOUT.MIN_MS} and ${PLAYBACK_TIMEOUT.MAX_MS}ms`);
    }

    try {
      // Set overall timeout
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Playback timeout after ${timeout}ms`));
        }, timeout);
        
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
        });
      });

      // Execute all actions
      const executionPromise = this._executeActions(pauseAtEach, retryCount);

      // Race between execution and timeout
      await Promise.race([executionPromise, timeoutPromise]);

      this.status = 'complete';
      return {
        success: this.failedCount === 0,
        completed: this.completedCount,
        failed: this.failedCount,
        total: actions.length,
        errors: [...this.errors],
        duration: Date.now() - this.startTime - this.totalPausedTime,
      };

    } catch (error) {
      this.status = 'error';
      this.errors.push({
        action: this.actions[this.currentIndex],
        error: error.message,
        index: this.currentIndex,
      });
      
      return {
        success: false,
        completed: this.completedCount,
        failed: this.failedCount + 1,
        total: actions.length,
        errors: [...this.errors],
        duration: Date.now() - this.startTime - this.totalPausedTime,
      };
    } finally {
      this._notifyProgress();
    }
  }

  /**
   * Execute all actions with timing and retry logic
   * @private
   */
  async _executeActions(pauseAtEach, retryCount) {
    for (let i = 0; i < this.actions.length; i++) {
      if (this.abortController.signal.aborted) {
        throw new Error('Playback aborted');
      }

      this.currentIndex = i;
      const action = this.actions[i];

      // Wait if paused
      while (this.status === 'paused' && !this.abortController.signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (this.abortController.signal.aborted) {
        throw new Error('Playback aborted');
      }

      // Execute action with retry logic
      const success = await this._executeActionWithRetry(action, retryCount);
      
      if (success) {
        this.completedCount++;
      } else {
        this.failedCount++;
      }

      this._notifyProgress();

      // Pause between actions if specified
      if (pauseAtEach && i < this.actions.length - 1) {
        await new Promise(resolve => {
          const checkPause = () => {
            if (this.status === 'paused') {
              setTimeout(checkPause, 100);
            } else {
              resolve();
            }
          };
          checkPause();
        });
      }

      // Apply delay between actions (timing calculation)
      if (action.delay && action.delay > 0 && i < this.actions.length - 1) {
        const adjustedDelay = action.delay * (1 / this.speed);
        await this._delayWithPause(adjustedDelay);
      }
    }
  }

  /**
   * Execute single action with retry logic
   * @private
   */
  async _executeActionWithRetry(action, maxRetries) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if aborted
        if (this.abortController.signal.aborted) {
          throw new Error('Playback aborted');
        }

        // Execute action (this would be implemented by the renderer)
        const result = await this._executeAction(action);
        
        if (result.success) {
          return true;
        } else {
          lastError = result.error;
        }
      } catch (error) {
        lastError = error.message;
      }

      // Wait before retry (with backoff)
      if (attempt < maxRetries) {
        const delay = PLAYBACK_RETRY.DELAY_MS * Math.pow(PLAYBACK_RETRY.BACKOFF_MULTIPLIER, attempt);
        await this._delayWithPause(delay);
      }
    }

    // All retries failed
    this.errors.push({
      action,
      error: lastError,
      index: this.currentIndex,
      attempts: maxRetries + 1,
    });

    return false;
  }

  /**
   * Execute single action (to be implemented by renderer)
   * @private
   */
  async _executeAction(action) {
    // This will be injected by the PlaybackHandler
    if (this.actionExecutor) {
      return await this.actionExecutor.execute(action);
    }
    throw new Error('Action executor not set');
  }

  /**
   * Set action executor (renderer instance)
   * @param {Object} executor - Action executor instance
   */
  setActionExecutor(executor) {
    this.actionExecutor = executor;
  }

  /**
   * Delay with pause support
   * @private
   */
  async _delayWithPause(ms) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < ms) {
      if (this.abortController.signal.aborted) {
        throw new Error('Playback aborted');
      }

      if (this.status === 'paused') {
        this.pauseTime = Date.now();
        await new Promise(resolve => {
          const checkResume = () => {
            if (this.status === 'paused' && !this.abortController.signal.aborted) {
              setTimeout(checkResume, 100);
            } else {
              resolve();
            }
          };
          checkResume();
        });
        
        if (this.pauseTime) {
          this.totalPausedTime += Date.now() - this.pauseTime;
          this.pauseTime = null;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Set playback speed
   * @param {number} speed - Playback speed
   */
  setSpeed(speed) {
    if (!PLAYBACK_SPEEDS.includes(speed)) {
      throw new Error(`Invalid speed: ${speed}. Must be one of ${PLAYBACK_SPEEDS.join(', ')}`);
    }
    this.speed = speed;
  }

  /**
   * Pause execution
   */
  pause() {
    if (this.status === 'running') {
      this.status = 'paused';
      this.pauseTime = Date.now();
      this._notifyProgress();
    }
  }

  /**
   * Resume execution
   */
  resume() {
    if (this.status === 'paused') {
      if (this.pauseTime) {
        this.totalPausedTime += Date.now() - this.pauseTime;
        this.pauseTime = null;
      }
      this.status = 'running';
      this._notifyProgress();
    }
  }

  /**
   * Cancel execution and cleanup
   */
  stop() {
    if (this.abortController) {
      this.abortController.abort();
    }
    
    if (this.status === 'paused' && this.pauseTime) {
      this.totalPausedTime += Date.now() - this.pauseTime;
      this.pauseTime = null;
    }
    
    this.status = 'idle';
    this._notifyProgress();
  }

  /**
   * Get current progress
   * @returns {Object} Progress information
   */
  getProgress() {
    return {
      current: this.currentIndex,
      total: this.actions.length,
      status: this.status,
      speed: this.speed,
      completed: this.completedCount,
      failed: this.failedCount,
      duration: this.startTime ? Date.now() - this.startTime - this.totalPausedTime : 0,
      errors: [...this.errors],
    };
  }

  /**
   * Add progress listener
   * @param {Function} listener - Progress listener function
   */
  addProgressListener(listener) {
    this.progressListeners.add(listener);
  }

  /**
   * Remove progress listener
   * @param {Function} listener - Progress listener function
   */
  removeProgressListener(listener) {
    this.progressListeners.delete(listener);
  }

  /**
   * Notify all progress listeners
   * @private
   */
  _notifyProgress() {
    const progress = this.getProgress();
    this.progressListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('Progress listener error:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stop();
    this.progressListeners.clear();
    this.actions = [];
    this.errors = [];
  }
}