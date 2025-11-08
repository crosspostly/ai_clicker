/**
 * Popup UI Controller
 */

class PopupUI {
  constructor() {
    this.elements = {};
    this.state = {
      isRecording: false,
      isExecuting: false,
      isPaused: false,
      actionsCount: 0,
      speed: 1,
    };
  }

  /**
   * Initialize popup UI
   */
  async init() {
    this.cacheElements();
    this.attachEventListeners();
    this.loadState();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      startRecording: document.getElementById('start-recording'),
      stopRecording: document.getElementById('stop-recording'),
      clearActions: document.getElementById('clear-actions'),
      executeActions: document.getElementById('execute-actions'),
      stopExecution: document.getElementById('stop-execution'),
      pauseExecution: document.getElementById('pause-execution'),
      resumeExecution: document.getElementById('resume-execution'),
      openSettings: document.getElementById('open-settings'),
      recordingStatus: document.getElementById('recording-status'),
      executionStatus: document.getElementById('execution-status'),
      actionsCount: document.getElementById('actions-count'),
      speedSlider: document.getElementById('speed-slider'),
      speedValue: document.getElementById('speed-value'),
      progressSection: document.getElementById('progress-section'),
      progressBar: document.getElementById('progress-bar'),
      progressCurrent: document.getElementById('progress-current'),
      progressTotal: document.getElementById('progress-total'),
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.elements.startRecording.addEventListener('click', () => this.startRecording());
    this.elements.stopRecording.addEventListener('click', () => this.stopRecording());
    this.elements.clearActions.addEventListener('click', () => this.clearActions());
    this.elements.executeActions.addEventListener('click', () => this.executeActions());
    this.elements.stopExecution.addEventListener('click', () => this.stopExecution());
    this.elements.pauseExecution.addEventListener('click', () => this.pauseExecution());
    this.elements.resumeExecution.addEventListener('click', () => this.resumeExecution());
    this.elements.openSettings.addEventListener('click', () => this.openSettings());
    this.elements.speedSlider.addEventListener('input', e => this.setSpeed(e.target.value));

    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      this.handleMessage(message);
    });
  }

  /**
   * Load state from storage
   */
  async loadState() {
    try {
      const result = await chrome.storage.local.get(['recordedActions']);
      const actions = result.recordedActions || [];

      this.state.actionsCount = actions.length;
      this.updateActionsCount();
      this.updateExecuteButton();
    } catch (error) {
      console.error('Failed to load state', error);
    }
  }

  /**
   * Start recording
   */
  async startRecording() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { type: 'start-recording' }, _response => {
        if (chrome.runtime.lastError) {
          console.error('Failed to start recording', chrome.runtime.lastError);
          return;
        }

        this.state.isRecording = true;
        this.updateRecordingUI();
      });
    } catch (error) {
      console.error('Error starting recording', error);
    }
  }

  /**
   * Stop recording
   */
  async stopRecording() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { type: 'stop-recording' }, response => {
        if (chrome.runtime.lastError) {
          console.error('Failed to stop recording', chrome.runtime.lastError);
          return;
        }

        this.state.isRecording = false;
        this.state.actionsCount = response.actions?.length || 0;

        this.updateRecordingUI();
        this.updateActionsCount();
        this.updateExecuteButton();
      });
    } catch (error) {
      console.error('Error stopping recording', error);
    }
  }

  /**
   * Clear actions
   */
  async clearActions() {
    if (!confirm('Вы уверены, что хотите очистить все действия?')) {
      return;
    }

    try {
      await chrome.storage.local.remove('recordedActions');

      this.state.actionsCount = 0;
      this.updateActionsCount();
      this.updateExecuteButton();
    } catch (error) {
      console.error('Error clearing actions', error);
    }
  }

  /**
   * Execute actions
   */
  async executeActions() {
    try {
      const result = await chrome.storage.local.get('recordedActions');
      const actions = result.recordedActions || [];

      if (actions.length === 0) {
        alert('Нет записанных действий');
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      this.state.isExecuting = true;
      this.updateExecutionUI();

      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'execute-actions',
          actions,
          settings: { speed: this.state.speed },
        },
        _response => {
          if (chrome.runtime.lastError) {
            console.error('Failed to execute actions', chrome.runtime.lastError);
            this.state.isExecuting = false;
            this.updateExecutionUI();
            return;
          }

          this.state.isExecuting = false;
          this.updateExecutionUI();
        },
      );
    } catch (error) {
      console.error('Error executing actions', error);
      this.state.isExecuting = false;
      this.updateExecutionUI();
    }
  }

  /**
   * Stop execution
   */
  async stopExecution() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { type: 'stop-execution' }, () => {
        this.state.isExecuting = false;
        this.state.isPaused = false;
        this.updateExecutionUI();
      });
    } catch (error) {
      console.error('Error stopping execution', error);
    }
  }

  /**
   * Pause execution
   */
  async pauseExecution() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { type: 'pause-execution' }, () => {
        this.state.isPaused = true;
        this.updateExecutionUI();
      });
    } catch (error) {
      console.error('Error pausing execution', error);
    }
  }

  /**
   * Resume execution
   */
  async resumeExecution() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { type: 'resume-execution' }, () => {
        this.state.isPaused = false;
        this.updateExecutionUI();
      });
    } catch (error) {
      console.error('Error resuming execution', error);
    }
  }

  /**
   * Set execution speed
   * @param {number} speed - Speed multiplier
   */
  setSpeed(speed) {
    this.state.speed = parseFloat(speed);
    this.elements.speedValue.textContent = this.state.speed.toFixed(1) + 'x';
  }

  /**
   * Open settings page
   */
  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Handle message from background or content script
   * @param {Object} message - Message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'recording-started':
        this.state.isRecording = true;
        this.updateRecordingUI();
        break;

      case 'recording-stopped':
        this.state.isRecording = false;
        this.state.actionsCount = message.data?.actions?.length || 0;
        this.updateRecordingUI();
        this.updateActionsCount();
        this.updateExecuteButton();
        break;

      case 'execution-started':
        this.state.isExecuting = true;
        this.updateExecutionUI();
        this.elements.progressSection.style.display = 'block';
        this.elements.progressTotal.textContent = message.data.count;
        break;

      case 'action-completed':
        this.updateProgress(message.data);
        break;

      case 'execution-completed':
        this.state.isExecuting = false;
        this.state.isPaused = false;
        this.updateExecutionUI();
        this.elements.progressSection.style.display = 'none';
        break;

      case 'execution-error':
        this.state.isExecuting = false;
        this.updateExecutionUI();
        this.elements.progressSection.style.display = 'none';
        alert('Ошибка выполнения: ' + message.data.error);
        break;
    }
  }

  /**
   * Update recording UI
   */
  updateRecordingUI() {
    const isRecording = this.state.isRecording;

    this.elements.startRecording.disabled = isRecording;
    this.elements.stopRecording.disabled = !isRecording;

    if (isRecording) {
      this.elements.recordingStatus.textContent = '● Запись...';
      this.elements.recordingStatus.classList.add('active-recording');
    } else {
      this.elements.recordingStatus.textContent = 'Не активна';
      this.elements.recordingStatus.classList.remove('active-recording');
    }
  }

  /**
   * Update execution UI
   */
  updateExecutionUI() {
    const isExecuting = this.state.isExecuting;
    const isPaused = this.state.isPaused;

    this.elements.executeActions.disabled = isExecuting || this.state.actionsCount === 0;
    this.elements.stopExecution.disabled = !isExecuting;
    this.elements.pauseExecution.disabled = !isExecuting || isPaused;
    this.elements.resumeExecution.disabled = !isPaused;

    if (isExecuting) {
      this.elements.executionStatus.textContent = isPaused ? '● Пауза' : '● Выполнение...';
      this.elements.executionStatus.classList.add('active-execution');
    } else {
      this.elements.executionStatus.textContent = 'Не активно';
      this.elements.executionStatus.classList.remove('active-execution');
    }
  }

  /**
   * Update actions count display
   */
  updateActionsCount() {
    this.elements.actionsCount.textContent = this.state.actionsCount;
  }

  /**
   * Update execute button state
   */
  updateExecuteButton() {
    this.elements.executeActions.disabled = this.state.actionsCount === 0;
  }

  /**
   * Update progress bar
   * @param {Object} data - Progress data
   */
  updateProgress(data) {
    const { progress, index } = data;
    const percentage = Math.min(100, Math.max(0, progress));

    this.elements.progressBar.style.width = percentage + '%';
    this.elements.progressCurrent.textContent = index + 1;
  }
}

const popupUI = new PopupUI();
document.addEventListener('DOMContentLoaded', () => {
  popupUI.init();
});
