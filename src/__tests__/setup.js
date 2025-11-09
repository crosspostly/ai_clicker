/**
 * Jest setup file for AI-Autoclicker tests
 * Configures test environment and mocks
 */

import { jest } from '@jest/globals';

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path) => `chrome-extension://test/${path}`),
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
};

// Mock DOM APIs
global.document = {
  createElement: jest.fn(),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: { href: 'http://localhost' },
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock URL constructor
global.URL = class URL {
  constructor(url) {
    // Simple validation for common URL patterns
    if (typeof url !== 'string') {
      throw new TypeError('Invalid URL');
    }
    
    // Accept most URLs that start with http:// or https://
    // This is a simplified mock for testing - accept most valid patterns
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new TypeError('Invalid URL');
    }
    
    this.href = url;
  }
};

// Setup test timeout
jest.setTimeout(10000);