/**
 * Popup UI logic
 */

import { StorageManager } from '../common/storage.js';
import { Validator } from '../common/validator.js';

let isRecording = false;
let recordedActions = [];
let isAutoMode = false;
let geminiEnabled = false;
let geminiApiKey = null;

// DOM elements
const startRecordingBtn = document.getElementById('start-recording');
const stopRecordingBtn = document.getElementById('stop-recording');
const playActionsBtn = document.getElementById('play-actions');
const clearActionsBtn = document.getElementById('clear-actions');
const exportActionsBtn = document.getElementById('export-actions');
const importActionsBtn = document.getElementById('import-actions');
const importFileInput = document.getElementById('import-file-input');
const actionsContainer = document.getElementById('actions-container');
const modeManualBtn = document.getElementById('mode-manual');
const modeAutoBtn = document.getElementById('mode-auto');
const manualModeDiv = document.getElementById('manual-mode');
const autoModeDiv = document.getElementById('auto-mode');
const startAutoBtn = document.getElementById('start-auto');
const stopAutoBtn = document.getElementById('stop-auto');
const aiInstructions = document.getElementById('ai-instructions');
const statusText = document.getElementById('status-text');
const statusLog = document.getElementById('status-log');
const playbackSpeed = document.getElementById('playback-speed');
const speedLabel = document.getElementById('speed-label');
const settingsBtn = document.getElementById('settings-btn');

/**
 * Initialize popup
 */
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
  modeManualBtn.addEventListener('click', switchToManualMode);
  modeAutoBtn.addEventListener('click', switchToAutoMode);
  startRecordingBtn.addEventListener('click', startRecording);
  stopRecordingBtn.addEventListener('click', stopRecording);
  playActionsBtn.addEventListener('click', playActions);
  clearActionsBtn.addEventListener('click', clearActions);
  exportActionsBtn.addEventListener('click', exportActions);
  importActionsBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', handleImportFile);
  startAutoBtn.addEventListener('click', startAutoMode);
  stopAutoBtn.addEventListener('click', stopAutoMode);
  playbackSpeed.addEventListener('change', updateSpeedLabel);
  settingsBtn.addEventListener('click', openSettings);
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
        statusText.textContent = `${request.status.charAt(0).toUpperCase() + request.status.slice(1)}`;
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
  isAutoMode = false;
  modeManualBtn.classList.add('active');
  modeAutoBtn.classList.remove('active');
  manualModeDiv.classList.add('active');
  autoModeDiv.classList.remove('active');
}

/**
 * Switch to auto mode
 */
function switchToAutoMode() {
  isAutoMode = true;
  modeAutoBtn.classList.add('active');
  modeManualBtn.classList.remove('active');
  autoModeDiv.classList.add('active');
  manualModeDiv.classList.remove('active');
}

/**
 * Start recording
 */
function startRecording() {
  isRecording = true;
  recordedActions = [];
  actionsContainer.innerHTML = '';
  startRecordingBtn.disabled = true;
  stopRecordingBtn.disabled = false;
  playActionsBtn.disabled = true;
  addLog('🔴 Запись началась', 'info');

  chrome.runtime.sendMessage({ 
    target: 'content',
    action: 'startRecording' 
  }, (response) => {
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
  isRecording = false;
  startRecordingBtn.disabled = false;
  stopRecordingBtn.disabled = true;
  updatePlaybackButton();
  addLog(
    `⏹️ Запись остановлена (${recordedActions.length} действий)`,
    'success',
  );

  chrome.runtime.sendMessage({ 
    target: 'content',
    action: 'stopRecording' 
  }, (response) => {
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
    playActionsBtn.disabled = false;
    exportActionsBtn.disabled = false;
  } else {
    playActionsBtn.disabled = true;
    exportActionsBtn.disabled = true;
  }
}

/**
 * Clear actions
 */
function clearActions() {
  if (confirm('Удалить все записанные действия?')) {
    recordedActions = [];
    actionsContainer.innerHTML = '';
    playActionsBtn.disabled = true;
    exportActionsBtn.disabled = true;
    saveActions();
    addLog('🗑️ Действия удалены', 'info');
  }
}

/**
 * Play actions
 */
function playActions() {
  const speed = parseFloat(playbackSpeed.value);
  chrome.runtime.sendMessage({
    target: 'content',
    action: 'playActions',
    actions: recordedActions,
    speed: speed,
  }, (response) => {
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
  actionsContainer.innerHTML = '';
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

  actionsContainer.appendChild(actionItem);
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
  const instructions = aiInstructions.value.trim();
  if (!instructions) {
    addLog('⚠️ Введите инструкции', 'warn');
    return;
  }

  try {
    startAutoBtn.disabled = true;
    stopAutoBtn.disabled = false;
    statusText.textContent = '🕐 Анализирую...';
    statusLog.innerHTML = '';

    addLog('🤖 Анализирую инструкции...', 'info');

    chrome.runtime.sendMessage({
      target: 'content',
      action: 'startAIMode',
      instructions: instructions,
      geminiApiKey: geminiEnabled ? geminiApiKey : null,
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to start AI mode:', chrome.runtime.lastError);
        addLog('✗ Ошибка запуска ИИ режима', 'error');
        startAutoBtn.disabled = false;
        stopAutoBtn.disabled = true;
      }
    });
  } catch (error) {
    console.error('Failed to start AI mode:', error);
    addLog(`✗ Ошибка: ${error.message}`, 'error');
    startAutoBtn.disabled = false;
    stopAutoBtn.disabled = true;
  }
}

/**
 * Stop AI automation mode
 */
function stopAutoMode() {
  startAutoBtn.disabled = false;
  stopAutoBtn.disabled = true;
  statusText.textContent = '🛑 Остановлено';
  addLog('⏸️ Выполнение остановлено', 'warn');

  chrome.runtime.sendMessage({ 
    target: 'content',
    action: 'stopAIMode' 
  }, (response) => {
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
  speedLabel.textContent = playbackSpeed.value + 'x';
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
  statusLog.appendChild(logEntry);
  statusLog.scrollTop = statusLog.scrollHeight;

  // Keep only last 50 entries
  while (statusLog.children.length > 50) {
    statusLog.removeChild(statusLog.firstChild);
  }
}

/**
 * Open settings page
 */
function openSettings() {
  chrome.runtime.openOptionsPage();
}
