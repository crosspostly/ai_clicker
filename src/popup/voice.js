/**
 * Voice control functionality with Web Audio API and Gemini Live integration
 */

import { VOICE_MESSAGE_TYPES, SETTINGS_MESSAGE_TYPES } from '../common/constants.js';

class VoiceController {
  constructor() {
    this.isRecording = false;
    this.isProcessing = false;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioChunks = [];
    this.settings = null;
    this.currentModel = null;
    this.sessionId = null;

    this.initializeElements();
    this.setupEventListeners();
    this.loadSettings();
    this.setupMessageListeners();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.voiceButton = document.getElementById('voiceButton');
    this.voiceStatus = document.getElementById('voiceStatus');
    this.transcriptionText = document.getElementById('transcriptionText');
    this.commandsList = document.getElementById('commandsList');
    this.errorMessage = document.getElementById('errorMessage');
    this.modelIndicator = document.getElementById('modelIndicator');
    this.currentModelSpan = document.getElementById('currentModel');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.voiceButton.addEventListener('click', () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        if (this.isRecording) {
          this.stopRecording();
        } else {
          this.startRecording();
        }
      }
    });
  }

  /**
   * Setup message listeners for background communication
   */
  setupMessageListeners() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleBackgroundMessage(message, sender, sendResponse);
      });
    }
  }

  /**
   * Handle messages from background script
   */
  handleBackgroundMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case VOICE_MESSAGE_TYPES.VOICE_TRANSCRIPTION:
          this.handleTranscription(message);
          break;
        
        case VOICE_MESSAGE_TYPES.VOICE_COMMAND:
          this.handleCommand(message);
          break;
        
        case VOICE_MESSAGE_TYPES.VOICE_ERROR:
          this.handleError(message);
          break;
        
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling background message:', error);
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get('settings');
        this.settings = result.settings || {
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
        };

        // Apply theme
        this.applyTheme(this.settings.ui.theme);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = null;
    }
  }

  /**
   * Apply theme to the page
   */
  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }

  /**
   * Start voice recording
   */
  async startRecording() {
    try {
      // Check settings
      if (!this.settings || !this.settings.gemini.apiKey) {
        this.showError('Требуется настройка API ключа Gemini в настройках');
        return;
      }

      // Request microphone permission
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      // Setup recording events
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processAudioData();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.audioChunks = [];

      // Update UI
      this.updateRecordingUI(true);

      // Start voice session in background
      await this.startVoiceSession();

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.showError('Не удалось получить доступ к микрофону');
      this.stopRecording();
    }
  }

  /**
   * Stop voice recording
   */
  async stopRecording() {
    try {
      this.isRecording = false;
      this.isProcessing = true;

      // Stop media recorder
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      // Stop audio stream
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = null;
      }

      // Close audio context
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      // Update UI
      this.updateRecordingUI(false);

      // Stop voice session
      await this.stopVoiceSession();

    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.showError('Ошибка при остановке записи');
    }
  }

  /**
   * Start voice session in background
   */
  async startVoiceSession() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: VOICE_MESSAGE_TYPES.VOICE_START,
        settings: this.settings.gemini,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to start voice session');
      }

      this.sessionId = response.sessionId;
      this.currentModel = response.model;
      
      // Update model indicator
      this.currentModelSpan.textContent = this.currentModel;
      this.modelIndicator.style.display = 'block';

    } catch (error) {
      console.error('Failed to start voice session:', error);
      this.showError('Не удалось запустить голосовую сессию');
      throw error;
    }
  }

  /**
   * Stop voice session in background
   */
  async stopVoiceSession() {
    try {
      await chrome.runtime.sendMessage({
        type: VOICE_MESSAGE_TYPES.VOICE_STOP,
        sessionId: this.sessionId,
      });

      this.sessionId = null;
      this.currentModel = null;
      this.modelIndicator.style.display = 'none';

    } catch (error) {
      console.error('Failed to stop voice session:', error);
    }
  }

  /**
   * Process recorded audio data
   */
  async processAudioData() {
    if (this.audioChunks.length === 0) {
      this.isProcessing = false;
      return;
    }

    try {
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Convert to array buffer for processing
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);

      // Send audio data to background
      await chrome.runtime.sendMessage({
        type: VOICE_MESSAGE_TYPES.VOICE_DATA,
        audioData: Array.from(audioData),
        format: 'webm',
      });

    } catch (error) {
      console.error('Failed to process audio data:', error);
      this.showError('Ошибка обработки аудио');
    } finally {
      this.isProcessing = false;
      this.audioChunks = [];
    }
  }

  /**
   * Handle transcription from background
   */
  handleTranscription(message) {
    const { text, timestamp, model } = message;
    
    // Update transcription display
    this.transcriptionText.textContent = text;
    this.transcriptionText.classList.remove('empty');

    // Update status
    this.voiceStatus.textContent = `Распознано: ${text}`;
    this.voiceStatus.classList.add('active');

    // Clear status after 3 seconds
    setTimeout(() => {
      if (!this.isRecording) {
        this.voiceStatus.textContent = 'Нажмите для начала записи';
        this.voiceStatus.classList.remove('active');
      }
    }, 3000);
  }

  /**
   * Handle command from background
   */
  handleCommand(message) {
    const { command, transcription, executed } = message;
    
    // Add command to list
    this.addCommandToList({
      text: transcription,
      action: this.formatCommand(command),
      executed,
      timestamp: Date.now(),
    });

    // Update status
    if (executed) {
      this.voiceStatus.textContent = `Команда выполнена: ${this.formatCommand(command)}`;
      this.voiceStatus.classList.add('success');
    } else {
      this.voiceStatus.textContent = `Ошибка выполнения команды`;
      this.voiceStatus.classList.add('error');
    }

    // Clear status after 3 seconds
    setTimeout(() => {
      if (!this.isRecording) {
        this.voiceStatus.textContent = 'Нажмите для начала записи';
        this.voiceStatus.classList.remove('success', 'error');
      }
    }, 3000);
  }

  /**
   * Handle error from background
   */
  handleError(message) {
    const { error } = message;
    this.showError(error);
    
    // Stop recording on error
    if (this.isRecording) {
      this.stopRecording();
    }
  }

  /**
   * Update recording UI
   */
  updateRecordingUI(isRecording) {
    if (isRecording) {
      this.voiceButton.classList.add('recording');
      this.voiceButton.innerHTML = '⏹️';
      this.voiceButton.title = 'Остановить запись';
      this.voiceStatus.textContent = 'Идет запись...';
      this.voiceStatus.classList.add('active');
    } else {
      this.voiceButton.classList.remove('recording', 'processing');
      this.voiceButton.innerHTML = '🎤';
      this.voiceButton.title = 'Начать запись';
      
      if (!this.isProcessing) {
        this.voiceStatus.textContent = 'Нажмите для начала записи';
        this.voiceStatus.classList.remove('active');
      }
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    
    setTimeout(() => {
      this.errorMessage.style.display = 'none';
    }, 5000);
  }

  /**
   * Add command to the commands list
   */
  addCommandToList(command) {
    // Remove empty state if exists
    const emptyItem = this.commandsList.querySelector('.command-text.empty');
    if (emptyItem) {
      emptyItem.parentElement.remove();
    }

    // Create command item
    const commandItem = document.createElement('div');
    commandItem.className = 'command-item';
    
    commandItem.innerHTML = `
      <span class="command-text">${command.text}</span>
      <span class="command-action">${command.action}</span>
      <span class="command-status ${command.executed ? 'success' : 'error'}">
        ${command.executed ? '✓' : '✗'}
      </span>
    `;

    // Add to top of list
    this.commandsList.insertBefore(commandItem, this.commandsList.firstChild);

    // Keep only last 10 commands
    const commands = this.commandsList.querySelectorAll('.command-item');
    if (commands.length > 10) {
      commands[commands.length - 1].remove();
    }
  }

  /**
   * Format command for display
   */
  formatCommand(command) {
    switch (command.type) {
      case 'click':
        return `Клик: ${command.target || 'элемент'}`;
      case 'double_click':
        return 'Двойной клик';
      case 'right_click':
        return 'Правый клик';
      case 'input':
        return `Ввод: "${command.text || ''}"`;
      case 'scroll':
        return `Прокрутка: ${command.direction || 'вниз'}`;
      default:
        return `Команда: ${command.type}`;
    }
  }

  /**
   * Check if browser supports required features
   */
  checkBrowserSupport() {
    const features = {
      mediaRecorder: !!(navigator.mediaDevices && MediaRecorder),
      webAudio: !!(window.AudioContext || window.webkitAudioContext),
      chromeExtension: !!(typeof chrome !== 'undefined' && chrome.runtime),
    };

    const missing = Object.entries(features)
      .filter(([_, supported]) => !supported)
      .map(([feature]) => feature);

    if (missing.length > 0) {
      console.warn('Missing browser features:', missing);
      return false;
    }

    return true;
  }
}

// Initialize voice controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check browser support
  const voiceController = new VoiceController();
  
  if (!voiceController.checkBrowserSupport()) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
      errorMessage.textContent = 'Ваш браузер не поддерживает все необходимые функции голосового управления';
      errorMessage.style.display = 'block';
    }
  }
});

export { VoiceController };