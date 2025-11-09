/**
 * Playback Controller
 * Handles playback UI interactions and message communication
 */

import { ProgressBar } from './components/progressBar.js';
import { StatusIndicator } from './components/statusIndicator.js';

export class PlaybackController {
  constructor() {
    this.isInitialized = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentSpeed = 1;
    this.recordedActions = [];
    this.currentActionIndex = 0;
    
    // UI Elements
    this.elements = {};
    
    // Components
    this.progressBar = null;
    this.statusIndicator = null;
    
    // Message listeners
    this.messageListener = null;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      this.cacheElements();
      this.initializeComponents();
      this.setupEventListeners();
      this.loadSettings();
      await this.loadRecordedActions();
      
      this.isInitialized = true;
      this.statusIndicator.info('Ready to play');
    } catch (error) {
      console.error('Failed to initialize PlaybackController:', error);
      this.statusIndicator.error('Failed to initialize playback controller');
    }
  }

  cacheElements() {
    this.elements = {
      speedSelector: document.getElementById('speed-selector'),
      playBtn: document.getElementById('play-btn'),
      pauseBtn: document.getElementById('pause-btn'),
      stopBtn: document.getElementById('stop-btn'),
      frameNextBtn: document.getElementById('frame-next-btn'),
      actionsList: document.getElementById('actions-list'),
      actionCounter: document.getElementById('action-counter'),
      timeElapsed: document.getElementById('time-elapsed'),
    };
  }

  initializeComponents() {
    // Initialize Progress Bar
    const progressBarContainer = document.getElementById('progress-bar');
    this.progressBar = new ProgressBar(progressBarContainer);
    
    // Initialize Status Indicator
    const statusContainer = document.getElementById('playback-status');
    this.statusIndicator = new StatusIndicator(statusContainer);
  }

  setupEventListeners() {
    // Speed selector
    this.elements.speedSelector.addEventListener('change', (e) => {
      this.currentSpeed = parseFloat(e.target.value);
      this.saveSettings();
      this.statusIndicator.info(`Speed set to ${this.currentSpeed}x`, true);
    });

    // Play button
    this.elements.playBtn.addEventListener('click', () => {
      this.play();
    });

    // Pause button
    this.elements.pauseBtn.addEventListener('click', () => {
      this.pause();
    });

    // Stop button
    this.elements.stopBtn.addEventListener('click', () => {
      this.stop();
    });

    // Frame Next button
    this.elements.frameNextBtn.addEventListener('click', () => {
      this.nextFrame();
    });

    // Message listener for background updates
    this.messageListener = (message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    };
    
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['playbackSpeed']);
      if (result.playbackSpeed) {
        this.currentSpeed = result.playbackSpeed;
        this.elements.speedSelector.value = this.currentSpeed.toString();
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({
        playbackSpeed: this.currentSpeed,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async loadRecordedActions() {
    try {
      const result = await chrome.storage.local.get(['recordedActions']);
      this.recordedActions = result.recordedActions || [];
      this.renderActionsList();
      this.updateProgress(0, this.recordedActions.length);
    } catch (error) {
      console.error('Failed to load recorded actions:', error);
      this.statusIndicator.error('Failed to load recorded actions');
    }
  }

  renderActionsList() {
    const { actionsList } = this.elements;
    actionsList.innerHTML = '';

    if (this.recordedActions.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.textContent = 'No recorded actions';
      emptyMessage.style.color = 'var(--color-text-muted)';
      emptyMessage.style.fontStyle = 'italic';
      actionsList.appendChild(emptyMessage);
      return;
    }

    this.recordedActions.forEach((action, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = this.formatActionText(action);
      
      // Highlight current action during playback
      if (index === this.currentActionIndex && this.isPlaying) {
        listItem.style.background = 'var(--color-accent)';
        listItem.style.color = 'white';
      }
      
      actionsList.appendChild(listItem);
    });
  }

  formatActionText(action) {
    const typeMap = {
      click: 'Click',
      doubleClick: 'Double Click',
      rightClick: 'Right Click',
      input: 'Input',
      scroll: 'Scroll',
    };

    const type = typeMap[action.type] || action.type;
    const target = action.target || 'Unknown';
    const value = action.value ? `"${action.value}"` : '';
    
    return `${type}: ${target} ${value}`.trim();
  }

  async play() {
    if (this.recordedActions.length === 0) {
      this.statusIndicator.warning('No actions to play');
      return;
    }

    try {
      this.isPlaying = true;
      this.isPaused = false;
      this.updateButtonStates();
      
      this.progressBar.start();
      this.statusIndicator.info('Starting playback...');

      // Send message to background to start playback
      await chrome.runtime.sendMessage({
        target: 'background',
        action: 'PLAYBACK_START',
        data: {
          actions: this.recordedActions,
          speed: this.currentSpeed,
          startIndex: this.currentActionIndex,
        },
      });

    } catch (error) {
      console.error('Failed to start playback:', error);
      this.statusIndicator.error('Failed to start playback');
      this.stop();
    }
  }

  async pause() {
    if (!this.isPlaying || this.isPaused) return;

    try {
      this.isPaused = true;
      this.updateButtonStates();
      
      this.progressBar.pause();
      this.statusIndicator.info('Playback paused');

      await chrome.runtime.sendMessage({
        target: 'background',
        action: 'PLAYBACK_PAUSE',
      });

    } catch (error) {
      console.error('Failed to pause playback:', error);
      this.statusIndicator.error('Failed to pause playback');
    }
  }

  async stop() {
    if (!this.isPlaying) return;

    try {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentActionIndex = 0;
      this.updateButtonStates();
      
      this.progressBar.reset();
      this.statusIndicator.info('Playback stopped');

      await chrome.runtime.sendMessage({
        target: 'background',
        action: 'PLAYBACK_STOP',
      });

      this.renderActionsList();

    } catch (error) {
      console.error('Failed to stop playback:', error);
      this.statusIndicator.error('Failed to stop playback');
    }
  }

  async nextFrame() {
    if (this.currentActionIndex >= this.recordedActions.length) {
      this.statusIndicator.warning('No more actions');
      return;
    }

    try {
      this.statusIndicator.info('Executing next action...');

      await chrome.runtime.sendMessage({
        target: 'background',
        action: 'PLAYBACK_NEXT_FRAME',
        data: {
          actionIndex: this.currentActionIndex,
        },
      });

    } catch (error) {
      console.error('Failed to execute next frame:', error);
      this.statusIndicator.error('Failed to execute next action');
    }
  }

  updateProgress(current, total) {
    this.currentActionIndex = current;
    this.progressBar.update(current, total);
    this.renderActionsList();
  }

  updateButtonStates() {
    const { playBtn, pauseBtn, stopBtn, frameNextBtn } = this.elements;

    if (this.isPlaying && !this.isPaused) {
      playBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      frameNextBtn.disabled = true;
    } else if (this.isPlaying && this.isPaused) {
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      stopBtn.disabled = false;
      frameNextBtn.disabled = false;
    } else {
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
      frameNextBtn.disabled = false;
    }
  }

  async handleMessage(message, sender, sendResponse) {
    if (message.target !== 'playback') return;

    try {
      switch (message.action) {
        case 'PLAYBACK_STATUS':
          this.handlePlaybackStatus(message.data);
          break;
        
        case 'PLAYBACK_PROGRESS':
          this.updateProgress(message.data.current, message.data.total);
          break;
        
        case 'PLAYBACK_COMPLETED':
          this.handlePlaybackCompleted(message.data);
          break;
        
        case 'PLAYBACK_ERROR':
          this.handlePlaybackError(message.data);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }

    sendResponse({ success: true });
  }

  handlePlaybackStatus(data) {
    const { status, message } = data;
    
    switch (status) {
      case 'running':
        this.progressBar.setStatus('running');
        this.statusIndicator.info(message || 'Playing...');
        break;
      
      case 'paused':
        this.progressBar.setStatus('paused');
        this.statusIndicator.info(message || 'Paused');
        break;
      
      case 'stopped':
        this.progressBar.setStatus('error');
        this.statusIndicator.info(message || 'Stopped');
        break;
    }
  }

  handlePlaybackCompleted(data) {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentActionIndex = 0;
    this.updateButtonStates();
    
    this.progressBar.complete();
    this.statusIndicator.success('Playback completed successfully!');
    this.renderActionsList();
  }

  handlePlaybackError(data) {
    this.isPlaying = false;
    this.isPaused = false;
    this.updateButtonStates();
    
    this.progressBar.error();
    this.statusIndicator.error(data.message || 'Playback error occurred');
  }

  destroy() {
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
    }
    
    this.stop();
  }
}

// Initialize the controller when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  const controller = new PlaybackController();
  await controller.init();
  
  // Make controller available globally for debugging
  window.playbackController = controller;
});