/**
 * Gemini Live API service for real-time voice streaming
 */

import { API_CONFIG, VOICE_MESSAGE_TYPES, DEFAULT_SETTINGS } from '../common/constants.js';

export class GeminiLiveService {
  constructor() {
    this.session = null;
    this.isStreaming = false;
    this.currentModel = null;
    this.fallbackIndex = 0;
    this.onTranscription = null;
    this.onCommand = null;
    this.onError = null;
  }

  /**
   * Initialize Gemini Live session with fallback chain
   */
  async initialize(apiKey, settings = {}) {
    const config = { ...DEFAULT_SETTINGS.gemini, ...settings };
    
    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Determine model to use
    const modelToUse = config.model === 'auto' 
      ? API_CONFIG.GEMINI_LIVE_MODELS[0]
      : config.model;

    // Validate model is in fallback chain
    this.fallbackIndex = API_CONFIG.GEMINI_LIVE_MODELS.indexOf(modelToUse);
    if (this.fallbackIndex === -1) {
      this.fallbackIndex = 0;
    }

    return await this._connectWithFallback(apiKey, config);
  }

  /**
   * Connect with fallback chain
   */
  async _connectWithFallback(apiKey, config) {
    const models = API_CONFIG.GEMINI_LIVE_MODELS;
    for (let i = this.fallbackIndex; i < models.length; i++) {
      const modelToTry = models[i];
      try {
        this.currentModel = modelToTry;
        
        // Mock Gemini Live connection (replace with actual API)
        this.session = await this._createMockSession(modelToTry, apiKey, config);
        this.isStreaming = true;
        
        console.log('Connected to Gemini Live with model: ' + modelToTry);
        return { success: true, model: modelToTry };
      } catch (error) {
        console.warn('Failed to connect to ' + modelToTry + ':', error.message);
        if (i === models.length - 1) {
          throw new Error('All models failed to connect');
        }
      }
    }
  }

  /**
   * Create mock session (replace with actual Gemini Live API)
   */
  async _createMockSession(model, apiKey, config) {
    return {
      model,
      apiKey,
      config,
      audioStream: null,
      isConnected: true,
    };
  }

  /**
   * Stream audio data to Gemini Live
   */
  async streamAudio(audioData) {
    if (!this.isStreaming || !this.session) {
      throw new Error('Session not active');
    }

    try {
      // Mock audio processing (replace with actual API call)
      const response = await this._processAudioMock(audioData);
      
      if (response.transcription) {
        this._handleTranscription(response.transcription);
      }
      
      if (response.command) {
        this._handleCommand(response.command);
      }

      return response;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  /**
   * Mock audio processing (replace with actual Gemini Live API)
   */
  async _processAudioMock(audioData) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock response based on audio data patterns
    const mockResponses = [
      { transcription: 'click the button', command: { type: 'click', target: 'button' } },
      { transcription: 'scroll down', command: { type: 'scroll', direction: 'down' } },
      { transcription: 'type hello world', command: { type: 'input', text: 'hello world' } },
      { transcription: 'double click', command: { type: 'double_click' } },
      { transcription: 'right click', command: { type: 'right_click' } },
    ];

    // Simple mock based on audio data length
    const index = Math.abs(audioData.reduce((sum, byte) => sum + byte, 0)) % mockResponses.length;
    return mockResponses[index];
  }

  /**
   * Handle transcription response
   */
  _handleTranscription(transcription) {
    try {
      if (this.onTranscription) {
        this.onTranscription({
          type: VOICE_MESSAGE_TYPES.VOICE_TRANSCRIPTION,
          text: transcription,
          timestamp: Date.now(),
          model: this.currentModel,
        });
      }
    } catch (error) {
      console.error('Transcription handling error:', error);
    }
  }

  /**
   * Handle command response
   */
  _handleCommand(command) {
    if (this.onCommand) {
      this.onCommand({
        type: VOICE_MESSAGE_TYPES.VOICE_COMMAND,
        command,
        timestamp: Date.now(),
        model: this.currentModel,
      });
    }
  }

  /**
   * Handle errors
   */
  _handleError(error) {
    try {
      if (this.onError) {
        this.onError({
          type: VOICE_MESSAGE_TYPES.VOICE_ERROR,
          error: error.message,
          timestamp: Date.now(),
          model: this.currentModel,
        });
      }
    } catch (callbackError) {
      console.error('Error in error callback:', callbackError);
    }
  }

  /**
   * Stop streaming session
   */
  async stop() {
    if (this.session) {
      this.session.isConnected = false;
      this.session = null;
    }
    this.isStreaming = false;
    this.currentModel = null;
    this.fallbackIndex = 0;
  }

  /**
   * Get current session status
   */
  getStatus() {
    return {
      isStreaming: this.isStreaming,
      currentModel: this.currentModel,
      hasSession: !!this.session,
    };
  }

  /**
   * Test connection with current model
   */
  async testConnection(apiKey, model = null) {
    try {
      if (!apiKey) {
        return { success: false, error: 'API key is required' };
      }
      
      const testModel = model || API_CONFIG.GEMINI_LIVE_MODELS[0];
      // Mock connection test - simulate failure for invalid keys
      if (apiKey === 'invalid-key') {
        throw new Error('Connection failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, model: testModel };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return [...API_CONFIG.GEMINI_LIVE_MODELS];
  }

  /**
   * Parse voice command from transcription
   */
  parseCommand(transcription) {
    const text = transcription.toLowerCase().trim();
    
    // Double click (check before single click)
    if (text.includes('double click') || text.includes('двойной клик')) {
      return { type: 'double_click' };
    }
    
    // Right click (check before single click)
    if (text.includes('right click') || text.includes('правый клик')) {
      return { type: 'right_click' };
    }
    
    // Click commands
    if (text.includes('click') || text.includes('нажми')) {
      const target = this._extractTarget(text);
      return { type: 'click', target };
    }
    
    // Scroll commands
    if (text.includes('scroll') || text.includes('прокрути')) {
      const direction = text.includes('down') || text.includes('вниз') ? 'down' : 'up';
      return { type: 'scroll', direction };
    }
    
    // Input commands
    if (text.includes('type') || text.includes('введи') || text.includes('напиши')) {
      const inputText = this._extractInputText(text);
      return { type: 'input', text: inputText };
    }
    
    return null;
  }

  /**
   * Extract target from command text
   */
  _extractTarget(text) {
    const patterns = [
      /click\s+(?:the\s+)?(.+?)(?:\s+button|\s+link|\s+element|$)/i,
      /нажми\s+(?:на\s+)?(.+?)(?:\s+кнопку|\s+ссылку|\s+элемент|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'button'; // Default target
  }

  /**
   * Extract input text from command
   */
  _extractInputText(text) {
    const patterns = [
      /type\s+["']?(.+?)["']?$/i,
      /введи\s+["']?(.+?)["']?$/i,
      /напиши\s+["']?(.+?)["']?$/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return ''; // Default empty text
  }
}

// Singleton instance
export const geminiLiveService = new GeminiLiveService();