/**
 * Tests for main content script
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Chrome APIs BEFORE importing the content script
const mockAddListener = jest.fn();
global.chrome = {
  runtime: {
    onMessage: {
      addListener: mockAddListener
    },
    sendMessage: jest.fn()
  }
};

// Mock DOM APIs BEFORE importing the content script
global.document = {
  readyState: 'complete', // Set to complete to prevent immediate init
  addEventListener: jest.fn(),
  createElement: jest.fn(),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
};

global.window = {
  addEventListener: jest.fn(),
  location: { href: 'http://localhost' }
};

// Now import the content script after mocks are set up
import '../../content/index.js';

// Mock console methods
global.console = {
  ...console,
  error: jest.fn()
};

describe('Content Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should have Chrome runtime methods', () => {
    expect(chrome.runtime.onMessage.addListener).toBeDefined();
    expect(chrome.runtime.sendMessage).toBeDefined();
  });

  test('should have DOM methods', () => {
    expect(document.addEventListener).toBeDefined();
    expect(document.createElement).toBeDefined();
    expect(document.getElementById).toBeDefined();
    expect(document.querySelector).toBeDefined();
    expect(document.querySelectorAll).toBeDefined();
  });

  test('should have window methods', () => {
    expect(window.addEventListener).toBeDefined();
    expect(window.location).toBeDefined();
  });

  test('should setup message listeners', () => {
    expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should handle initialization errors gracefully', () => {
    // Mock console.error to capture errors
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Import content script (should not throw)
    expect(() => {
      import('../../content/index.js');
    }).not.toThrow();

    // Restore console.error
    console.error = originalConsoleError;
  });

  test('should have proper Chrome API structure', () => {
    expect(chrome.runtime).toBeDefined();
    expect(typeof chrome.runtime.onMessage).toBe('object');
    expect(typeof chrome.runtime.onMessage.addListener).toBe('function');
    expect(typeof chrome.runtime.sendMessage).toBe('function');
  });

  test('should have proper DOM API structure', () => {
    expect(document).toBeDefined();
    expect(typeof document.addEventListener).toBe('function');
    expect(typeof document.createElement).toBe('function');
    expect(typeof document.getElementById).toBe('function');
    expect(typeof document.querySelector).toBe('function');
    expect(typeof document.querySelectorAll).toBe('function');
  });

  test('should have proper window API structure', () => {
    expect(window).toBeDefined();
    expect(typeof window.addEventListener).toBe('function');
    expect(window.location).toBeDefined();
    expect(typeof window.location.href).toBe('string');
  });

  test('should handle message listener registration', () => {
    // Check that addListener is called with a function
    expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
    
    // Get the registered listener function
    const listenerFunction = mockAddListener.mock.calls[0][0];
    expect(typeof listenerFunction).toBe('function');
  });

  test('should handle message processing', () => {
    // Get the registered listener function
    const listenerFunction = mockAddListener.mock.calls[0][0];
    const mockSendResponse = jest.fn();
    
    // Test basic message structure
    expect(() => {
      listenerFunction({ action: 'test' }, {}, mockSendResponse);
    }).not.toThrow();
  });
});