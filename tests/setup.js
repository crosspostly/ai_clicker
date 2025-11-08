/**
 * Jest setup file for tests/ directory
 * Configures test environment and mocks for tests/ directory
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
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: { href: 'http://localhost' },
  scroll: jest.fn(),
  scrollTo: jest.fn(),
};

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Blob for file operations
global.Blob = jest.fn(function(content, options) {
  this.content = content;
  this.type = options ? options.type : '';
});

// Mock URL for blob URLs
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
};

// Mock File for file operations
global.File = jest.fn(function(content, name, options) {
  this.content = content;
  this.name = name;
  this.type = options ? options.type : '';
});

// Mock XPath APIs
global.XPathResult = {
  ORDERED_NODE_SNAPSHOT_TYPE: 7,
  ANY_UNORDERED_NODE_TYPE: 8,
};

global.XPathEvaluator = class {
  evaluate() {
    return {
      snapshotLength: 0,
      snapshotItem: jest.fn(),
    };
  }
};

// Setup test timeout
jest.setTimeout(10000);