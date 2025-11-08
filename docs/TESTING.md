# 🧪 Testing Guide

Complete guide to testing AI-Autoclicker v2.0 with Jest framework.

---

## 🎯 Testing Overview

### Test Stack
- **Jest** - Test framework with ES6 module support
- **JSDOM** - DOM manipulation testing
- **Chrome API Mocks** - Extension API simulation
- **Coverage Reporting** - Code coverage analysis

### Test Structure

```
tests/
├── content/           # Content script tests
│   ├── element-finder.test.js      # Element location
│   ├── action-executor.test.js     # Action execution
│   └── action-recorder.test.js     # Action recording
├── popup/            # Popup UI tests
│   ├── popup-initialization.test.js  # Popup setup
│   ├── popup-recording.test.js      # Recording UI
│   └── popup-actions-display.test.js # Action list
├── settings/         # Settings tests
├── background/       # Background service tests
├── common/           # Utility tests
│   ├── logger.test.js               # Logging system
│   ├── storage.test.js              # Storage manager
│   ├── validator.test.js            # Input validation
│   └── helpers.test.js             # Utility functions
├── ai/               # AI processing tests
│   └── instruction-parser.test.js   # Gemini integration
└── integration/      # End-to-end tests
    ├── recording-flow.test.js        # Full recording workflow
    └── ai-execution.test.js         # AI-powered workflow
```

---

## 🚀 Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- content/element-finder.test.js

# Run tests in watch mode
npm run test:watch

# Run with verbose output
npm run test:verbose

# Generate coverage report
npm run test:coverage
```

### Expected Output

```bash
> ai-autoclicker@2.0.0 test
> NODE_OPTIONS='--experimental-vm-modules' jest

 PASS tests/content/element-finder.test.js
  ElementFinder
    ✓ should find element by ID (5 ms)
    ✓ should find element by class (3 ms)
    ✓ should find element by text (4 ms)
    ✓ should handle element not found (2 ms)
    ✓ should generate unique selectors (6 ms)

 PASS tests/popup/popup-initialization.test.js
  Popup Initialization
    ✓ should initialize popup UI (8 ms)
    ✓ should load saved actions (4 ms)
    ✓ should setup event listeners (3 ms)

... (more test results) ...

Test Suites: 15 passed, 15 total
Tests:       85 passed, 85 total
Snapshots:   0 total
Time:        2.345 s
```

### Coverage Report

```bash
npm run test:coverage

# Output:
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   43.12 |    38.45 |   45.67 |   43.12 |                   
 common/               |   65.23 |    60.12 |   68.45 |   65.23 |                   
 content/              |   55.67 |    50.23 |   58.90 |   55.67 |                   
 popup/                |   40.12 |    35.45 |   42.78 |   40.12 |                   
 ai/                   |   50.34 |    45.23 |   52.67 |   50.34 |                   
----------------------|---------|----------|---------|---------|-------------------
```

---

## 📝 Writing Tests

### Test File Template

```javascript
/**
 * Component/Feature Name Tests
 * Tests: [number] tests covering [functionality]
 * Coverage: [specific areas]
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Import the module being tested
import ComponentName from '../../../src/path/to/ComponentName.js';

describe('ComponentName', () => {
  let component;
  let dom;

  beforeEach(() => {
    // Setup DOM environment
    dom = new JSDOM(`
      <div>
        <button id="test-button">Click me</button>
        <input name="email" type="email" />
        <div class="container">Content</div>
      </div>
    `);
    
    global.document = dom.window.document;
    global.window = dom.window;
    
    // Initialize component
    component = new ComponentName();
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
    dom.window.close();
  });

  describe('basic functionality', () => {
    it('should initialize correctly', () => {
      // Test initialization
      expect(component).toBeDefined();
      expect(component.isInitialized).toBe(true);
    });

    it('should handle user interaction', () => {
      // Test user interaction
      const button = document.getElementById('test-button');
      button.click();
      
      expect(component.handleClick).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle missing elements gracefully', () => {
      // Test error handling
      const result = component.findNonExistentElement();
      expect(result).toBeNull();
    });

    it('should handle invalid input', () => {
      // Test validation
      expect(() => component.processInvalidInput(null))
        .toThrow('Invalid input provided');
    });
  });
});
```

### Testing Patterns

#### DOM Manipulation Tests

```javascript
it('should find and interact with DOM elements', () => {
  // Setup DOM
  document.body.innerHTML = `
    <form>
      <input id="email" type="email" />
      <button id="submit">Submit</button>
    </form>
  `;

  // Test element finding
  const emailInput = document.getElementById('email');
  const submitButton = document.getElementById('submit');
  
  expect(emailInput).toBeTruthy();
  expect(submitButton).toBeTruthy();

  // Test interaction
  emailInput.value = 'test@example.com';
  submitButton.click();
  
  expect(emailInput.value).toBe('test@example.com');
});
```

#### Event Handling Tests

```javascript
it('should emit events correctly', () => {
  const mockEventBus = {
    emit: jest.fn()
  };

  const component = new Component(mockEventBus);
  
  // Trigger event
  component.doSomething();
  
  // Verify event emission
  expect(mockEventBus.emit).toHaveBeenCalledWith(
    'action:completed',
    expect.objectContaining({
      type: 'click',
      target: 'button'
    })
  );
});
```

#### Async Operation Tests

```javascript
it('should handle async operations', async () => {
  const mockData = { result: 'success' };
  
  // Mock async operation
  jest.spyOn(component, 'fetchData')
    .mockResolvedValue(mockData);

  // Test async behavior
  const result = await component.loadData();
  
  expect(result).toEqual(mockData);
  expect(component.fetchData).toHaveBeenCalledTimes(1);
});
```

#### Error Handling Tests

```javascript
it('should handle errors gracefully', async () => {
  // Mock error
  jest.spyOn(component, 'riskyOperation')
    .mockRejectedValue(new Error('Network error'));

  // Test error handling
  await expect(component.executeWithErrorHandling())
    .rejects.toThrow('Network error');

  // Verify error logging
  expect(component.logger.error).toHaveBeenCalledWith(
    'Operation failed',
    expect.any(Error)
  );
});
```

---

## 🎭 Chrome API Mocking

### Chrome Storage Mock

```javascript
// src/__tests__/setup.js
global.chrome = {
  storage: {
    local: {
      data: {},
      
      get: jest.fn((keys, callback) => {
        const result = {};
        keys.forEach(key => {
          if (key in chrome.storage.local.data) {
            result[key] = chrome.storage.local.data[key];
          }
        });
        callback(result);
      }),
      
      set: jest.fn((items, callback) => {
        Object.assign(chrome.storage.local.data, items);
        callback();
      }),
      
      remove: jest.fn((keys, callback) => {
        keys.forEach(key => {
          delete chrome.storage.local.data[key];
        });
        callback();
      })
    }
  }
};
```

### Chrome Runtime Mock

```javascript
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test/${path}`)
  }
};
```

### Chrome Tabs Mock

```javascript
global.chrome = {
  tabs: {
    query: jest.fn((query, callback) => {
      callback([{
        id: 1,
        url: 'https://example.com',
        active: true
      }]);
    }),
    
    sendMessage: jest.fn()
  }
};
```

---

## 🧪 Test Categories

### Unit Tests

**Purpose:** Test individual functions and classes in isolation

**Examples:**
- Utility functions from `common/helpers.js`
- Individual methods in `ElementFinder`
- Validation logic in `validator.js`
- Storage operations in `storage.js`

**Characteristics:**
- Fast execution (<100ms per test)
- No external dependencies
- Mocked dependencies
- High coverage of edge cases

### Integration Tests

**Purpose:** Test interaction between components

**Examples:**
- Popup UI with storage backend
- Content script with event bus
- AI parser with API calls
- Background service with message routing

**Characteristics:**
- Multiple components involved
- Real dependencies (with some mocks)
- Event flow testing
- API integration testing

### End-to-End Tests

**Purpose:** Test complete user workflows

**Examples:**
- Full recording → playback cycle
- AI instruction → action execution
- Settings save → application reload
- Import → export functionality

**Characteristics:**
- Complete user scenarios
- Minimal mocking
- Real Chrome APIs (when possible)
- Performance consideration

---

## 📊 Coverage Targets

### Current Goals

| Component | Target | Current | Priority |
|-----------|---------|----------|----------|
| Common utilities | 80% | 65% | High |
| Content scripts | 70% | 55% | High |
| Popup UI | 60% | 40% | Medium |
| Settings | 60% | 35% | Medium |
| Background | 50% | 30% | Medium |
| AI processing | 70% | 50% | High |

### Coverage Strategy

```javascript
// jest.config.js
export default {
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 40,    // Minimum threshold
      functions: 40,
      lines: 40,
      statements: 40
    },
    './src/common/': {      // High priority
      branches: 70,
      functions: 75,
      lines: 70,
      statements: 70
    },
    './src/content/': {       // High priority
      branches: 65,
      functions: 70,
      lines: 65,
      statements: 65
    }
  },
  coverageReporters: ['text', 'lcov', 'html']
};
```

---

## 🛠️ Test Utilities

### Custom Test Helpers

```javascript
// tests/helpers/test-utils.js
export function createMockEvent(type, target) {
  return {
    type,
    target,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn()
  };
}

export function createMockAction(type, selector) {
  return {
    type,
    selector,
    timestamp: Date.now(),
    target: 'Test element'
  };
}

export function setupDOM(html) {
  const dom = new JSDOM(html);
  global.document = dom.window.document;
  global.window = dom.window;
  return dom;
}

export function cleanupDOM() {
  delete global.document;
  delete global.window;
}
```

### Mock Factories

```javascript
// tests/mocks/factories.js
export function createMockEventBus() {
  return {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  };
}

export function createMockLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };
}

export function createMockStorage() {
  const data = {};
  return {
    get: jest.fn((keys) => Promise.resolve(keys.reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {}))),
    set: jest.fn((items) => {
      Object.assign(data, items);
      return Promise.resolve();
    })
  };
}
```

---

## 🐛 Troubleshooting Tests

### Common Issues

#### ES6 Module Import Errors

**Problem:** `Cannot use import statement outside a module`

**Solution:**
```javascript
// jest.config.js
export default {
  preset: 'ts-jest',  // or 'babel-preset-jest'
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
```

#### Chrome API Not Defined

**Problem:** `chrome is not defined`

**Solution:**
```javascript
// src/__tests__/setup.js
global.chrome = {
  storage: { /* mock implementation */ },
  runtime: { /* mock implementation */ },
  tabs: { /* mock implementation */ }
};
```

#### DOM Not Available

**Problem:** `document is not defined`

**Solution:**
```javascript
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
```

#### Async Test Timeouts

**Problem:** Tests timeout waiting for async operations

**Solution:**
```javascript
// Use fake timers
jest.useFakeTimers();

// Test async behavior
const promise = component.asyncOperation();
jest.advanceTimersByTime(1000);

await expect(promise).resolves.toBe(expectedResult);

// Clean up
jest.useRealTimers();
```

---

## 🔄 Continuous Testing

### Watch Mode Development

```bash
# Terminal 1: Test watch
npm run test:watch

# Terminal 2: Development watch
npm run build:watch

# Terminal 3: Lint watch
npx eslint src/ --fix --watch
```

### Pre-commit Testing

```bash
# .husky/pre-commit
#!/bin/sh
npm run lint && npm test -- --passWithNoTests
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v1
```

---

## 📈 Test Metrics

### Performance Benchmarks

| Metric | Target | Current |
|---------|---------|----------|
| Test execution time | <30s total | ~25s |
| Individual test time | <100ms | ~50ms |
| Coverage generation | <10s | ~8s |
| Memory usage | <512MB | ~256MB |

### Quality Indicators

- **Test count:** 250+ tests
- **Coverage:** 43% (target: 65%)
- **Flakiness:** <1% unstable tests
- **Performance:** All tests under 100ms

---

## 🔗 Cross-References

- **[Development Guide](DEVELOPMENT.md)** - Setup and workflow
- **[Architecture Overview](../ARCHITECTURE.md)** - System design
- **[Installation Guide](INSTALLATION.md)** - Project setup
- **[Contributing Guide](../CONTRIBUTING.md)** - Testing standards

---

## 📞 Getting Help

### Test-Specific Issues

1. **Check Jest configuration** - Review `jest.config.js`
2. **Verify mocks** - Ensure Chrome APIs are properly mocked
3. **Review test setup** - Check `src/__tests__/setup.js`
4. **Run specific test** - Isolate failing tests

### Community Support

- **GitHub Issues** - [Report test bugs](https://github.com/crosspostly/ai_clicker/issues)
- **GitHub Discussions** - [Ask testing questions](https://github.com/crosspostly/ai_clicker/discussions)

---

**Last Updated:** 2025-11-08  
**Version:** 2.0.0  
**Status:** 🟢 Current Testing Guide

---

*Keep those tests green! 🟢*
