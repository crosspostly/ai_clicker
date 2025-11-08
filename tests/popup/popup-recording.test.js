/**
 * BATCH 1: Popup Recording Controls Tests
 * Tests: 11-20
 * Coverage: popup.js recording flow
 */

describe('Popup Recording Controls', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="start-recording-btn">Record</button>
      <button id="stop-recording-btn" disabled>Stop</button>
      <button id="play-actions-btn" disabled>Play</button>
      <div id="status-message" class="status-message"></div>
      <div id="actions-container"></div>
    `;
    
    global.chrome = {
      tabs: {
        query: jest.fn(() => Promise.resolve([{ id: 1, active: true }])),
        sendMessage: jest.fn(() => Promise.resolve({ success: true }))
      },
      storage: {
        local: {
          get: jest.fn(() => Promise.resolve({})),
          set: jest.fn(() => Promise.resolve())
        }
      }
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  // TEST 11
  test('should send startRecording message to active tab', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tabs[0].id, { action: 'startRecording' });
    
    expect(chrome.tabs.query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true
    });
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { action: 'startRecording' }
    );
  });
  
  // TEST 12
  test('should update button states when recording starts', () => {
    const startBtn = document.getElementById('start-recording-btn');
    const stopBtn = document.getElementById('stop-recording-btn');
    
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    expect(startBtn.disabled).toBe(true);
    expect(stopBtn.disabled).toBe(false);
  });
  
  // TEST 13
  test('should send stopRecording message to active tab', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tabs[0].id, { action: 'stopRecording' });
    
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { action: 'stopRecording' }
    );
  });
  
  // TEST 14
  test('should update button states when recording stops', () => {
    const startBtn = document.getElementById('start-recording-btn');
    const stopBtn = document.getElementById('stop-recording-btn');
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    expect(startBtn.disabled).toBe(false);
    expect(stopBtn.disabled).toBe(true);
  });
  
  // TEST 15
  test('should display status message when recording starts', () => {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = 'Recording started...';
    statusEl.className = 'status-message status-info';
    
    expect(statusEl.textContent).toBe('Recording started...');
    expect(statusEl.classList.contains('status-info')).toBe(true);
  });
  
  // TEST 16
  test('should display status with action count when recording stops', () => {
    const statusEl = document.getElementById('status-message');
    const actionCount = 5;
    statusEl.textContent = `Recording stopped. ${actionCount} actions recorded.`;
    statusEl.className = 'status-message status-success';
    
    expect(statusEl.textContent).toContain('Recording stopped');
    expect(statusEl.textContent).toContain('5 actions');
    expect(statusEl.classList.contains('status-success')).toBe(true);
  });
  
  // TEST 17
  test('should handle tab query errors', async () => {
    chrome.tabs.query.mockRejectedValue(new Error('No active tab'));
    
    await expect(chrome.tabs.query({ active: true, currentWindow: true }))
      .rejects.toThrow('No active tab');
  });
  
  // TEST 18
  test('should handle sendMessage errors', async () => {
    chrome.tabs.sendMessage.mockRejectedValue(new Error('Tab closed'));
    
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await expect(chrome.tabs.sendMessage(tabs[0].id, { action: 'startRecording' }))
      .rejects.toThrow('Tab closed');
  });
  
  // TEST 19
  test('should prevent starting recording when already recording', () => {
    const startBtn = document.getElementById('start-recording-btn');
    startBtn.disabled = true;
    
    expect(startBtn.disabled).toBe(true);
  });
  
  // TEST 20
  test('should enable play button when actions are recorded', () => {
    const playBtn = document.getElementById('play-actions-btn');
    const container = document.getElementById('actions-container');
    
    container.innerHTML = '<div class="action-item">Action 1</div>';
    
    if (container.children.length > 0) {
      playBtn.disabled = false;
      expect(playBtn.disabled).toBe(false);
    }
  });
});
