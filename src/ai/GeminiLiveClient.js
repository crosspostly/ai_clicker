/**
 * Gemini Live API Client - Production Ready + Enhanced
 * Handles WebSocket connection with security, multi-model fallback, and command parsing
 */

import { API_CONFIG } from '../common/constants.js';

export class GeminiLiveClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.ws = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.responseHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    // ✅ Multi-model support
    this.currentModel = API_CONFIG.GEMINI_LIVE_MODELS[0];
    this.fallbackIndex = 0;
  }

  /**
   * ✅ Connect with multi-model fallback
   */
  async connect(modelIndex = 0) {
    this.fallbackIndex = modelIndex;
    this.currentModel = API_CONFIG.GEMINI_LIVE_MODELS[this.fallbackIndex];
    
    return new Promise((resolve, reject) => {
      const wsUrl = 'wss://generativelanguage.googleapis.com/v1beta/models/' + this.currentModel + ':streamGenerateContent';
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
          if (!this.isConnected) {
            this.ws.close();
            // ✅ Try next model in fallback chain
            if (this.fallbackIndex < API_CONFIG.GEMINI_LIVE_MODELS.length - 1) {
              console.log('[GeminiLive] Trying fallback model...');
              this.connect(this.fallbackIndex + 1)
                .then(resolve)
                .catch(reject);
            } else {
              reject(new Error('All models failed to connect'));
            }
          }
        }, 10000);
        
        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('[GeminiLive] Connected to', this.currentModel);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          
          // Send setup with API key
          this.ws.send(JSON.stringify({
            setup: {
              api_key: this.apiKey,
              model: 'models/' + this.currentModel,
              generation_config: {
                response_modalities: ['AUDIO', 'TEXT'],
                speech_config: {
                  voice_config: {
                    prebuilt_voice_config: {
                      voice_name: 'en-US-Journey-D',
                    },
                  },
                },
              },
            },
          }));
          
          resolve({ model: this.currentModel });
        };
        
        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('[GeminiLive] WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('[GeminiLive] Error parsing message:', error);
          }
        };
        
        this.ws.onclose = () => {
          console.log('[GeminiLive] Disconnected');
          this.isConnected = false;
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Auto-reconnect with exponential backoff
   */
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[GeminiLive] Max reconnect attempts reached');
      this.emit('error', { message: 'Failed to reconnect after multiple attempts' });
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[GeminiLive] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect(this.fallbackIndex);
        console.log('[GeminiLive] Reconnected successfully');
        this.emit('reconnected');
      } catch (error) {
        console.error('[GeminiLive] Reconnect failed:', error);
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Send multimodal input with error handling
   */
  async sendInput({ text, audio, screenshot }) {
    if (!this.isConnected) {
      console.warn('[GeminiLive] Not connected, queueing message');
      this.messageQueue.push({ text, audio, screenshot });
      return;
    }
    
    try {
      const parts = [];
      
      if (text) {
        parts.push({ text });
      }
      
      if (audio) {
        parts.push({
          inline_data: {
            mime_type: 'audio/pcm',
            data: audio,
          },
        });
      }
      
      if (screenshot) {
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: screenshot,
          },
        });
      }
      
      const message = {
        client_content: {
          turns: [
            {
              role: 'user',
              parts,
            },
          ],
          turn_complete: true,
        },
      };
      
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[GeminiLive] Error sending input:', error);
      this.emit('error', { message: 'Failed to send input', error });
    }
  }

  /**
   * Handle incoming messages from Gemini
   */
  handleMessage(message) {
    if (message.serverContent) {
      const { modelTurn } = message.serverContent;
      
      if (modelTurn) {
        // Extract text response
        const textPart = modelTurn.parts.find(p => p.text);
        if (textPart) {
          this.emit('text', textPart.text);
          
          // ✅ Try to parse as command
          const command = this.parseCommand(textPart.text);
          if (command) {
            this.emit('command', command);
          }
        }
        
        // Extract audio response
        const audioPart = modelTurn.parts.find(p => p.inlineData?.mimeType === 'audio/pcm');
        if (audioPart) {
          this.emit('audio', audioPart.inlineData.data);
        }
        
        // Extract tool calls (actions)
        const toolCallPart = modelTurn.parts.find(p => p.functionCall);
        if (toolCallPart) {
          this.emit('action', toolCallPart.functionCall);
        }
      }
    }
    
    if (message.setupComplete) {
      console.log('[GeminiLive] Setup complete');
      this.emit('ready');
      
      // Send queued messages
      while (this.messageQueue.length > 0) {
        const queued = this.messageQueue.shift();
        this.sendInput(queued);
      }
    }
  }

  /**
   * ✅ Parse command from text (fallback for when Gemini doesn't use function calling)
   */
  parseCommand(text) {
    const normalized = text.toLowerCase().trim();
    
    // Double click (check before single click)
    if (normalized.includes('double click') || normalized.includes('двойной клик')) {
      return { type: 'double_click', target: this._extractTarget(text) };
    }
    
    // Right click (check before single click)
    if (normalized.includes('right click') || normalized.includes('правый клик')) {
      return { type: 'right_click', target: this._extractTarget(text) };
    }
    
    // Click
    if (normalized.includes('click') || normalized.includes('нажми') || normalized.includes('клик')) {
      return { type: 'click', target: this._extractTarget(text) };
    }
    
    // Scroll
    if (normalized.includes('scroll') || normalized.includes('прокрути')) {
      const direction = (normalized.includes('down') || normalized.includes('вниз')) ? 'down' : 'up';
      return { type: 'scroll', direction };
    }
    
    // Input/Type
    if (normalized.includes('type') || normalized.includes('введи') || normalized.includes('напиши')) {
      return { type: 'input', value: this._extractInputText(text) };
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
      /клик\s+(?:по\s+)?(.+?)(?:\s+кнопке|\s+ссылке|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'button';
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
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  /**
   * ✅ Get available models
   */
  getAvailableModels() {
    return [...API_CONFIG.GEMINI_LIVE_MODELS];
  }

  /**
   * ✅ Get current model
   */
  getCurrentModel() {
    return this.currentModel;
  }

  /**
   * Simple event emitter
   */
  on(event, handler) {
    if (!this.responseHandlers.has(event)) {
      this.responseHandlers.set(event, []);
    }
    this.responseHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.responseHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  /**
   * Disconnect from Gemini Live
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      currentModel: this.currentModel,
      fallbackIndex: this.fallbackIndex,
      queuedMessages: this.messageQueue.length,
    };
  }
}
