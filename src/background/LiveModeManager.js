/**
 * Live Mode Manager - Background Service
 * Orchestrates all Gemini Live components
 */

import { GeminiLiveClient } from '../ai/GeminiLiveClient.js';
import { ScreenCapture } from '../common/ScreenCapture.js';

export class LiveModeManager {
  constructor() {
    this.geminiClient = null;
    this.screenCapture = null;
    this.isActive = false;
    this.currentTab = null;
    this.bandwidthUsage = 0;
    this.lastBandwidthUpdate = Date.now();
  }

  /**
   * Start Live Mode
   */
  async start(apiKey, tabId) {
    if (this.isActive) {
      console.warn('[LiveModeManager] Already active');
      return;
    }

    try {
      console.log('[LiveModeManager] Starting...');
      this.currentTab = tabId;

      // Initialize Gemini Live client
      this.geminiClient = new GeminiLiveClient(apiKey);
      await this.geminiClient.connect();

      // Setup response handlers
      this.geminiClient.on('text', (text) => {
        this.handleTextResponse(text);
      });

      this.geminiClient.on('audio', (audioBase64) => {
        this.handleAudioResponse(audioBase64);
      });

      this.geminiClient.on('action', (action) => {
        this.handleActionResponse(action);
      });

      this.geminiClient.on('error', (error) => {
        this.handleError(error);
      });

      this.geminiClient.on('reconnected', () => {
        this.sendToTab({ type: 'live-status', status: 'listening', message: 'Reconnected' });
      });

      // Initialize screen capture
      this.screenCapture = new ScreenCapture();
      await this.screenCapture.start((screenshot) => {
        if (screenshot) {
          // Update bandwidth tracking
          this.trackBandwidth(screenshot.length);
          
          // Send screenshot to Gemini
          this.geminiClient.sendInput({ screenshot });
          
          // Send preview to tab
          this.sendToTab({
            type: 'live-screenshot',
            screenshot
          });
        }
      }, 3000); // Every 3 seconds

      this.isActive = true;
      console.log('[LiveModeManager] Started successfully');

      // Notify tab that Live Mode is ready
      this.sendToTab({
        type: 'live-status',
        status: 'listening',
        message: 'Live Mode active'
      });

    } catch (error) {
      console.error('[LiveModeManager] Failed to start:', error);
      this.stop();
      throw error;
    }
  }

  /**
   * Handle text response from Gemini
   */
  handleTextResponse(text) {
    console.log('[LiveModeManager] Text response:', text);
    
    this.sendToTab({
      type: 'live-response-text',
      text
    });
    
    this.sendToTab({
      type: 'live-status',
      status: 'speaking',
      message: 'AI is responding...'
    });
  }

  /**
   * Handle audio response from Gemini
   */
  handleAudioResponse(audioBase64) {
    console.log('[LiveModeManager] Audio response received');
    
    this.sendToTab({
      type: 'live-response-audio',
      audio: audioBase64
    });
  }

  /**
   * Handle action response from Gemini
   */
  handleActionResponse(action) {
    console.log('[LiveModeManager] Action response:', action);
    
    this.sendToTab({
      type: 'live-action',
      action
    });
  }

  /**
   * Handle error from Gemini
   */
  handleError(error) {
    console.error('[LiveModeManager] Error:', error);
    
    this.sendToTab({
      type: 'live-error',
      message: error.message || 'An error occurred'
    });
  }

  /**
   * Send user input to Gemini
   */
  async sendUserInput({ text, audio }) {
    if (!this.geminiClient || !this.isActive) {
      console.warn('[LiveModeManager] Not active, cannot send input');
      return;
    }

    try {
      // Track bandwidth if audio is sent
      if (audio) {
        this.trackBandwidth(audio.length);
      }
      
      await this.geminiClient.sendInput({ text, audio });
      
      this.sendToTab({
        type: 'live-status',
        status: 'thinking',
        message: 'AI is thinking...'
      });
    } catch (error) {
      console.error('[LiveModeManager] Error sending input:', error);
      this.handleError(error);
    }
  }

  /**
   * Track bandwidth usage
   */
  trackBandwidth(dataSize) {
    const now = Date.now();
    const elapsed = (now - this.lastBandwidthUpdate) / 1000; // seconds
    
    if (elapsed > 0) {
      this.bandwidthUsage = dataSize / elapsed; // bytes per second
      this.lastBandwidthUpdate = now;
      
      // Send bandwidth update to tab
      this.sendToTab({
        type: 'live-bandwidth',
        bytesPerSecond: this.bandwidthUsage
      });
    }
  }

  /**
   * Send message to current tab
   */
  sendToTab(message) {
    if (!this.currentTab) return;
    
    chrome.tabs.sendMessage(this.currentTab, message).catch(error => {
      console.error('[LiveModeManager] Error sending to tab:', error);
    });
  }

  /**
   * Toggle microphone
   */
  toggleMicrophone() {
    // This will be handled by VoiceInput in content script
    this.sendToTab({ type: 'live-toggle-mic' });
  }

  /**
   * Toggle screen capture
   */
  toggleScreenCapture() {
    if (!this.screenCapture) return;
    
    if (this.screenCapture.isCapturing) {
      this.screenCapture.stop();
      this.sendToTab({
        type: 'live-status',
        status: 'listening',
        message: 'Screen capture paused'
      });
    } else {
      this.screenCapture.start((screenshot) => {
        if (screenshot) {
          this.trackBandwidth(screenshot.length);
          this.geminiClient.sendInput({ screenshot });
          this.sendToTab({ type: 'live-screenshot', screenshot });
        }
      }, 3000);
      this.sendToTab({
        type: 'live-status',
        status: 'listening',
        message: 'Screen capture resumed'
      });
    }
  }

  /**
   * Stop Live Mode
   */
  stop() {
    console.log('[LiveModeManager] Stopping...');

    if (this.geminiClient) {
      this.geminiClient.disconnect();
      this.geminiClient = null;
    }

    if (this.screenCapture) {
      this.screenCapture.stop();
      this.screenCapture = null;
    }

    this.isActive = false;
    this.currentTab = null;
    this.bandwidthUsage = 0;

    console.log('[LiveModeManager] Stopped');
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      hasClient: !!this.geminiClient,
      hasScreenCapture: !!this.screenCapture,
      bandwidthUsage: this.bandwidthUsage
    };
  }
}

// Export singleton instance
export const liveModeManager = new LiveModeManager();
