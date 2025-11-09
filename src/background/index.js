/**
 * Background service worker
 * Handles background tasks and message routing
 */

import { voiceHandler } from './voiceHandler.js';
import { liveModeManager } from './LiveModeManager.js';

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
      throw new Error('API key required');
    }

    if (!tabId) {
      throw new Error('Tab ID not found');
    }

    console.log('[Background] Starting Live Mode for tab:', tabId);
    await liveModeManager.start(apiKey, tabId);
  } catch (error) {
    console.error('[Background] Failed to start Live Mode:', error);
    throw error;
  }
}

/**
 * ✅ Handle stop Live Mode
 */
function handleStopLiveMode() {
  try {
    console.log('[Background] Stopping Live Mode');
    liveModeManager.stop();
  } catch (error) {
    console.error('[Background] Failed to stop Live Mode:', error);
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
