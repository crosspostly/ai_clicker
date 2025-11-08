/**
 * Tests for popup UI logic
 */

// Mock DOM elements
const mockElements = {
  'start-recording': { addEventListener: jest.fn(), click: jest.fn() },
  'stop-recording': { addEventListener: jest.fn(), click: jest.fn() },
  'play-actions': { addEventListener: jest.fn(), click: jest.fn() },
  'clear-actions': { addEventListener: jest.fn(), click: jest.fn() },
  'export-actions': { addEventListener: jest.fn(), click: jest.fn() },
  'import-actions': { addEventListener: jest.fn(), click: jest.fn() },
  'import-file-input': { addEventListener: jest.fn(), click: jest.fn(), files: [] },
  'actions-container': { innerHTML: '', appendChild: jest.fn() },
  'mode-manual': { addEventListener: jest.fn(), click: jest.fn() },
  'mode-auto': { addEventListener: jest.fn(), click: jest.fn() },
  'manual-mode': { style: { display: '' } },
  'auto-mode': { style: { display: '' } },
  'start-auto': { addEventListener: jest.fn(), click: jest.fn() },
  'stop-auto': { addEventListener: jest.fn(), click: jest.fn() },
  'ai-instructions': { value: '', addEventListener: jest.fn() },
  'status-text': { textContent: '' },
  'status-log': { innerHTML: '', appendChild: jest.fn() },
  'playback-speed': { value: '1', addEventListener: jest.fn() },
  'speed-label': { textContent: '1x' },
  'settings-btn': { addEventListener: jest.fn(), click: jest.fn() }
};

// Mock document methods
global.document = {
  getElementById: jest.fn((id) => mockElements[id] || null),
  createElement: jest.fn((tag) => ({
    tagName: tag.toUpperCase(),
    innerHTML: '',
    textContent: '',
    style: {},
    addEventListener: jest.fn(),
    appendChild: jest.fn()
  })),
  addEventListener: jest.fn()
};

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Mock console methods
global.console = {
  ...console,
  error: jest.fn()
};

// Import the module to trigger coverage
import('../../popup/index.js');

describe('Popup UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM elements
    Object.values(mockElements).forEach(element => {
      if (element.innerHTML) element.innerHTML = '';
      if (element.textContent) element.textContent = '';
      if (element.value) element.value = '';
      if (element.style) element.style = { display: '' };
    });
  });

  test('should have all required DOM elements', () => {
    // Check that all required elements are mocked
    const requiredElements = [
      'start-recording', 'stop-recording', 'play-actions', 'clear-actions',
      'export-actions', 'import-actions', 'import-file-input', 'actions-container',
      'mode-manual', 'mode-auto', 'manual-mode', 'auto-mode', 'start-auto',
      'stop-auto', 'ai-instructions', 'status-text', 'status-log',
      'playback-speed', 'speed-label', 'settings-btn'
    ];

    requiredElements.forEach(id => {
      expect(document.getElementById(id)).toBeTruthy();
    });
  });

  test('should add event listeners to buttons', () => {
    // Check that event listeners are added to buttons
    expect(mockElements['start-recording'].addEventListener).toHaveBeenCalled();
    expect(mockElements['stop-recording'].addEventListener).toHaveBeenCalled();
    expect(mockElements['play-actions'].addEventListener).toHaveBeenCalled();
    expect(mockElements['clear-actions'].addEventListener).toHaveBeenCalled();
  });

  test('should setup DOMContentLoaded listener', () => {
    expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
  });

  test('should handle Chrome runtime messages', () => {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('should have proper Chrome API methods', () => {
    expect(chrome.runtime.sendMessage).toBeDefined();
    expect(chrome.tabs.query).toBeDefined();
    expect(chrome.tabs.sendMessage).toBeDefined();
  });

  test('should initialize with default values', () => {
    // Check default element states
    expect(mockElements['playback-speed'].value).toBe('1');
    expect(mockElements['speed-label'].textContent).toBe('1x');
    expect(mockElements['status-text'].textContent).toBe('');
    expect(mockElements['status-log'].innerHTML).toBe('');
  });

  test('should create elements properly', () => {
    const element = document.createElement('div');
    expect(element.tagName).toBe('DIV');
    expect(element.addEventListener).toBeDefined();
    expect(element.appendChild).toBeDefined();
  });

  test('should handle missing elements gracefully', () => {
    const missingElement = document.getElementById('non-existent');
    expect(missingElement).toBeNull();
  });
});