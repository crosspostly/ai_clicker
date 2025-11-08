# 🛠️ AI-Autoclicker Development

## Local Development

### Prerequisites
- **Node.js** 16+ and npm 8+
- **Chrome Browser** 88+ (Extension Manifest V3)
- **Git** for version control

### Setup
```bash
# Clone repository
git clone https://github.com/crosspostly/ai_clicker.git
cd ai_clicker

# Install dependencies
npm install

# Build extension
npm run build
```

### Loading in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked extension"
4. Select the `deploy/` folder

### Development Workflow
- **Edit files** in `src/` directory
- **Run build** with `npm run build:watch` for automatic rebuilding
- **Reload extension** in Chrome (click reload icon in extensions page)
- **Test changes** immediately

## Project Structure

```
src/                          # Source files
├── manifest.json             # Extension configuration
├── rollup.config.js         # Rollup bundler configuration
├── popup/                  # Extension popup UI
│   ├── index.html          # Popup interface
│   ├── index.js           # Popup controller
│   └── popup.css          # Popup styles
├── content/                # Content scripts
│   ├── index.js           # Main content script
│   ├── content.css        # Content styles
│   ├── recorder/          # Action recording
│   ├── executor/          # Action execution
│   └── finder/            # Element location
├── settings/               # Settings page
│   ├── index.html          # Settings interface
│   ├── index.js           # Settings controller
│   └── settings.css        # Settings styles
├── background/             # Service worker
│   └── index.js           # Background tasks
├── ai/                     # AI processing
│   └── InstructionParser.js # Gemini integration
├── common/                 # Shared utilities
│   ├── constants.js        # Application constants
│   ├── logger.js           # Logging system
│   ├── storage.js          # Storage abstraction
│   ├── validator.js        # Input validation
│   ├── helpers.js          # Utility functions
│   └── events.js           # Event bus
├── images/                 # Extension icons
└── __tests__/              # Test files

deploy/                        # Built extension (load this in Chrome)
├── content.js              # Bundled content script
├── popup.js                # Bundled popup script
├── settings.js             # Bundled settings script
├── background.js           # Bundled service worker
├── *.html                 # HTML interfaces
├── *.css                  # Stylesheets
├── manifest.json          # Extension manifest
└── images/                # Extension icons
```

## API Gemini

Get free key: https://makersuite.google.com/app/apikey (1,000 requests/day)

**Models Used:**
- **gemini-2.0-flash** (primary) - Fast, stable, cost-effective
- **gemini-2.5-flash** (fallback) - Latest features, good reasoning
- **gemini-2.5-pro** (last resort) - Most capable, slower

## Module Locations

- **Action Recording**: content/index.js → ActionRecorder.js → recordClick, recordInput
- **Action Execution**: content/index.js → ActionExecutor.js → executeAction
- **AI Processing**: content/index.js → InstructionParser.js → parseInstructions
- **Element Finding**: content/index.js → ElementFinder.js → find, findBySelector, findByText
- **Popup UI**: popup/index.js
- **Settings Management**: settings/index.js
- **Logging**: common/logger.js
- **Storage**: common/storage.js
- **Event Bus**: common/events.js

## NPM Scripts

```bash
# Build commands
npm run build            # Standard build
npm run build:dev         # Development with source maps
npm run build:prod        # Production with minification
npm run build:watch      # Watch mode for development

# Code quality
npm run lint             # ESLint check and fix
npm run format           # Prettier formatting

# Testing
npm test                 # Run all tests (Jest)
npm run test:watch       # Watch mode for development
npm run test:coverage    # Coverage report
npm run test:verbose     # Verbose test output

# Utilities
npm run clean            # Remove deploy/ and ZIP files
```

## Debugging

### 1. Popup Debugging
1. Open extension popup
2. Right-click → "Inspect" or F12
3. DevTools opens for popup context

### 2. Content Script Debugging
1. Open any webpage
2. F12 → Console tab
3. Use available variables:
   ```javascript
   // Access to components
   elementFinder.find('Button');
   actionRecorder.getActions();
   ```

### 3. Background Debugging
1. Go to chrome://extensions/
2. Find AI-Autoclicker extension
3. Click "Service worker" link
4. DevTools opens for background context

## Adding New Features

### 1. New Action Type
1. Add type to constants.js
2. Implement in ActionExecutor.js
3. Add to InstructionParser.js
4. Update UI if needed

### 2. New Setting
1. Add to settings.html
2. Handle in settings.js
3. Use through storage.js

### 3. New Element Finding Method
1. Add method to ElementFinder.js
2. Update find() method
3. Add tests

## Testing

### Running Tests
```bash
npm test
```

### Coverage
```bash
npm run test:coverage
```

### Manual Testing
1. Build: `npm run build`
2. Load in Chrome
3. Test functionality
4. Check console for errors

## Code Style

### ESLint Rules
- Strict rules enforced
- Auto-fix: `npm run lint`

### Formatting
- Prettier for code formatting
- Run: `npm run format`

### Conventions
- ES6+ syntax
- async/await instead of Promise.then()
- const by default, let when needed
- Never use var
- JSDoc for all functions and classes

## Error Handling

### Error Structure
```javascript
try {
  // code
} catch (error) {
  logger.error('Operation failed', error);
  // Show user-friendly message
}
```

### Error Types
- ValidationError - input validation errors
- ElementNotFoundError - element not found
- ActionExecutionError - action execution errors
- GeminiAPIError - Gemini API errors

## Security

### Validation
All input data goes through validator.js:
```javascript
validator.validateSelector(selector);
validator.validateAction(action);
```

### XSS Protection
- Use textContent instead of innerHTML
- Sanitize user input
- Validate URLs and selectors

## Performance

### Optimizations
- Element caching in ElementFinder
- Async operations
- Data limits
- Periodic storage cleanup

### Profiling
- Use Chrome DevTools Performance
- Check memory leaks
- Optimize hot paths

## Release

### Versioning
- Semantic versioning: MAJOR.MINOR.PATCH
- Update version in manifest.json
- Update in package.json

### Build
```bash
npm run build
```

### Publishing
1. Archive deploy/ folder
2. Upload to Chrome Web Store
3. Create release tag in git

---

## 🔗 Cross-References

- **[Installation Guide](docs/INSTALLATION.md)** - Setup instructions
- **[Architecture Overview](ARCHITECTURE.md)** - System design
- **[Testing Documentation](docs/TESTING.md)** - Jest testing setup
- **[Contributing Guide](CONTRIBUTING.md)** - Contribution workflow

---

**Last Updated:** 2025-11-08  
**Version:** 2.0.0  
**Status:** 🟢 Current Development Guide
