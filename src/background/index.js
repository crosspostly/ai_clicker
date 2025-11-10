/**
 * Background service worker
 * Handles background tasks and message routing
 */

import { voiceHandler } from './voiceHandler.js';
import { liveModeManager } from './LiveModeManager.js';
import { PlaybackHandler } from './playbackHandler.js';
import { VoicePlaybackIntegration } from '../services/voicePlaybackIntegration.js';

// Initialize handlers
const playbackHandler = new PlaybackHandler();
const voicePlaybackIntegration = new VoicePlaybackIntegration(playbackHandler);

/**
 * Send status message to popup and settings
 */
function sendStatusToUI(message, detail = '', type = 'info') {
  const timestamp = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const statusData = {
    type: 'statusUpdate',
    message,
    detail,
    type,
    timestamp
  };
  
  // Send to popup
  chrome.runtime.sendMessage(statusData).catch(() => {
    // Ignore errors if popup is not open
  });
  
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}${detail ? ': ' + detail : ''}`);
}

/**
 * Listen for extension installation
 */
chrome.runtime.onInstalled.addListener(() => {
  // Open options page on installation
  chrome.runtime.openOptionsPage();
});

/**
 * Listen for messages
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Received message:', request);
  
  try {
    // ✅ Handle Live Mode actions
    if (request.action && request.action.startsWith('startLiveMode')) {
      handleStartLiveMode(request, sender)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }

    if (request.action === 'stopLiveMode') {
      handleStopLiveMode();
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'sendUserInput') {
      handleSendUserInput(request);
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'toggleScreenCapture') {
      liveModeManager.toggleScreenCapture();
      sendResponse({ success: true });
      return true;
    }
    
    // Relay to content script
    if (request.target === 'content') {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
            console.log('[Background] Content response:', response);
            sendResponse(response);
          });
        } else {
          console.error('[Background] No active tab found');
          sendResponse({error: 'No active tab'});
        }
      });
      return true; // Keep message channel open for async response
    }
    
    // Relay to popup
    if (request.target === 'popup') {
      chrome.runtime.sendMessage(request, (response) => {
        console.log('[Background] Popup response:', response);
        sendResponse(response);
      });
      return true; // Keep message channel open for async response
    }

    switch (request.type) {
      case 'actionRecorded':
        // Forward to popup if needed
        handleActionRecorded(request);
        break;

      case 'executeActions':
        // Could be used for cross-tab execution
        handleExecuteActions(request);
        break;

      // Voice-Playback Integration handlers
      case 'voiceCommand':
        handleVoiceCommand(request, sender)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response

      case 'stopVoiceJobs':
        handleStopVoiceJobs(request)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response

      case 'getVoiceJobStatus':
        handleGetVoiceJobStatus(request)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response

      default:
        // Pass through unknown messages
        break;
    }
  } catch (error) {
    console.error('[Background] Error handling message:', error);
  }

  sendResponse({ success: true });
});

/**
 * ✅ Handle start Live Mode
 */
async function handleStartLiveMode(request, sender) {
  try {
    const apiKey = request.apiKey;
    const tabId = sender.tab?.id;

    if (!apiKey) {
      sendStatusToUI('❌ Ошибка Live Mode', 'API ключ не указан', 'error');
      throw new Error('API key required');
    }

    if (!tabId) {
      sendStatusToUI('❌ Ошибка Live Mode', 'ID вкладки не найден', 'error');
      throw new Error('Tab ID not found');
    }

    console.log('[Background] Starting Live Mode for tab:', tabId);
    sendStatusToUI('🎙️ Запуск Live Mode', 'Инициализация...', 'info');
    await liveModeManager.start(apiKey, tabId);
    sendStatusToUI('✅ Live Mode активен', 'Готов к приему команд', 'success');
  } catch (error) {
    console.error('[Background] Failed to start Live Mode:', error);
    sendStatusToUI('❌ Ошибка запуска', error.message, 'error');
    throw error;
  }
}

/**
 * ✅ Handle stop Live Mode
 */
function handleStopLiveMode() {
  try {
    console.log('[Background] Stopping Live Mode');
    sendStatusToUI('⏹️ Остановка Live Mode', 'Завершение...', 'info');
    liveModeManager.stop();
    sendStatusToUI('✅ Live Mode остановлен', 'Режим завершен', 'success');
  } catch (error) {
    console.error('[Background] Failed to stop Live Mode:', error);
    sendStatusToUI('❌ Ошибка остановки', error.message, 'error');
  }
}

/**
 * ✅ Handle send user input to Gemini
 */
function handleSendUserInput(request) {
  try {
    const { text, audio } = request;
    liveModeManager.sendUserInput({ text, audio });
  } catch (error) {
    console.error('[Background] Failed to send user input:', error);
  }
}

/**
 * Handle recorded action
 */
function handleActionRecorded(_request) {
  // Could be extended to track statistics, sync with server, etc.
}

/**
 * Handle execute actions request
 */
function handleExecuteActions(_request) {
  // Could be used to execute actions from background or other tabs
}

/**
 * Handle voice command execution
 */
async function handleVoiceCommand(request, sender) {
  try {
    const { voiceCommand, options } = request;
    const voiceSessionId = options?.voiceSessionId || sender.tab?.id;
    
    console.log('[Background] Executing voice command:', voiceCommand);
    
    const result = await voicePlaybackIntegration.executeVoiceCommand(voiceCommand, {
      ...options,
      voiceSessionId
    });
    
    console.log('[Background] Voice command result:', result);
    return result;
    
  } catch (error) {
    console.error('[Background] Voice command execution failed:', error);
    throw error;
  }
}

/**
 * Handle stop voice jobs
 */
async function handleStopVoiceJobs(request) {
  try {
    const { voiceSessionId } = request;
    console.log('[Background] Stopping voice jobs for session:', voiceSessionId);
    
    const result = await voicePlaybackIntegration.stopVoiceJobs(voiceSessionId);
    console.log('[Background] Voice jobs stopped:', result);
    
    return result;
    
  } catch (error) {
    console.error('[Background] Failed to stop voice jobs:', error);
    throw error;
  }
}

/**
 * Handle get voice job status
 */
async function handleGetVoiceJobStatus(request) {
  try {
    const { voiceSessionId } = request;
    const status = voicePlaybackIntegration.getVoiceJobStatus(voiceSessionId);
    
    return {
      success: true,
      status,
      queueStatus: voicePlaybackIntegration.getQueueStatus()
    };
    
  } catch (error) {
    console.error('[Background] Failed to get voice job status:', error);
    throw error;
  }
}

/**
 * Listen for tab changes
 */
chrome.tabs.onActivated.addListener((_activeInfo) => {
  // Tab activated
});

/**
 * Listen for tab updates
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (changeInfo.status === 'complete') {
    // Tab completed loading
  }
});

/**
 * ✅ Clean up Live Mode when tab is closed
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  const status = liveModeManager.getStatus();
  if (status.isActive && liveModeManager.currentTab === tabId) {
    console.log('[Background] Tab closed, stopping Live Mode');
    liveModeManager.stop();
  }
});

/**
 * Clean up stale data periodically
 */
setInterval(() => {
  chrome.storage.local.get(['executionHistory'], (result) => {
    const history = result.executionHistory || [];
    // Keep only last 100 executions
    if (history.length > 100) {
      chrome.storage.local.set({
        executionHistory: history.slice(-100),
      });
    }
  });
}, 3600000); // Every hour
