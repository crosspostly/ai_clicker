/**
 * Voice-Playback Integration Service
 * Bridges voice commands to playback engine execution
 */

import { PLAYBACK_MESSAGES } from '../common/constants.js';

export class VoicePlaybackIntegration {
  constructor(playbackHandler) {
    this.playbackHandler = playbackHandler;
    this.activeVoiceJobs = new Map(); // voiceSessionId -> jobId
    this.commandQueue = [];
    this.isProcessing = false;
  }

  /**
   * Convert voice command to playback action
   * @param {Object} voiceCommand - Voice command from Gemini Live
   * @returns {Object} Playback action
   */
  voiceCommandToAction(voiceCommand) {
    const { command } = voiceCommand;
    
    switch (command.type) {
      case 'click':
        return {
          type: 'click',
          selector: this._generateSelector(command.target),
          delay: 500,
          description: `Click ${command.target || 'element'}`
        };
        
      case 'double_click':
        return {
          type: 'double_click',
          selector: this._generateSelector(command.target),
          delay: 500,
          description: `Double click ${command.target || 'element'}`
        };
        
      case 'right_click':
        return {
          type: 'right_click',
          selector: this._generateSelector(command.target),
          delay: 500,
          description: `Right click ${command.target || 'element'}`
        };
        
      case 'input':
        return {
          type: 'input',
          selector: this._generateSelector(command.target),
          text: command.text || '',
          delay: 300,
          description: `Type "${command.text}" into ${command.target || 'field'}`
        };
        
      case 'scroll':
        return {
          type: 'scroll',
          direction: command.direction || 'down',
          amount: command.amount || 300,
          delay: 300,
          description: `Scroll ${command.direction || 'down'}`
        };
        
      case 'wait':
        return {
          type: 'wait',
          duration: command.duration || 1000,
          description: `Wait ${command.duration || 1000}ms`
        };
        
      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }
  }

  /**
   * Execute voice command through playback engine
   * @param {Object} voiceCommand - Voice command from Gemini Live
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeVoiceCommand(voiceCommand, options = {}) {
    try {
      // Convert voice command to action
      const action = this.voiceCommandToAction(voiceCommand);
      
      // Add to command queue if sequential execution is enabled
      if (options.sequential !== false) {
        this.commandQueue.push({ action, voiceCommand, options });
        
        if (!this.isProcessing) {
          return await this._processCommandQueue();
        }
        return { success: true, queued: true, action };
      }
      
      // Execute immediately
      return await this._executeAction(action, voiceCommand, options);
      
    } catch (error) {
      console.error('Voice command execution failed:', error);
      return {
        success: false,
        error: error.message,
        voiceCommand
      };
    }
  }

  /**
   * Process command queue sequentially
   * @private
   */
  async _processCommandQueue() {
    if (this.isProcessing || this.commandQueue.length === 0) {
      return { success: true, message: 'No commands to process' };
    }

    this.isProcessing = true;
    const results = [];

    try {
      while (this.commandQueue.length > 0) {
        const { action, voiceCommand, options } = this.commandQueue.shift();
        const result = await this._executeAction(action, voiceCommand, options);
        results.push(result);
        
        // Stop processing if a command fails and options.stopOnError is true
        if (!result.success && options.stopOnError !== false) {
          break;
        }
        
        // Add delay between commands
        if (this.commandQueue.length > 0 && options.commandDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, options.commandDelay));
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return {
      success: true,
      results,
      processed: results.length
    };
  }

  /**
   * Execute single action through playback handler
   * @private
   */
  async _executeAction(action, voiceCommand, options) {
    try {
      // Start playback with single action
      const jobId = await this.playbackHandler.start([action], {
        speed: options.speed || 1,
        retryCount: options.retryCount || 2,
        voiceSessionId: options.voiceSessionId
      });

      // Store mapping for cleanup
      if (options.voiceSessionId) {
        this.activeVoiceJobs.set(options.voiceSessionId, jobId);
      }

      // Wait for completion
      const result = await this._waitForCompletion(jobId, options.timeout || 10000);
      
      return {
        success: result.success,
        action,
        voiceCommand,
        jobId,
        executionTime: result.executionTime,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        action,
        voiceCommand,
        error: error.message
      };
    }
  }

  /**
   * Wait for playback job completion
   * @private
   */
  async _waitForCompletion(jobId, timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeoutId = setTimeout(() => {
        reject(new Error(`Playback timeout for job ${jobId}`));
      }, timeout);

      const checkStatus = async () => {
        try {
          const status = await this.playbackHandler.getStatus(jobId);
          
          if (status.status === 'complete' || status.status === 'error') {
            clearTimeout(timeoutId);
            resolve({
              success: status.status === 'complete',
              executionTime: Date.now() - startTime,
              error: status.error
            });
          } else {
            // Check again in 100ms
            setTimeout(checkStatus, 100);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      };

      checkStatus();
    });
  }

  /**
   * Stop all active voice jobs
   * @param {string} voiceSessionId - Optional session ID to stop specific jobs
   */
  async stopVoiceJobs(voiceSessionId = null) {
    const jobsToStop = voiceSessionId 
      ? [this.activeVoiceJobs.get(voiceSessionId)].filter(Boolean)
      : Array.from(this.activeVoiceJobs.values());

    const results = [];
    
    for (const jobId of jobsToStop) {
      try {
        const result = await this.playbackHandler.stop(jobId);
        results.push({ jobId, success: result.success });
        
        // Clean up mapping
        for (const [sessionId, mappedJobId] of this.activeVoiceJobs.entries()) {
          if (mappedJobId === jobId) {
            this.activeVoiceJobs.delete(sessionId);
          }
        }
      } catch (error) {
        results.push({ jobId, success: false, error: error.message });
      }
    }

    // Clear command queue
    this.commandQueue = [];
    this.isProcessing = false;

    return { success: true, stopped: results };
  }

  /**
   * Get status of voice jobs
   * @param {string} voiceSessionId - Optional session ID
   */
  getVoiceJobStatus(voiceSessionId = null) {
    if (voiceSessionId) {
      const jobId = this.activeVoiceJobs.get(voiceSessionId);
      return jobId ? this.playbackHandler.getStatus(jobId) : null;
    }

    // Return status of all voice jobs
    const statuses = {};
    for (const [sessionId, jobId] of this.activeVoiceJobs.entries()) {
      try {
        statuses[sessionId] = this.playbackHandler.getStatus(jobId);
      } catch (error) {
        statuses[sessionId] = { error: error.message };
      }
    }
    
    return statuses;
  }

  /**
   * Generate CSS selector from target description
   * @private
   */
  _generateSelector(target) {
    if (!target) {
      return 'body'; // Default fallback
    }

    // Simple selector generation - can be enhanced
    if (target.includes('#')) {
      return target;
    }
    
    if (target.includes('.')) {
      return target;
    }
    
    // Try to find by text content
    if (target.match(/^[a-zA-Z\s]+$/)) {
      return `*:contains("${target.trim()}")`;
    }
    
    // Default to tag name
    return target.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Clear command queue and reset state
   */
  reset() {
    this.commandQueue = [];
    this.isProcessing = false;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.commandQueue.length,
      isProcessing: this.isProcessing,
      activeJobs: this.activeVoiceJobs.size
    };
  }
}