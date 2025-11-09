/**
 * Gemini Live API Client - Production Ready
 * Handles WebSocket connection with security and error handling
 */

export class GeminiLiveClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.ws = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.responseHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  /**
   * ✅ Connect to Gemini Live API with secure API key handling
   */
  async connect() {
    return new Promise((resolve, reject) => {
      // ✅ SECURITY: Don't put API key in URL
      const wsUrl = 'wss://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-live:streamGenerateContent';
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        // Set connection timeout
        const timeout = setTimeout(() => {
          if (!this.isConnected) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);
        
        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('[GeminiLive] Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          
          // ✅ SECURITY: Send API key in setup message, not URL
          this.ws.send(JSON.stringify({
            setup: {
              api_key: this.apiKey,
              model: 'models/gemini-2.0-flash-live',
              generation_config: {
                response_modalities: ['AUDIO', 'TEXT'],
                speech_config: {
                  voice_config: {
                    prebuilt_voice_config: {
                      voice_name: 'en-US-Journey-D'
                    }
                  }
                }
              }
            }
          }));
          
          resolve();
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
          
          // ✅ Auto-reconnect with exponential backoff
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * ✅ Auto-reconnect with exponential backoff
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
        await this.connect();
        console.log('[GeminiLive] Reconnected successfully');
        this.emit('reconnected');
      } catch (error) {
        console.error('[GeminiLive] Reconnect failed:', error);
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * ✅ Send multimodal input with error handling
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
            data: audio
          }
        });
      }
      
      if (screenshot) {
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg', // ✅ JPEG for smaller size
            data: screenshot
          }
        });
      }
      
      const message = {
        client_content: {
          turns: [
            {
              role: 'user',
              parts
            }
          ],
          turn_complete: true
        }
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
    
    // Handle setup complete
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
}
