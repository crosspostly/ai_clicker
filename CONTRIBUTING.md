# 🤝 Contributing to AI-Autoclicker

Thank you for your interest in contributing to AI-Autoclicker! This guide will help you get started with contributing to the project.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- **Chrome** browser for extension testing
- **Git** for version control
- Basic knowledge of **JavaScript ES6+**, **Chrome Extensions**, and **Jest** testing

### Quick Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/ai_clicker.git
cd ai_clicker

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build

# 4. Load in Chrome for development
# Open chrome://extensions/ → Developer mode → Load unpacked → select deploy/
```

---

## 🌿 Branching Strategy

### Branch Naming Conventions

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `test/test-improvement` - Test additions or improvements
- `refactor/code-cleanup` - Code refactoring without functional changes

### Example Branch Names

```bash
feature/gemini-2.5-integration
bugfix/popup-ui-freeze
docs/installation-guide-update
test/content-script-coverage
refactor/event-bus-optimization
```

---

## 📝 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code formatting, no functional changes
- `refactor:` - Code refactoring without functional changes
- `test:` - Adding or updating tests
- `chore:` - Build process, dependency updates, maintenance

### Examples

```bash
feat(ai): add support for Gemini 2.5 Flash model
fix(popup): resolve UI freeze during recording
docs(readme): update installation instructions for v2.0
test(content): add ElementFinder integration tests
refactor(storage): optimize Chrome Storage API usage
chore(deps): update rollup to v4.53.1
```

---

## 🏗️ Development Workflow

### 1. Development Commands

```bash
# Development with watch mode
npm run build:watch

# Lint and fix code
npm run lint

# Format code
npm run format

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch tests during development
npm run test:watch
```

### 2. Making Changes

1. **Create a feature branch** from `main`
2. **Make your changes** following our code conventions
3. **Test thoroughly** - ensure all tests pass
4. **Update documentation** if applicable
5. **Commit with conventional messages**
6. **Push to your fork**
7. **Create a Pull Request**

### 3. Code Standards

#### JavaScript Conventions

```javascript
// ✅ Use ES6+ syntax
import { Logger } from './logger.js';
import { ACTION_TYPES } from './constants.js';

// ✅ Use const by default, let when needed
const config = { timeout: 5000 };
let currentAction = null;

// ✅ Use async/await instead of Promise.then()
async function executeActions(actions) {
  for (const action of actions) {
    await executeAction(action);
  }
}

// ✅ Use arrow functions for callbacks
const handleClick = (event) => {
  console.log('Element clicked:', event.target);
};

// ✅ Class syntax with proper JSDoc
/**
 * Manages action recording and playback
 */
class ActionManager {
  /**
   * Start recording user actions
   * @param {Object} options - Recording options
   */
  async startRecording(options = {}) {
    // Implementation
  }
}
```

#### File Organization

```
src/
├── common/          # Shared utilities
├── ai/             # AI processing
├── popup/          # Extension popup
├── settings/       # Settings page
├── background/     # Service worker
└── content/        # Content scripts
```

#### Import/Export Patterns

```javascript
// ✅ Named exports for utilities
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const debounce = (func, wait) => { /* ... */ };

// ✅ Default export for main classes
export default class ActionRecorder {
  // Class implementation
}

// ✅ Import specific what you need
import { delay, debounce } from './helpers.js';
import ActionRecorder from './recorder/ActionRecorder.js';
```

---

## 🧪 Testing Guidelines

### Writing Tests

```javascript
// tests/content/element-finder.test.js
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import ElementFinder from '../../../src/content/finder/ElementFinder.js';

describe('ElementFinder', () => {
  let elementFinder;
  let dom;

  beforeEach(() => {
    dom = new JSDOM(`
      <div>
        <button id="submit" class="btn">Submit</button>
        <input name="email" type="email" />
      </div>
    `);
    global.document = dom.window.document;
    global.window = dom.window;
    
    elementFinder = new ElementFinder();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should find element by ID', () => {
    const element = elementFinder.findById('submit');
    expect(element).toBeTruthy();
    expect(element.id).toBe('submit');
  });
});
```

### Test Coverage

- **Target:** 65-70% overall coverage
- **Minimum:** New features should have at least 80% coverage
- **Critical paths:** Core functionality should have 90%+ coverage

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- element-finder.test.js

# Run tests with coverage
npm run test:coverage

# Watch mode during development
npm run test:watch
```

---

## 🔍 Code Review Process

### Pull Request Requirements

Before submitting a PR, ensure:

- [ ] **Code follows project conventions**
- [ ] **All tests pass** (`npm test`)
- [ ] **Coverage is maintained or improved**
- [ ] **Build succeeds** (`npm run build`)
- [ ] **Lint passes** (`npm run lint`)
- [ ] **Documentation is updated** (if applicable)
- [ ] **Commits follow conventional format**

### PR Template

```markdown
## Description
Brief description of changes and their purpose.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

---

## 🐛 Bug Reports

### Reporting Bugs

Use the [GitHub Issues](https://github.com/crosspostly/ai_clicker/issues) with:

1. **Clear title** describing the issue
2. **Detailed description** with steps to reproduce
3. **Environment information** (OS, Chrome version, extension version)
4. **Expected vs actual behavior**
5. **Screenshots** if applicable
6. **Console errors** if any

### Bug Report Template

```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. Windows 11, macOS 13.0]
- Chrome Version: [e.g. 119.0.6045.105]
- Extension Version: [e.g. 2.0.0]

## Additional Context
Any other relevant information
```

---

## 💡 Feature Requests

### Requesting Features

1. **Check existing issues** for duplicates
2. **Use the feature request template**
3. **Provide clear use cases**
4. **Consider implementation complexity**

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Any other relevant information
```

---

## 📚 Documentation Contributions

### Types of Documentation

- **User guides** - Installation, usage, troubleshooting
- **Developer docs** - Architecture, API reference, contributing
- **Code documentation** - JSDoc comments, inline documentation
- **Examples** - Code examples, tutorials

### Documentation Standards

- **Clear and concise** language
- **Code examples** for complex concepts
- **Cross-references** to related documentation
- **Consistent formatting** with existing docs

---

## 🏆 Recognition

Contributors are recognized in:

- **README.md** - Major contributors section
- **Release notes** - For significant contributions
- **GitHub contributors** - Automatic attribution

---

## 📞 Getting Help

- **GitHub Discussions** - General questions and ideas
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Check existing guides first
- **Code reviews** - Learn from feedback on your PRs

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the same [MIT License](LICENSE) as the project.

---

Thank you for contributing to AI-Autoclicker! 🎉
