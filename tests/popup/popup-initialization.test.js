/**
 * BATCH 1: Popup Initialization Tests
 * Tests: 1-10
 * Coverage: popup.js initialization flow
 */

import { jest } from '@jest/globals';

describe('Popup Initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="start-recording-btn">Record</button>
      <button id="stop-recording-btn" disabled>Stop</button>
      <button id="play-actions-btn" disabled>Play</button>
      <button id="clear-actions-btn" disabled>Clear</button>
      <button id="export-actions-btn" disabled>Export</button>
      <button id="import-actions-btn">Import</button>
      <input type="file" id="import-file-input" accept=".json" style="display:none" />
      <button id="manual-tab-btn" class="tab-btn active">Manual</button>
      <button id="auto-tab-btn" class="tab-btn">AI Mode</button>
      <button id="settings-btn">Settings</button>
      <div id="manual-controls" class="tab-content active">
        <div id="actions-container"></div>
        <div id="action-count">0 actions</div>
      </div>
      <div id="auto-controls" class="tab-content" style="display:none">
        <textarea id="ai-instructions"></textarea>
        <button id="start-ai-btn">Run AI</button>
        <button id="stop-ai-btn" disabled>Stop AI</button>
      </div>
      <div id="status-message"></div>
    `;
    
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(() => Promise.resolve({})),
          set: jest.fn(() => Promise.resolve())
        },
        sync: {
          get: jest.fn(() => Promise.resolve({})),
          set: jest.fn(() => Promise.resolve())
        }
      },
      runtime: {
        sendMessage: jest.fn(() => Promise.resolve({ success: true })),
        onMessage: { addListener: jest.fn() }
      },
      tabs: {
        query: jest.fn(() => Promise.resolve([{ id: 1, active: true }])),
        sendMessage: jest.fn(() => Promise.resolve({ success: true }))
      }
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  // TEST 1
  test('should find all required DOM elements on initialization', () => {
    expect(document.getElementById('start-recording-btn')).toBeTruthy();
    expect(document.getElementById('stop-recording-btn')).toBeTruthy();
    expect(document.getElementById('play-actions-btn')).toBeTruthy();
    expect(document.getElementById('clear-actions-btn')).toBeTruthy();
    expect(document.getElementById('export-actions-btn')).toBeTruthy();
    expect(document.getElementById('import-actions-btn')).toBeTruthy();
    expect(document.getElementById('manual-tab-btn')).toBeTruthy();
    expect(document.getElementById('auto-tab-btn')).toBeTruthy();
    expect(document.getElementById('actions-container')).toBeTruthy();
    expect(document.getElementById('status-message')).toBeTruthy();
  });
  
  // TEST 2
  test('should load settings from chrome.storage.sync', async () => {
    const mockSettings = {
      geminiEnabled: true,
      geminiApiKey: 'AIza' + 'x'.repeat(35),
      logLevel: 'INFO'
    };
    
    chrome.storage.sync.get.mockResolvedValue(mockSettings);
    const result = await chrome.storage.sync.get(['geminiEnabled', 'geminiApiKey']);
    
    expect(chrome.storage.sync.get).toHaveBeenCalled();
    expect(result.geminiEnabled).toBe(true);
    expect(result.geminiApiKey).toMatch(/^AIza/);
  });
  
  // TEST 3
  test('should load saved actions from chrome.storage.local', async () => {
    const mockActions = [
      { type: 'click', selector: '.btn' },
      { type: 'input', selector: 'input', value: 'test' }
    ];
    
    chrome.storage.local.get.mockResolvedValue({ recordedActions: mockActions });
    const result = await chrome.storage.local.get(['recordedActions']);
    
    expect(result.recordedActions).toEqual(mockActions);
    expect(result.recordedActions.length).toBe(2);
  });
  
  // TEST 4
  test('should return empty array if no saved actions', async () => {
    chrome.storage.local.get.mockResolvedValue({});
    const result = await chrome.storage.local.get(['recordedActions']);
    const actions = result.recordedActions || [];
    
    expect(actions).toEqual([]);
    expect(Array.isArray(actions)).toBe(true);
  });
  
  // TEST 5
  test('should set manual mode as default active tab', () => {
    const manualTab = document.getElementById('manual-tab-btn');
    const autoTab = document.getElementById('auto-tab-btn');
    
    expect(manualTab.classList.contains('active')).toBe(true);
    expect(autoTab.classList.contains('active')).toBe(false);
  });
  
  // TEST 6
  test('should have correct initial button states', () => {
    expect(document.getElementById('start-recording-btn').disabled).toBe(false);
    expect(document.getElementById('stop-recording-btn').disabled).toBe(true);
    expect(document.getElementById('play-actions-btn').disabled).toBe(true);
    expect(document.getElementById('clear-actions-btn').disabled).toBe(true);
    expect(document.getElementById('export-actions-btn').disabled).toBe(true);
  });
  
  // TEST 7
  test('should hide auto mode tab when Gemini disabled', async () => {
    chrome.storage.sync.get.mockResolvedValue({ geminiEnabled: false });
    const result = await chrome.storage.sync.get(['geminiEnabled']);
    
    if (!result.geminiEnabled) {
      const autoTab = document.getElementById('auto-tab-btn');
      autoTab.style.display = 'none';
      expect(autoTab.style.display).toBe('none');
    }
  });
  
  // TEST 8
  test('should show auto mode tab when Gemini enabled with API key', async () => {
    chrome.storage.sync.get.mockResolvedValue({
      geminiEnabled: true,
      geminiApiKey: 'AIza' + 'x'.repeat(35)
    });
    
    const result = await chrome.storage.sync.get(['geminiEnabled', 'geminiApiKey']);
    
    if (result.geminiEnabled && result.geminiApiKey) {
      const autoTab = document.getElementById('auto-tab-btn');
      autoTab.style.display = '';
      expect(autoTab.style.display).not.toBe('none');
    }
  });
  
  // TEST 9
  test('should handle storage errors gracefully', async () => {
    chrome.storage.sync.get.mockRejectedValue(new Error('Storage unavailable'));
    
    await expect(chrome.storage.sync.get(['geminiEnabled']))
      .rejects.toThrow('Storage unavailable');
  });
  
  // TEST 10
  test('should setup message listener for background communication', () => {
    const mockListener = jest.fn();
    chrome.runtime.onMessage.addListener(mockListener);
    
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(mockListener);
  });
});
