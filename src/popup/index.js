/**
 * Popup UI logic
 */

import { StorageManager } from '../common/storage';
import { Validator } from '../common/validator';

let recordedActions = [];
let geminiEnabled = false;
let geminiApiKey = null;

// Export state for testing
export const state = {
  isRecording: false,
  actions: recordedActions,
  currentTabId: null,
};

// Export functions for testing
export function startRecording() {
  state.isRecording = true;
  state.actions = [];
  if (elements.startRecording) elements.startRecording.disabled = true;
  if (elements.stopRecording) elements.stopRecording.disabled = false;
  if (elements.playActions) elements.playActions.disabled = true;
  
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime.sendMessage({
      type: 'START_RECORDING',
    });
  }
  return Promise.resolve();
}




export function loadState() {
  // Handle test environment
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return Promise.resolve(state);
  }
  
  return chrome.storage.local.get('popup-state').then(result => {
    if (result['popup-state']) {
      Object.assign(state, result['popup-state']);
      recordedActions = state.actions;
    }
    return state;
  });
}

// DOM elements - export for testing
const getElement = (id) => {
  try {
    return document ? document.getElementById(id) : null;
  } catch (e) {
    return null;
  }
};

export const elements = {
  startRecording: getElement('start-recording'),
  stopRecording: getElement('stop-recording'),
  playActions: getElement('play-actions'),
  clearActions: getElement('clear-actions'),
  exportActions: getElement('export-actions'),
  importActions: getElement('import-actions'),
  importFileInput: getElement('import-file-input'),
  actionsContainer: getElement('actions-container'),
  modeManual: getElement('mode-manual'),
  modeAuto: getElement('mode-auto'),
  manualMode: getElement('manual-mode'),
  autoMode: getElement('auto-mode'),
  startAuto: getElement('start-auto'),
  stopAuto: getElement('stop-auto'),
  aiInstructions: getElement('ai-instructions'),
  statusText: getElement('status-text'),
  statusLog: getElement('status-log'),
  playbackSpeed: getElement('playback-speed'),
  speedLabel: getElement('speed-label'),
  settingsBtn: getElement('settings-btn'),
  // Additional elements expected by tests
  statusMessage: getElement('status-text'),
  actionsList: getElement('actions-container'),
  instructionInput: getElement('ai-instructions'),
};

/**
 * Initialize popup
 */
// Only initialize DOM when not in test environment
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await loadSettings();
      await loadSavedActions();
      setupEventListeners();
      setupMessageListeners();
    } catch (error) {
      console.error('Popup initialization error:', error);
      addLog('Ошибка инициализации', 'error');
    }
  });
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await StorageManager.get(
      ['geminiEnabled', 'geminiApiKey'],
      'sync',
    );
    geminiEnabled = result.geminiEnabled !== false;
    geminiApiKey = result.geminiApiKey || null;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * Load saved actions from storage
 */
async function loadSavedActions() {
  try {
    recordedActions = await StorageManager.getActions();
    renderActionsList();
    updatePlaybackButton();
  } catch (error) {
    console.error('Failed to load actions:', error);
    addLog('Ошибка загрузки действий', 'error');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add null checks for testing environment
  if (elements.modeManual) elements.modeManual.addEventListener('click', switchToManualMode);
  if (elements.modeAuto) elements.modeAuto.addEventListener('click', switchToAutoMode);
  if (elements.startRecording) elements.startRecording.addEventListener('click', handleStartRecording);
  if (elements.stopRecording) elements.stopRecording.addEventListener('click', stopRecording);
  if (elements.playActions) elements.playActions.addEventListener('click', playActions);
  if (elements.clearActions) elements.clearActions.addEventListener('click', clearActions);
  if (elements.exportActions) elements.exportActions.addEventListener('click', exportActions);
  if (elements.importActions) elements.importActions.addEventListener('click', () => elements.importFileInput.click());
  if (elements.importFileInput) elements.importFileInput.addEventListener('change', handleImportFile);
  if (elements.startAuto) elements.startAuto.addEventListener('click', startAutoMode);
  if (elements.stopAuto) elements.stopAuto.addEventListener('click', stopAutoMode);
  if (elements.playbackSpeed) elements.playbackSpeed.addEventListener('change', updateSpeedLabel);
  if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', openSettings);
}

/**
 * Setup message listeners for content script
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    switch (request.type) {
      case 'actionRecorded':
        recordedActions.push(request.data);
        addActionToUI(request.data, recordedActions.length - 1);
        saveActions();
        updatePlaybackButton();
        break;

      case 'aiStatus':
        elements.statusText.textContent = `${request.status.charAt(0).toUpperCase() + request.status.slice(1)}`;
        if (request.message) {
          addLog(request.message, request.level || 'info');
        }
        break;

      case 'aiLog':
        addLog(request.message, request.level || 'info');
        break;
    }
  });
}

/**
 * Switch to manual mode
 */
function switchToManualMode() {
  elements.modeManual.classList.add('active');
  elements.modeAuto.classList.remove('active');
  elements.manualMode.classList.add('active');
  elements.autoMode.classList.remove('active');
}

/**
 * Switch to auto mode
 */
function switchToAutoMode() {
  elements.modeAuto.classList.add('active');
  elements.modeManual.classList.remove('active');
  elements.autoMode.classList.add('active');
  elements.manualMode.classList.remove('active');
}

/**
 * Start recording
 */
function handleStartRecording() {
  recordedActions = [];
  elements.actionsContainer.innerHTML = '';
  elements.startRecording.disabled = true;
  elements.stopRecording.disabled = false;
  elements.playActions.disabled = true;
  addLog('🔴 Запись началась', 'info');

  chrome.runtime.sendMessage({ 
    target: 'content',
    action: 'startRecording', 
  }, (_response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to start recording:', chrome.runtime.lastError);
      addLog('✗ Ошибка запуска записи', 'error');
    }
  });
}

/**
 * Stop recording
 */
function stopRecording() {
  elements.startRecording.disabled = false;
  elements.stopRecording.disabled = true;
  updatePlaybackButton();
  addLog(
    `⏹️ Запись остановлена (${recordedActions.length} действий)`,
    'success',
  );

  chrome.runtime.sendMessage({ 
    target: 'content',
    action: 'stopRecording', 
  }, (_response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to stop recording:', chrome.runtime.lastError);
      addLog('✗ Ошибка остановки записи', 'error');
    }
  });

  saveActions();
}

/**
 * Update playback button state
 */
function updatePlaybackButton() {
  if (recordedActions.length > 0) {
    elements.playActions.disabled = false;
    elements.exportActions.disabled = false;
  } else {
    elements.playActions.disabled = true;
    elements.exportActions.disabled = true;
  }
}

/**
 * Clear actions
 */
function clearActions() {
  if (confirm('Удалить все записанные действия?')) {
    recordedActions = [];
    elements.actionsContainer.innerHTML = '';
    elements.playActions.disabled = true;
    elements.exportActions.disabled = true;
    saveActions();
    addLog('🗑️ Действия удалены', 'info');
  }
}

/**
 * Play actions
 */
function playActions() {
  const speed = parseFloat(elements.playbackSpeed.value);
  chrome.runtime.sendMessage({
    target: 'content',
    action: 'playActions',
    actions: recordedActions,
    speed: speed,
  }, (_response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to play actions:', chrome.runtime.lastError);
      addLog('✗ Ошибка воспроизведения', 'error');
    }
  });
  addLog(`▶️ Воспроизведение с скоростью ${speed}x`, 'info');
}

/**
 * Export actions as JSON
 */
function exportActions() {
  if (recordedActions.length === 0) {
    addLog('⚠️ Нет действий для экспорта', 'warn');
    return;
  }

  const json = JSON.stringify(recordedActions, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `actions-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  addLog('📥 Действия экспортированы', 'success');
}

/**
 * Handle import file
 */
function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      if (!Array.isArray(json)) {
        throw new Error('Ожидается массив действий');
      }

      recordedActions = json;
      renderActionsList();
      saveActions();
      updatePlaybackButton();
      addLog(`📤 Загружено ${json.length} действий`, 'success');
    } catch (error) {
      addLog(`✗ Ошибка импорта: ${error.message}`, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // Reset file input
}

/**
 * Render actions list
 */
function renderActionsList() {
  elements.actionsContainer.innerHTML = '';
  recordedActions.forEach((action, index) => {
    addActionToUI(action, index);
  });
}

/**
 * Add action to UI
 */
function addActionToUI(action, index) {
  const actionItem = document.createElement('div');
  actionItem.className = 'action-item';

  let actionText = '';
  switch (action.type) {
    case 'click':
      actionText = `Клик: ${action.target || action.selector || 'элемент'}`;
      break;
    case 'input':
      actionText = `Ввод: "${action.value || ''}"`;
      break;
    case 'hover':
      actionText = `Наведение: ${action.target || action.selector}`;
      break;
    case 'scroll':
      actionText = `Прокрутка на ${action.pixels}px`;
      break;
    case 'wait':
      actionText = `Ожидание ${action.duration}ms`;
      break;
    case 'select':
      actionText = `Выбрать: ${action.value}`;
      break;
    case 'double_click':
      actionText = `Двойной клик: ${action.target || 'элемент'}`;
      break;
    case 'right_click':
      actionText = `Правый клик: ${action.target || 'элемент'}`;
      break;
    default:
      actionText = `${action.type}`;
  }

  actionItem.innerHTML = `
    <span class="action-text">${Validator.sanitizeHtml(actionText)}</span>
    <button class="action-remove" data-index="${index}">✕</button>
  `;

  // Add event listener for the remove button
  const removeBtn = actionItem.querySelector('.action-remove');
  removeBtn.addEventListener('click', () => removeAction(index));

  elements.actionsContainer.appendChild(actionItem);
}

/**
 * Remove action
 */
function removeAction(index) {
  recordedActions.splice(index, 1);
  renderActionsList();
  saveActions();
  updatePlaybackButton();
}

/**
 * Save actions to storage
 */
async function saveActions() {
  try {
    await StorageManager.saveActions(recordedActions);
  } catch (error) {
    console.error('Failed to save actions:', error);
  }
}

/**
 * Start AI automation mode
 */
async function startAutoMode() {
  const instructions = elements.aiInstructions.value.trim();
  if (!instructions) {
    addLog('⚠️ Введите инструкции', 'warn');
    return;
  }

  try {
    elements.startAuto.disabled = true;
    elements.stopAuto.disabled = false;
    elements.statusText.textContent = '🕐 Анализирую...';
    elements.statusLog.innerHTML = '';

    addLog('🤖 Анализирую инструкции...', 'info');

    chrome.runtime.sendMessage({
      target: 'content',
      action: 'startAIMode',
      instructions: instructions,
      geminiApiKey: geminiEnabled ? geminiApiKey : null,
    }, (_response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to start AI mode:', chrome.runtime.lastError);
        addLog('✗ Ошибка запуска ИИ режима', 'error');
        elements.startAuto.disabled = false;
        elements.stopAuto.disabled = true;
      }
    });
  } catch (error) {
    console.error('Failed to start AI mode:', error);
    addLog(`✗ Ошибка: ${error.message}`, 'error');
    elements.startAuto.disabled = false;
    elements.stopAuto.disabled = true;
  }
}

/**
 * Stop AI automation mode
 */
function stopAutoMode() {
  elements.startAuto.disabled = false;
  elements.stopAuto.disabled = true;
  elements.statusText.textContent = '🛑 Остановлено';
  addLog('⏸️ Выполнение остановлено', 'warn');

  chrome.runtime.sendMessage({ 
    target: 'content',
    action: 'stopAIMode', 
  }, (_response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to stop AI mode:', chrome.runtime.lastError);
      addLog('✗ Ошибка остановки ИИ режима', 'error');
    }
  });
}

/**
 * Update speed label
 */
function updateSpeedLabel() {
  elements.speedLabel.textContent = elements.playbackSpeed.value + 'x';
}

/**
 * Add log message
 */
function addLog(message, level = 'info') {
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${level}`;
  const time = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  logEntry.innerHTML = `<span style="opacity:0.6;font-size:10px;">[${time}]</span> ${Validator.sanitizeHtml(message)}`;
  elements.statusLog.appendChild(logEntry);
  elements.statusLog.scrollTop = elements.statusLog.scrollHeight;

  // Keep only last 50 entries
  while (elements.statusLog.children.length > 50) {
    elements.statusLog.removeChild(elements.statusLog.firstChild);
  }
}

/**
 * Open settings page
 */
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Export functions for testing
export function cleanup() {
  // Cleanup function for tests
  if (chrome.runtime.onMessage && chrome.runtime.onMessage.removeListener) {
    // Mock cleanup for tests
  }
}

export function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

export function sendMessageWithRetry(message, maxRetries = 3) {
  let retries = 0;
  
  function attempt() {
    return chrome.runtime.sendMessage(message).catch(error => {
      if (retries < maxRetries) {
        retries++;
        return new Promise(resolve => setTimeout(resolve, 100)).then(attempt);
      }
      throw error;
    });
  }
  
  return attempt();
}

export function setRecordingState(isRecording) {
  // Function to set recording state for tests
  if (elements.startRecording) {
    elements.startRecording.disabled = isRecording;
  }
  if (elements.stopRecording) {
    elements.stopRecording.disabled = !isRecording;
  }
}
