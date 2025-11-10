# Testing Guide

This guide covers the comprehensive testing strategy for AI Autoclicker v3.0.0, including unit tests, integration tests, E2E tests, and CI/CD automation.

## Overview

The testing suite ensures reliability, performance, and maintainability of the AI Autoclicker extension. With 78+ tests and 75%+ coverage, we verify functionality across all major components.

## Test Structure

```
tests/
├── services/              # Service layer tests
│   ├── voiceControl.test.js
│   ├── playbackEngine.test.js
│   ├── settingsSystem.test.js
│   ├── geminiLive.test.js
│   ├── settingsValidator.test.js
│   └── storageService.test.js
├── integration/           # Integration tests
│   ├── voicePlaybackIntegration.test.js
│   ├── endToEndVoicePlayback.test.js
│   └── messageArchitecture.test.js
├── ui/                   # UI tests
│   └── settingsPanels.test.js
├── content/              # Content script tests
│   ├── element-finder.test.js
│   ├── action-executor.test.js
│   └── playbackRenderer.test.js
├── popup/                # Popup tests
│   └── popup-initialization.test.js
├── background/           # Background script tests
│   └── background-handler.test.js
└── __tests__/           # Additional component tests
    ├── settings/
    ├── import-export/
    └── content/
```

## Test Categories

### 1. Unit Tests (45 tests)
Test individual components and functions in isolation.

#### Voice Control Tests (15 tests)
- **File**: `tests/services/voiceControl.test.js`
- **Coverage**: Web Audio API, Gemini Live streaming, command parsing, fallback chains, multi-language

```javascript
describe('Voice Control', () => {
  test('should initialize with API key', async () => {
    const result = await geminiLiveService.initialize('test-api-key');
    expect(result.success).toBe(true);
  });
  
  test('should handle streaming audio data', async () => {
    const audioData = new Uint8Array([1, 2, 3, 4]);
    const result = await geminiLiveService.streamAudio(audioData);
    expect(result.transcription).toBeDefined();
  });
});
```

#### Settings Tests (12 tests)
- **File**: `tests/services/settingsSystem.test.js`
- **Coverage**: Chrome storage sync, validation, import/export, theme support, persistence

```javascript
describe('Settings System', () => {
  test('should save settings to sync storage', async () => {
    const settings = { theme: 'dark' };
    const result = await storageService.saveSettings(settings);
    expect(result.success).toBe(true);
  });
  
  test('should validate API key format', () => {
    const result = settingsValidator.validateApiKey('AIzaSyValidKey');
    expect(result.isValid).toBe(true);
  });
});
```

#### Playback Tests (18 tests)
- **File**: `tests/services/playbackEngine.test.js`
- **Coverage**: Audio playback, UI animations, state management, error recovery, cleanup

```javascript
describe('Playback Engine', () => {
  test('should execute click action successfully', async () => {
    const actions = [{ type: 'click', selector: '#button' }];
    const result = await playbackEngine.replay(actions);
    expect(result.success).toBe(true);
  });
  
  test('should handle pause and resume', async () => {
    const actions = [{ type: 'click', selector: '#button' }];
    const promise = playbackEngine.replay(actions);
    await playbackEngine.pause();
    await playbackEngine.resume();
    const result = await promise;
    expect(result.success).toBe(true);
  });
});
```

### 2. Integration Tests (27 tests)
Test interactions between components and systems.

#### Message Architecture Tests (12 tests)
- **File**: `tests/integration/messageArchitecture.test.js`
- **Coverage**: Popup ↔ Background ↔ Content relay, async handling, error propagation

```javascript
describe('Message Architecture', () => {
  test('should relay messages from popup to content script', async () => {
    const message = { target: 'content', type: 'GET_ELEMENT_INFO' };
    const response = await backgroundHandler(message);
    expect(response.success).toBe(true);
  });
});
```

#### Voice-Playback Integration Tests (15 tests)
- **File**: `tests/integration/voicePlaybackIntegration.test.js`
- **Coverage**: End-to-end voice → command → action → playback flows, state consistency, cleanup

```javascript
describe('Voice-Playback Integration', () => {
  test('should convert voice command to action', () => {
    const voiceCommand = { command: { type: 'click', target: 'button' } };
    const action = integration.voiceCommandToAction(voiceCommand);
    expect(action.type).toBe('click');
  });
  
  test('should execute voice command through playback', async () => {
    const result = await integration.executeVoiceCommand(voiceCommand);
    expect(result.success).toBe(true);
  });
});
```

### 3. UI Tests (6 tests)
Test user interface interactions and visual feedback.

#### Settings Panels Tests (6 tests)
- **File**: `tests/ui/settingsPanels.test.js`
- **Coverage**: Settings panels, tabs, modal interactions, keyboard shortcuts

```javascript
describe('Settings Panels UI', () => {
  test('should switch tabs when clicking tab buttons', () => {
    const voiceTab = document.querySelector('[data-tab="voice"]');
    voiceTab.click();
    expect(document.getElementById('voice-tab').classList.contains('active')).toBe(true);
  });
});
```

## Running Tests

### Local Development

#### Install Dependencies
```bash
npm install
```

#### Run All Tests
```bash
npm test
```

#### Run Tests with Coverage
```bash
npm run test:coverage
```

#### Run Tests in Watch Mode
```bash
npm run test:watch
```

#### Run Specific Test File
```bash
npm test -- tests/services/voiceControl.test.js
```

#### Run Tests by Pattern
```bash
npm test -- --testNamePattern="Voice Control"
```

### CI/CD Testing

#### GitHub Actions
Tests run automatically on:
- Pull requests to release branch
- Pushes to release branch
- Tag creation for releases

#### Test Matrix
- Node.js versions: 18, 20
- Operating systems: Ubuntu, Windows, macOS
- Browsers: Chrome (headless)

#### Test Stages
1. **Lint**: ESLint validation
2. **Test**: Unit and integration tests
3. **Build**: Extension build verification
4. **Security**: Security audit and API key check
5. **Coverage**: Coverage threshold validation
6. **Integration**: End-to-end integration tests

## Test Configuration

### Jest Configuration
```javascript
// jest.config.cjs
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
```

### Test Setup
```javascript
// tests/setup.js
import { TextEncoder, TextDecoder } from 'util';
import { JSDOM } from 'jsdom';

// Setup DOM
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() },
    getManifest: jest.fn()
  },
  storage: {
    sync: { get: jest.fn(), set: jest.fn() },
    local: { get: jest.fn(), set: jest.fn() }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
```

## Mocking Strategy

### Chrome APIs
```javascript
// Mock Chrome runtime
const mockChrome = {
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

global.chrome = mockChrome;
```

### Web Audio API
```javascript
// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn(),
  createScriptProcessor: jest.fn(),
  sampleRate: 44100
}));

global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(),
  pause: jest.fn()
}));
```

### DOM APIs
```javascript
// Mock DOM elements
global.document.createElement = jest.fn().mockReturnValue({
  style: {},
  classList: { add: jest.fn(), remove: jest.fn() },
  addEventListener: jest.fn()
});
```

## Coverage Requirements

### Thresholds
- **Branches**: 75%
- **Functions**: 75%
- **Lines**: 75%
- **Statements**: 75%

### Coverage Reports
Coverage reports are generated in multiple formats:
- HTML: `coverage/lcov-report/index.html`
- JSON: `coverage/coverage-final.json`
- LCOV: `coverage/lcov.info`

### Coverage Exclusions
```javascript
// jest.config.cjs
collectCoverageFrom: [
  'src/**/*.js',
  '!src/**/*.test.js',
  '!src/**/__tests__/**',
  '!src/rollup.config.js',
  '!src/build.js'
]
```

## Test Data Management

### Fixtures
Test data is organized in fixtures:

```javascript
// tests/fixtures/voiceCommands.js
export const voiceCommands = {
  click: {
    text: 'click the submit button',
    command: { type: 'click', target: 'submit button' }
  },
  input: {
    text: 'type hello world',
    command: { type: 'input', text: 'hello world' }
  }
};
```

### Test Utilities
Common test utilities:

```javascript
// tests/utils/testHelpers.js
export function createMockAction(type, options = {}) {
  return {
    type,
    selector: '#test-element',
    delay: 100,
    ...options
  };
}

export function createMockVoiceCommand(command) {
  return {
    type: 'VOICE_COMMAND',
    command,
    timestamp: Date.now(),
    model: 'gemini-2.0-flash-exp'
  };
}
```

## Performance Testing

### Load Testing
```javascript
describe('Performance Tests', () => {
  test('should handle large action sequences efficiently', async () => {
    const actions = Array(1000).fill().map((_, i) => ({
      type: 'click',
      selector: `#button${i}`,
      delay: 1
    }));
    
    const startTime = Date.now();
    const result = await playbackEngine.replay(actions);
    const endTime = Date.now();
    
    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(5000);
  });
});
```

### Memory Testing
```javascript
test('should not leak memory during extended usage', async () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Run many operations
  for (let i = 0; i < 1000; i++) {
    await playbackEngine.replay([{ type: 'click', selector: '#button' }]);
  }
  
  // Force garbage collection
  if (global.gc) global.gc();
  
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## E2E Testing

### Playwright Setup
```javascript
// tests/e2e/config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example
```javascript
// tests/e2e/voiceControl.spec.js
import { test, expect } from '@playwright/test';

test('should control extension with voice commands', async ({ page }) => {
  // Navigate to test page
  await page.goto('https://example.com');
  
  // Open extension popup
  await page.click('#extension-icon');
  
  // Start voice control
  await page.click('#start-voice');
  
  // Simulate voice command
  await page.evaluate(() => {
    window.testVoiceCommand('click the submit button');
  });
  
  // Verify action executed
  await expect(page.locator('#submit-button')).toHaveBeenClicked();
});
```

## Debugging Tests

### Debug Mode
Run tests with debugging:

```bash
# Node.js debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code debugging
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Test Logging
Enable detailed logging:

```javascript
// In test file
test('should log detailed information', () => {
  console.log('Starting test execution...');
  // Test logic
  console.log('Test completed successfully');
});
```

### Browser Testing
Test in real browser:

```javascript
// tests/browser/manual.test.js
describe('Manual Browser Tests', () => {
  test('should work in real browser environment', async () => {
    // Open browser manually and navigate to test page
    // Run test steps manually
    // Verify results
  });
});
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Quality Gates
Tests must pass before merge:
- All tests passing
- Coverage threshold met
- No linting errors
- Build successful
- Security scan passed

## Best Practices

### Test Organization
1. **Arrange, Act, Assert** pattern
2. Descriptive test names
3. Isolated test cases
4. Proper cleanup in `afterEach`
5. Mock external dependencies

### Test Data
1. Use fixtures for complex data
2. Generate dynamic test data
3. Avoid hardcoded values
4. Test edge cases
5. Include error scenarios

### Mock Strategy
1. Mock only external dependencies
2. Keep mocks simple
3. Verify mock interactions
4. Reset mocks between tests
5. Use realistic mock data

### Performance
1. Use `test.each` for similar tests
2. Avoid expensive setup operations
3. Run tests in parallel when possible
4. Use appropriate timeouts
5. Monitor test execution time

## Troubleshooting

### Common Issues

#### Tests Timing Out
```javascript
// Increase timeout for slow tests
test('slow test', async () => {
  // test logic
}, 10000); // 10 second timeout
```

#### Chrome API Mocks Not Working
```javascript
// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  global.chrome = createMockChrome();
});
```

#### DOM Tests Failing
```javascript
// Ensure DOM is properly set up
beforeEach(() => {
  document.body.innerHTML = '';
  // Setup DOM elements
});
```

#### Async Tests Not Completing
```javascript
// Use async/await properly
test('async test', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Debug Commands
```bash
# Run specific test with debugging
npm test -- --testNamePattern="specific test" --verbose

# Check coverage for specific file
npm run test:coverage -- tests/services/voiceControl.test.js

# Run tests in single thread (easier debugging)
npm test -- --runInBand
```

## Future Enhancements

### Planned Improvements
- Visual regression testing
- Accessibility testing
- Performance benchmarking
- Cross-browser compatibility testing
- Mobile browser testing

### Technical Improvements
- Parallel test execution
- Smart test selection based on changes
- Test result caching
- Enhanced mocking framework
- Better error reporting

---

**Testing Guide v3.0.0** - Comprehensive testing for reliable automation! 🧪