/**
 * Live Mode Overlay - Production Ready
 * Shows AI assistant sidebar with recording indicator
 */

export class LiveModeOverlay {
  constructor() {
    this.overlay = null;
    this.recordingIndicator = null;
    this.isVisible = false;
    this.handlers = new Map();
  }

  /**
   * Show the overlay with recording indicator
   */
  show() {
    if (this.isVisible) return;
    
    // ✅ Create recording indicator (privacy notice)
    this.createRecordingIndicator();
    
    // Create main overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'ai-clicker-live-overlay';
    this.overlay.innerHTML = `
      <div class="live-header">
        <h2>🎤️ AI Assistant Live</h2>
        <button id="live-close-btn" title="Stop Live Mode">✕</button>
      </div>
      
      <div class="live-status">
        <div id="live-status-indicator" class="status-listening"></div>
        <span id="live-status-text">Listening...</span>
      </div>
      
      <div class="live-transcript">
        <h3>You said:</h3>
        <p id="live-user-transcript" class="transcript-text"></p>
      </div>
      
      <div class="live-response">
        <h3>AI Assistant:</h3>
        <p id="live-ai-response" class="response-text"></p>
      </div>
      
      <div class="live-actions">
        <h3>Recent Actions:</h3>
        <ul id="live-action-list"></ul>
      </div>
      
      <div class="live-preview">
        <h3>Screen Preview:</h3>
        <canvas id="live-screen-canvas"></canvas>
        <div id="live-bandwidth" class="bandwidth-info">Bandwidth: 0 KB/s</div>
      </div>
      
      <div class="live-controls">
        <button id="live-toggle-mic" class="control-btn">🎤 Mute</button>
        <button id="live-toggle-screen" class="control-btn">📸 Pause</button>
        <button id="live-stop-all" class="control-btn stop-btn">⏹️ Stop All</button>
      </div>
    `;
    
    // Add styles
    this.addStyles();
    
    // Append to body
    document.body.appendChild(this.overlay);
    
    // Setup event listeners
    this.setupListeners();
    
    this.isVisible = true;
    console.log('[LiveMode] Overlay shown');
  }

  /**
   * ✅ Create recording indicator (privacy notice)
   */
  createRecordingIndicator() {
    this.recordingIndicator = document.createElement('div');
    this.recordingIndicator.id = 'ai-live-recording-badge';
    this.recordingIndicator.innerHTML = '🔴 RECORDING';
    
    document.body.appendChild(this.recordingIndicator);
  }

  /**
   * Add overlay styles
   */
  addStyles() {
    if (document.getElementById('ai-clicker-live-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'ai-clicker-live-styles';
    style.textContent = `
      /* Recording Indicator */
      #ai-live-recording-badge {
        position: fixed;
        top: 20px;
        right: 420px;
        background: #ef4444;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-weight: bold;
        font-size: 14px;
        z-index: 999998;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      
      /* Main Overlay */
      #ai-clicker-live-overlay {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: white;
        padding: 20px;
      }
      
      .live-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid rgba(255, 255, 255, 0.3);
        padding-bottom: 10px;
      }
      
      .live-header h2 {
        margin: 0;
        font-size: 20px;
      }
      
      #live-close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      #live-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .live-status {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
      }
      
      #live-status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      .status-listening { background: #4ade80; }
      .status-thinking { background: #fbbf24; }
      .status-speaking { background: #3b82f6; }
      
      .live-transcript,
      .live-response,
      .live-actions,
      .live-preview {
        margin-bottom: 20px;
        background: rgba(0, 0, 0, 0.2);
        padding: 15px;
        border-radius: 8px;
      }
      
      h3 {
        margin: 0 0 10px 0;
        font-size: 14px;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .transcript-text,
      .response-text {
        margin: 0;
        line-height: 1.6;
        font-size: 14px;
        min-height: 40px;
      }
      
      #live-action-list {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 150px;
        overflow-y: auto;
      }
      
      #live-action-list li {
        padding: 8px;
        margin-bottom: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        font-size: 13px;
        font-family: monospace;
      }
      
      #live-screen-canvas {
        width: 100%;
        border-radius: 8px;
        opacity: 0.7;
        margin-bottom: 10px;
      }
      
      .bandwidth-info {
        font-size: 12px;
        opacity: 0.7;
        text-align: right;
      }
      
      .live-controls {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .control-btn {
        flex: 1;
        padding: 12px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        min-width: 100px;
      }
      
      .control-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }
      
      .stop-btn {
        background: rgba(239, 68, 68, 0.8);
        flex-basis: 100%;
      }
      
      .stop-btn:hover {
        background: rgba(239, 68, 68, 1);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    document.getElementById('live-close-btn').addEventListener('click', () => {
      this.hide();
    });
    
    document.getElementById('live-stop-all').addEventListener('click', () => {
      this.emit('stopAll');
    });
    
    document.getElementById('live-toggle-mic').addEventListener('click', (e) => {
      this.emit('toggleMic');
      e.target.textContent = e.target.textContent.includes('Mute') ? '🎤 Unmute' : '🎤 Mute';
    });
    
    document.getElementById('live-toggle-screen').addEventListener('click', (e) => {
      this.emit('toggleScreen');
      e.target.textContent = e.target.textContent.includes('Pause') ? '📸 Resume' : '📸 Pause';
    });
  }

  /**
   * Update user transcript
   */
  updateUserTranscript(text) {
    const element = document.getElementById('live-user-transcript');
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Update AI response
   */
  updateAIResponse(text) {
    const element = document.getElementById('live-ai-response');
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Add action to list
   */
  addAction(action) {
    const list = document.getElementById('live-action-list');
    if (!list) return;
    
    const li = document.createElement('li');
    li.textContent = `${action.type}: ${action.selector || action.description || ''}`;
    list.insertBefore(li, list.firstChild);
    
    // Keep only last 10 actions
    while (list.children.length > 10) {
      list.removeChild(list.lastChild);
    }
  }

  /**
   * Update status
   */
  updateStatus(status, text) {
    const indicator = document.getElementById('live-status-indicator');
    const statusText = document.getElementById('live-status-text');
    
    if (indicator) {
      indicator.className = `status-${status}`;
    }
    
    if (statusText) {
      statusText.textContent = text;
    }
  }

  /**
   * Update screen preview
   */
  updateScreenPreview(screenshotBase64) {
    const canvas = document.getElementById('live-screen-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      canvas.width = 360;  // Smaller preview
      canvas.height = 200;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = `data:image/jpeg;base64,${screenshotBase64}`;
  }

  /**
   * ✅ Update bandwidth display
   */
  updateBandwidth(bytesPerSecond) {
    const element = document.getElementById('live-bandwidth');
    if (element) {
      const kb = (bytesPerSecond / 1024).toFixed(1);
      element.textContent = `Bandwidth: ${kb} KB/s`;
    }
  }

  /**
   * Simple event emitter
   */
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  /**
   * Hide the overlay
   */
  hide() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    if (this.recordingIndicator) {
      this.recordingIndicator.remove();
      this.recordingIndicator = null;
    }
    
    this.isVisible = false;
    this.emit('close');
    console.log('[LiveMode] Overlay hidden');
  }
}
