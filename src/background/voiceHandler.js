/**
 * Voice handler for background script - manages voice commands and Gemini Live integration
 */

import { geminiLiveService } from '../services/geminiLive.js';
import { storageService } from '../services/storageService.js';
import { VOICE_MESSAGE_TYPES, SETTINGS_MESSAGE_TYPES } from '../common/constants.js';

export class VoiceHandler {
  constructor() {
    this.isActive = false;
    this.currentSession = null;
    this.settings = null;
    this.transcriptionHistory = [];
    this.commandHistory = [];
    this.setupMessageHandlers();
    this.loadSettings();
  }

  /**
   * Setup message handlers for voice commands
   */
  setupMessageHandlers() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async response
      });
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case VOICE_MESSAGE_TYPES.VOICE_START:
          await this.handleVoiceStart(message, sender, sendResponse);
          break;
        
        case VOICE_MESSAGE_TYPES.VOICE_STOP:
          await this.handleVoiceStop(message, sender, sendResponse);
          break;
        
        case VOICE_MESSAGE_TYPES.VOICE_DATA:
          await this.handleVoiceData(message, sender, sendResponse);
          break;
        
        case SETTINGS_MESSAGE_TYPES.SETTINGS_UPDATE:
          await this.handleSettingsUpdate(message, sender, sendResponse);
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Voice handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle voice start request
   */
  async handleVoiceStart(message, sender, sendResponse) {
    try {
      if (this.isActive) {
        sendResponse({ success: false, error: 'Voice session already active' });
        return;
      }

      // Load current settings
      await this.loadSettings();
      
      // Initialize Gemini Live service
      const result = await geminiLiveService.initialize(
        this.settings.gemini.apiKey,
        this.settings.gemini,
      );

      if (!result.success) {
        sendResponse({ success: false, error: 'Failed to initialize Gemini Live' });
        return;
      }

      // Setup callbacks
      geminiLiveService.onTranscription = (data) => {
        this.handleTranscription(data, sender);
      };

      geminiLiveService.onCommand = (data) => {
        this.handleCommand(data, sender);
      };

      geminiLiveService.onError = (error) => {
        this.handleError(error, sender);
      };

      this.isActive = true;
      this.currentSession = {
        tabId: sender.tab?.id,
        frameId: sender.frameId,
        startTime: Date.now(),
      };

      sendResponse({ 
        success: true, 
        model: result.model,
        sessionId: this.currentSession.startTime,
      });

    } catch (error) {
      console.error('Voice start error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle voice stop request
   */
  async handleVoiceStop(message, sender, sendResponse) {
    try {
      if (!this.isActive) {
        sendResponse({ success: false, error: 'No active voice session' });
        return;
      }

      await geminiLiveService.stop();
      
      this.isActive = false;
      this.currentSession = null;

      sendResponse({ success: true });

    } catch (error) {
      console.error('Voice stop error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle voice audio data
   */
  async handleVoiceData(message, sender, sendResponse) {
    try {
      if (!this.isActive) {
        sendResponse({ success: false, error: 'No active voice session' });
        return;
      }

      const { audioData, format } = message;
      
      if (!audioData) {
        sendResponse({ success: false, error: 'No audio data provided' });
        return;
      }

      // Stream audio to Gemini Live
      const result = await geminiLiveService.streamAudio(audioData);
      
      sendResponse({ 
        success: true, 
        processed: true,
        timestamp: Date.now(),
      });

    } catch (error) {
      console.error('Voice data error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle transcription from Gemini Live
   */
  async handleTranscription(data, sender) {
    try {
      // Add to history
      this.transcriptionHistory.push({
        text: data.text,
        timestamp: data.timestamp,
        model: data.model,
      });

      // Keep history limited to last 50 entries
      if (this.transcriptionHistory.length > 50) {
        this.transcriptionHistory.shift();
      }

      // Send transcription back to popup
      this.sendMessageToPopup({
        type: VOICE_MESSAGE_TYPES.VOICE_TRANSCRIPTION,
        text: data.text,
        timestamp: data.timestamp,
        model: data.model,
      });

      // Parse command from transcription
      const command = geminiLiveService.parseCommand(data.text);
      if (command) {
        this.handleCommand({
          type: VOICE_MESSAGE_TYPES.VOICE_COMMAND,
          command,
          timestamp: Date.now(),
          model: data.model,
          transcription: data.text,
        }, sender);
      }

    } catch (error) {
      console.error('Transcription handling error:', error);
      this.handleError({
        type: VOICE_MESSAGE_TYPES.VOICE_ERROR,
        error: `Transcription error: ${error.message}`,
        timestamp: Date.now(),
      }, sender);
    }
  }

  /**
   * Handle command from Gemini Live
   */
  async handleCommand(data, sender) {
    try {
      // Add to history
      this.commandHistory.push({
        command: data.command,
        transcription: data.transcription,
        timestamp: data.timestamp,
        model: data.model,
      });

      // Keep history limited to last 20 entries
      if (this.commandHistory.length > 20) {
        this.commandHistory.shift();
      }

      // Send command to content script for execution
      if (this.currentSession?.tabId) {
        await this.sendToContentScript(this.currentSession.tabId, {
          type: 'EXECUTE_ACTION',
          action: data.command,
          source: 'voice',
          transcription: data.transcription,
          timestamp: data.timestamp,
        });
      }

      // Send command confirmation to popup
      this.sendMessageToPopup({
        type: VOICE_MESSAGE_TYPES.VOICE_COMMAND,
        command: data.command,
        transcription: data.transcription,
        timestamp: data.timestamp,
        executed: true,
      });

    } catch (error) {
      console.error('Command handling error:', error);
      this.handleError({
        type: VOICE_MESSAGE_TYPES.VOICE_ERROR,
        error: `Command execution error: ${error.message}`,
        timestamp: Date.now(),
      }, sender);
    }
  }

  /**
   * Handle errors from Gemini Live
   */
  async handleError(data, sender) {
    console.error('Voice error:', data);
    
    // Send error to popup
    this.sendMessageToPopup({
      type: VOICE_MESSAGE_TYPES.VOICE_ERROR,
      error: data.error,
      timestamp: data.timestamp,
      model: data.model,
    });

    // If it's a critical error, stop the session
    if (data.error.includes('connection') || data.error.includes('timeout')) {
      await this.handleVoiceStop({}, sender, () => {});
    }
  }

  /**
   * Handle settings update
   */
  async handleSettingsUpdate(message, sender, sendResponse) {
    try {
      await this.loadSettings();
      
      // If voice session is active, restart with new settings
      if (this.isActive) {
        await geminiLiveService.stop();
        
        const result = await geminiLiveService.initialize(
          this.settings.gemini.apiKey,
          this.settings.gemini,
        );

        if (!result.success) {
          sendResponse({ success: false, error: 'Failed to reinitialize voice session' });
          return;
        }
      }

      sendResponse({ success: true });

    } catch (error) {
      console.error('Settings update error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const storedSettings = await storageService.getSync('settings');
      this.settings = storedSettings || {
        gemini: {
          apiKey: '',
          model: 'auto',
          timeout: 120000,
          language: 'auto',
        },
        ui: {
          theme: 'dark',
          compactMode: false,
        },
        shortcuts: {
          toggleRecording: 'Ctrl+Shift+R',
          toggleVoice: 'Ctrl+Shift+V',
          playback: 'Ctrl+Shift+P',
        },
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = null;
    }
  }

  /**
   * Send message to popup
   */
  async sendMessageToPopup(message) {
    try {
      if (chrome.runtime) {
        // Send to all popup instances
        chrome.runtime.sendMessage(message).catch(() => {
          // Popup might be closed, ignore error
        });
      }
    } catch (error) {
      // Ignore errors when popup is closed
    }
  }

  /**
   * Send message to content script
   */
  async sendToContentScript(tabId, message) {
    try {
      if (chrome.tabs) {
        await chrome.tabs.sendMessage(tabId, message);
      }
    } catch (error) {
      console.error('Failed to send to content script:', error);
      throw error;
    }
  }

  /**
   * Get current session status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      currentSession: this.currentSession,
      transcriptionHistory: this.transcriptionHistory.slice(-10), // Last 10
      commandHistory: this.commandHistory.slice(-5), // Last 5
      settings: this.settings,
    };
  }

  /**
   * Get transcription history
   */
  getTranscriptionHistory(limit = 20) {
    return this.transcriptionHistory.slice(-limit);
  }

  /**
   * Get command history
   */
  getCommandHistory(limit = 10) {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.transcriptionHistory = [];
    this.commandHistory = [];
  }

  /**
   * Test voice functionality
   */
  async testVoice() {
    try {
      await this.loadSettings();
      
      if (!this.settings.gemini.apiKey) {
        return { success: false, error: 'API key not configured' };
      }

      const result = await geminiLiveService.testConnection(
        this.settings.gemini.apiKey,
        this.settings.gemini.model,
      );

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
export const voiceHandler = new VoiceHandler();