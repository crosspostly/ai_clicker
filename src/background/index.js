/**
 * Background service worker
 * Handles background tasks and message routing
 */

import { voiceHandler } from './voiceHandler.js';

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
