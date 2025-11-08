# 🛠️ Development Guide

Complete guide for developing AI-Autoclicker v2.0, from setup to contribution workflow.

---

## 🎯 Development Prerequisites

### Required Tools
- **Node.js** 16+ and npm 8+
- **Chrome Browser** 88+ (Extension Manifest V3)
- **Git** for version control
- **VS Code** or preferred code editor

### Recommended Extensions
- **Chrome Extension Developer Tools** - For debugging extensions
- **ESLint** - Code quality (included in project)
- **Prettier** - Code formatting (included in project)

---

## 🏗️ Project Structure

### Source Organization

```
src/
├── common/                 # Shared utilities (ES6 modules)
│   ├── constants.js        # Application constants
│   ├── logger.js           # Logging system
│   ├── validator.js        # Input validation
│   ├── storage.js          # Chrome Storage abstraction
│   ├── helpers.js          # Utility functions
│   └── events.js           # Event bus implementation
├── ai/                     # AI processing
│   └── InstructionParser.js # Gemini AI integration
├── popup/                  # Extension popup UI
│   ├── index.html          # Popup interface
│   ├── index.js            # Popup controller
│   └── popup.css           # Popup styles
├── settings/               # Settings page
│   ├── index.html          # Settings interface
│   ├── index.js            # Settings controller
│   └── settings.css        # Settings styles
├── background/             # Service worker
│   └── index.js            # Background tasks
├── content/                # Content scripts
│   ├── index.js            # Main controller
│   ├── content.css         # Visual styles
│   ├── recorder/           # Action recording
│   ├── executor/           # Action execution
│   └── finder/             # Element location
├── images/                 # Extension icons
├── manifest.json           # Extension configuration
├── rollup.config.js        # Bundler configuration
└── __tests__/             # Test files
```

### Build Output

```
deploy/                     # Built extension (load in Chrome)
├── content.js             # Bundled content script
├── popup.js               # Bundled popup script
├── settings.js            # Bundled settings script
├── background.js          # Bundled service worker
├── *.html                # HTML interfaces
├── *.css                 # Stylesheets
├── manifest.json          # Extension manifest
└── images/               # Extension icons
```

---

## 🚀 Development Workflow

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/crosspostly/ai_clicker.git
cd ai_clicker

# Install dependencies
npm install

# Initial build
npm run build
```

### 2. Development Commands

```bash
# Build commands
npm run build          # Standard build
npm run build:dev       # Development build with source maps
npm run build:prod      # Production build with minification
npm run build:watch    # Watch mode (recommended for development)

# Code quality
npm run lint           # ESLint check and auto-fix
npm run format         # Prettier formatting

# Testing
npm test               # Run all tests
npm run test:watch     # Watch mode for testing
npm run test:coverage  # Coverage report
npm run test:verbose   # Verbose test output

# Utilities
npm run clean          # Clean build artifacts
```

### 3. Daily Development Cycle

```bash
# Terminal 1: Watch mode for auto-building
npm run build:watch

# Terminal 2: Watch mode for testing
npm run test:watch

# Terminal 3: Lint on save (optional)
npx eslint src/ --fix --watch
```

**Workflow:**
1. **Edit code** in `src/` directory
2. **Rollup automatically rebuilds** to `deploy/`
3. **Reload extension** in Chrome (click reload icon)
4. **Tests run automatically** on file changes
5. **Lint runs** to maintain code quality

---

## 🔧 Build System

### Rollup Configuration

The project uses Rollup for modern JavaScript bundling:

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

const isDev = process.env.NODE_ENV === 'development';

export default [
  {
    input: 'src/content/index.js',
    output: {
      file: 'deploy/content.js',
      format: 'es',
      sourcemap: isDev,
    },
    plugins: [
      resolve(),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      }),
      ...(isDev ? [] : [terser()])
    ]
  },
  // Similar configs for popup, settings, background
];
```

### Bundle Strategy

- **4 Entry Points:** content, popup, settings, background
- **ES6 Modules:** Native import/export syntax
- **Tree Shaking:** Removes unused code
- **Source Maps:** Development debugging support
- **Minification:** Production builds only

### Build Process

```bash
# build.js orchestrates:
1. Clean deploy/ directory
2. Run Rollup bundling (4 parallel builds)
3. Copy static files (HTML, CSS, images, manifest)
4. Verify all required files exist
5. Report bundle sizes
```

---

## 🧪 Testing Strategy

### Test Structure

```
tests/
├── content/           # Content script tests
├── popup/            # Popup UI tests
├── settings/         # Settings tests
├── background/       # Background service tests
├── common/           # Utility tests
├── ai/               # AI processing tests
└── integration/      # End-to-end tests
```

### Jest Configuration

```javascript
// jest.config.js
export default {
  preset: 'ts-jest',  // For ES6 modules
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40
    }
  }
};
```

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- content/element-finder.test.js

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📝 Code Standards

### JavaScript Conventions

#### ES6+ Syntax

```javascript
// ✅ Use import/export
import { Logger, VALIDATOR } from './common/index.js';
export default class ActionRecorder {
  // Class implementation
}

// ✅ Use const by default
const config = { timeout: 5000 };
let currentAction = null;

// ✅ Use async/await
async function executeActions(actions) {
  for (const action of actions) {
    await executeAction(action);
  }
}

// ✅ Arrow functions for callbacks
const handleClick = (event) => {
  console.log('Element clicked:', event.target);
};

// ✅ Template literals
const message = `Action ${action.type} executed successfully`;
```

#### Naming Conventions

```javascript
// ✅ Classes: PascalCase
class ActionRecorder { }
class ElementFinder { }

// ✅ Functions: camelCase
function executeActions() { }
const findElement = () => { }

// ✅ Constants: UPPER_SNAKE_CASE
const ACTION_TYPES = {
  CLICK: 'click',
  INPUT: 'input',
  SCROLL: 'scroll'
};

// ✅ Files: kebab-case
// action-recorder.js
// element-finder.js
// instruction-parser.js
```

#### JSDoc Documentation

```javascript
/**
 * Records user actions on the page
 * @class ActionRecorder
 * @param {EventBus} eventBus - Event communication system
 * @param {Logger} logger - Logging system
 * @param {ElementFinder} elementFinder - Element location service
 */
export default class ActionRecorder {
  /**
   * Start recording user actions
   * @method startRecording
   * @returns {Promise<void>}
   */
  async startRecording() {
    // Implementation
  }
}
```

---

## 🏛️ Architecture Patterns

### Event-Driven Communication

```javascript
// Common event bus pattern
import { EventBus } from '../common/events.js';

class Component {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on('action:recorded', this.handleActionRecorded);
    this.eventBus.on('recording:start', this.handleRecordingStart);
  }

  handleActionRecorded = (action) => {
    // Handle new action
  }
}
```

### Module Dependencies

```javascript
// Explicit imports at top of file
import { Logger } from '../common/logger.js';
import { StorageManager } from '../common/storage.js';
import { ACTION_TYPES } from '../common/constants.js';
import ElementFinder from './finder/ElementFinder.js';

// Use imports in class
class ActionExecutor {
  constructor() {
    this.logger = new Logger('ActionExecutor');
    this.storage = new StorageManager();
    this.finder = new ElementFinder();
  }
}
```

### Chrome Extension APIs

```javascript
// Content script - DOM manipulation
document.addEventListener('click', (event) => {
  const action = {
    type: 'click',
    target: event.target.textContent,
    selector: generateSelector(event.target)
  };
});

// Background script - Extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Handle first install
  }
});

// Storage API
chrome.storage.local.set({ actions: recordedActions });
chrome.storage.local.get(['settings'], (result) => {
  // Use stored settings
});
```

---

## 🐛 Debugging

### Chrome DevTools

#### Popup Debugging
1. **Open popup** (click extension icon)
2. **Right-click** → "Inspect" or press F12
3. **DevTools opens** for popup context
4. **Console tab** shows popup logs and errors

#### Content Script Debugging
1. **Navigate to any webpage**
2. **Open DevTools** (F12)
3. **Console tab** shows content script logs
4. **Elements tab** for DOM inspection
5. **Sources tab** for debugging content script

#### Background Script Debugging
1. **Go to** `chrome://extensions/`
2. **Find AI-Autoclicker**
3. **Click "Service worker" link**
4. **DevTools opens** for background context

### Logging

```javascript
// Using the logger utility
import { Logger } from '../common/logger.js';

const logger = new Logger('MyComponent');

logger.info('Component initialized');
logger.warn('Unexpected input received', { input });
logger.error('Operation failed', error);
logger.debug('Detailed debugging info', { data });
```

### Error Handling

```javascript
// Standard error handling pattern
try {
  const result = await riskyOperation();
  logger.info('Operation succeeded', { result });
} catch (error) {
  logger.error('Operation failed', error);
  
  // User-friendly error message
  throw new Error(`Failed to complete operation: ${error.message}`);
}
```

---

## 🔄 Adding New Features

### New Action Type

1. **Update constants.js**
```javascript
export const ACTION_TYPES = {
  // Existing types...
  HOVER: 'hover',           // New type
  DRAG: 'drag'              // New type
};
```

2. **Implement in ActionExecutor.js**
```javascript
async executeAction(action) {
  switch (action.type) {
    // Existing cases...
    case ACTION_TYPES.HOVER:
      await this.executeHover(action);
      break;
    case ACTION_TYPES.DRAG:
      await this.executeDrag(action);
      break;
  }
}
```

3. **Add to InstructionParser.js**
```javascript
parseInstruction(text) {
  // Add AI parsing for new actions
  if (text.includes('hover over')) {
    return { type: ACTION_TYPES.HOVER, /* ... */ };
  }
}
```

### New UI Component

1. **Create component file**
```javascript
// popup/components/ActionButton.js
export default class ActionButton {
  constructor(text, onClick) {
    this.element = document.createElement('button');
    this.element.textContent = text;
    this.element.addEventListener('click', onClick);
  }

  render(container) {
    container.appendChild(this.element);
  }
}
```

2. **Import and use**
```javascript
// popup/index.js
import ActionButton from './components/ActionButton.js';

const button = new ActionButton('Click Me', () => {
  console.log('Button clicked');
});
button.render(document.querySelector('.button-container'));
```

### New Settings Option

1. **Add to settings.html**
```html
<div class="setting-item">
  <label for="new-option">New Option</label>
  <input type="checkbox" id="new-option">
</div>
```

2. **Handle in settings.js**
```javascript
import { StorageManager } from '../common/storage.js';

const storage = new StorageManager();

// Load setting
storage.get('newOption').then(value => {
  document.getElementById('new-option').checked = value;
});

// Save setting
document.getElementById('new-option').addEventListener('change', (e) => {
  storage.set('newOption', e.target.checked);
});
```

---

## 📊 Performance Optimization

### Bundle Optimization

```javascript
// rollup.config.js optimizations
export default [
  {
    input: 'src/content/index.js',
    output: {
      file: 'deploy/content.js',
      format: 'es',
      sourcemap: isDev,
    },
    plugins: [
      resolve(),
      replace({
        // Environment-specific replacements
        'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      }),
      // Production-only minification
      ...(isDev ? [] : [terser({
        compress: {
          drop_console: true,  // Remove console.log in production
        }
      })])
    ]
  }
];
```

### Memory Management

```javascript
// Proper cleanup in components
class Component {
  constructor() {
    this.eventListeners = [];
  }

  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  destroy() {
    // Clean up all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}
```

### Async Operations

```javascript
// Debouncing for performance
import { debounce } from '../common/helpers.js';

class SearchManager {
  constructor() {
    this.search = debounce(this.performSearch.bind(this), 300);
  }

  async performSearch(query) {
    // Actual search implementation
  }

  handleInput(event) {
    const query = event.target.value;
    this.search(query);  // Debounced search
  }
}
```

---

## 🔗 Cross-References

- **[Installation Guide](INSTALLATION.md)** - Setup instructions
- **[Architecture Overview](../ARCHITECTURE.md)** - System design
- **[Testing Guide](TESTING.md)** - Jest testing setup
- **[Contributing Guide](../CONTRIBUTING.md)** - Contribution workflow
- **[API Reference](GEMINI-API-MIGRATION.md)** - Gemini integration

---

## 📞 Getting Help

### Development Issues

1. **Check console** in Chrome DevTools
2. **Review build output** for errors
3. **Run tests** to verify functionality
4. **Search existing issues** on GitHub

### Community Support

- **GitHub Issues** - [Report bugs](https://github.com/crosspostly/ai_clicker/issues)
- **GitHub Discussions** - [Ask questions](https://github.com/crosspostly/ai_clicker/discussions)
- **Development Chat** - Join our developer community

---

**Last Updated:** 2025-11-08  
**Version:** 2.0.0  
**Status:** 🟢 Current Development Guide

---

*Happy coding! 🎉*
