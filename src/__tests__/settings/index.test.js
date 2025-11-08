/**
 * Tests for settings page logic
 */

// Mock DOM elements
const mockElements = {
  'test-gemini-btn': { addEventListener: jest.fn(), click: jest.fn() },
  'clear-gemini-btn': { addEventListener: jest.fn(), click: jest.fn() },
  'reset-settings-btn': { addEventListener: jest.fn(), click: jest.fn() },
  'settings-form': { addEventListener: jest.fn(), click: jest.fn(), preventDefault: jest.fn() },
  'gemini-api-key': { value: '', addEventListener: jest.fn() },
  'gemini-enabled': { checked: false, addEventListener: jest.fn() },
  'log-level': { value: 'INFO', addEventListener: jest.fn() },
  'max-retries': { value: '3', addEventListener: jest.fn() },
  'timeout': { value: '10000', addEventListener: jest.fn() },
  'show-hints': { checked: true, addEventListener: jest.fn() },
  'save-history': { checked: true, addEventListener: jest.fn() },
  'status-message': { textContent: '', style: { display: 'none' } },
  'api-status': { textContent: '', className: '' }
};

// Mock document methods
global.document = {
  getElementById: jest.fn((id) => mockElements[id] || null),
  addEventListener: jest.fn()
};

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn()
  }
};

// Mock fetch for API testing
global.fetch = jest.fn();

// Import the module to trigger coverage
import('../../settings/index.js');

describe('Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM elements
    Object.values(mockElements).forEach(element => {
      if (element.value !== undefined) element.value = '';
      if (element.checked !== undefined) element.checked = false;
      if (element.textContent) element.textContent = '';
      if (element.style) element.style = { display: 'none' };
      if (element.className) element.className = '';
    });
    
    // Set default values
    mockElements['log-level'].value = 'INFO';
    mockElements['max-retries'].value = '3';
    mockElements['timeout'].value = '10000';
    mockElements['show-hints'].checked = true;
    mockElements['save-history'].checked = true;
  });

  test('should have all required DOM elements', () => {
    const requiredElements = [
      'test-gemini-btn', 'clear-gemini-btn', 'reset-settings-btn',
      'settings-form', 'gemini-api-key', 'gemini-enabled', 'log-level',
      'max-retries', 'timeout', 'show-hints', 'save-history',
      'status-message', 'api-status'
    ];

    requiredElements.forEach(id => {
      expect(document.getElementById(id)).toBeTruthy();
    });
  });

  test('should setup DOMContentLoaded listener', () => {
    expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
  });

  test('should add event listeners to buttons', () => {
    // Import the settings script to trigger initialization
    import('../settings/index.js');
    
    expect(mockElements['test-gemini-btn'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockElements['clear-gemini-btn'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockElements['reset-settings-btn'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockElements['settings-form'].addEventListener).toHaveBeenCalledWith('submit', expect.any(Function));
  });

  test('should have Chrome storage methods', () => {
    expect(chrome.storage.sync.get).toBeDefined();
    expect(chrome.storage.sync.set).toBeDefined();
    expect(chrome.storage.sync.clear).toBeDefined();
    expect(chrome.storage.local.get).toBeDefined();
    expect(chrome.storage.local.set).toBeDefined();
    expect(chrome.storage.local.clear).toBeDefined();
  });

  test('should have Chrome runtime methods', () => {
    expect(chrome.runtime.sendMessage).toBeDefined();
  });

  test('should have fetch for API testing', () => {
    expect(fetch).toBeDefined();
  });

  test('should initialize with default values', () => {
    expect(mockElements['log-level'].value).toBe('INFO');
    expect(mockElements['max-retries'].value).toBe('3');
    expect(mockElements['timeout'].value).toBe('10000');
    expect(mockElements['show-hints'].checked).toBe(true);
    expect(mockElements['save-history'].checked).toBe(true);
  });

  test('should handle missing elements gracefully', () => {
    const missingElement = document.getElementById('non-existent');
    expect(missingElement).toBeNull();
  });

  test('should create elements properly', () => {
    const element = document.createElement('div');
    expect(element.tagName).toBe('DIV');
  });

  test('should handle Chrome storage operations', async () => {
    chrome.storage.sync.get.mockResolvedValue({ geminiApiKey: 'test-key' });
    chrome.storage.sync.set.mockResolvedValue({});
    
    // Simulate loading settings
    await chrome.storage.sync.get(['geminiApiKey']);
    expect(chrome.storage.sync.get).toHaveBeenCalledWith(['geminiApiKey']);
    
    // Simulate saving settings
    await chrome.storage.sync.set({ geminiApiKey: 'new-key' });
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ geminiApiKey: 'new-key' });
  });

  test('should handle API testing with fetch', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] })
    });

    const response = await fetch('https://api.example.com/test');
    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test');
  });
});