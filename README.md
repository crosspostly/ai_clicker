# 🤖 AI-Autoclicker v2.0.0

A powerful Chrome browser extension for automating web actions using Google Gemini AI and manual recording.

## 🚀 Quick Start

1. Clone: `git clone https://github.com/yourusername/ai-autoclicker.git`
2. Build: `npm install && npm run build`
3. Open `chrome://extensions` and load the `deploy/` folder
4. Get API key: https://makersuite.google.com/app/apikey
5. Paste the key in extension Settings

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Project architecture and modular design
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development and local testing guide
- [BREAKING_CHANGES.md](#breaking-changes-v1x--v20) - Migration guide from v1.x

## 🚀 Features

### Core Functionality
- 🎬 **Action Recording** - Record clicks, text inputs, scroll, and other actions
- 🤖 **AI Analysis** - Google Gemini analyzes your instructions and converts them to actions
- ⚡ **Fast Playback** - Replay recorded scenarios at variable speeds
- 💾 **Scenario Management** - Export and import actions in JSON format
- 🔒 **Security** - Input validation and XSS protection

## 🏗️ Architecture Overview

### Current Modular Structure (✅ COMPLETE)
The extension uses a fully modular architecture with clear separation of concerns:

```
src/
├── manifest.json               # Extension configuration (Manifest V3)
│
├── common/                     # ✅ Shared utilities and core classes
│   ├── constants.js            # Application constants
│   ├── logger.js               # Centralized logging with levels
│   ├── validator.js            # Data validation utilities
│   ├── storage.js              # Chrome Storage API wrapper
│   ├── helpers.js              # Helper functions and utilities
│   ├── events.js               # Event bus implementation
│   └── assets/                 # Static assets
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
├── ai/                         # ✅ AI and instruction processing
│   └── InstructionParser.js    # Google Gemini integration & fallback parser
│
├── popup/                      # ✅ Extension popup interface
│   ├── index.html              # Popup UI (renamed from popup.html)
│   ├── index.js                # Popup logic (renamed from popup.js)
│   └── popup.css               # Popup styles
│
├── settings/                   # ✅ Extension settings page
│   ├── index.html              # Settings UI (renamed from settings.html)
│   ├── index.js                # Settings logic (renamed from settings.js)
│   └── settings.css            # Settings styles
│
├── background/                 # ✅ Service worker
│   └── index.js                # Background worker (renamed from background.js)
│
└── content/                    # ✅ Content scripts and page interaction
    ├── index.js                # Main content script (renamed from content.js)
    ├── content.css             # Content script styles
    ├── recorder/               # Action recording functionality
    │   └── ActionRecorder.js
    ├── executor/               # Action execution functionality
    │   └── ActionExecutor.js
    └── finder/                 # Element finding functionality
        └── ElementFinder.js
```

### 📝 Module Purpose & Responsibilities

| Module | Purpose | Key Files |
|--------|---------|-----------|
| **`common/`** | Shared utilities, constants, and assets used across all modules | `logger.js`, `storage.js`, `validator.js`, `helpers.js`, `events.js`, `constants.js`, `assets/` |
| **`ai/`** | AI instruction processing and Google Gemini integration | `InstructionParser.js` |
| **`popup/`** | Extension popup UI (opened when clicking extension icon) | `index.html`, `index.js`, `popup.css` |
| **`settings/`** | Extension settings and configuration page | `index.html`, `index.js`, `settings.css` |
| **`background/`** | Service worker for background processing and message handling | `index.js` |
| **`content/`** | Content scripts that run on web pages for recording/playing actions | `index.js`, `content.css`, `recorder/`, `executor/`, `finder/` |

### 🔧 File Organization Details

#### Core Utilities (`common/`)
- **`logger.js`**: Centralized logging with levels (DEBUG, INFO, WARN, ERROR)
- **`validator.js`**: Data validation for actions, API keys, and instructions
- **`storage.js`**: Chrome Storage API wrapper (local and sync storage)
- **`helpers.js`**: Utility functions (delay, scrollIntoView, debounce, throttle)
- **`events.js`**: EventEmitter system for component communication
- **`constants.js`**: Application-wide constants and configuration
- **`assets/`**: Extension icons (16px, 48px, 128px)

#### Content Script Submodules (`content/`)
- **`recorder/ActionRecorder.js`**: Records user actions on web pages
- **`executor/ActionExecutor.js`**: Executes recorded or AI-generated actions
- **`finder/ElementFinder.js`**: Finds DOM elements using various strategies

### Dependency Injection Architecture

The extension uses a dependency injection (DI) pattern to avoid global state and improve testability:

```javascript
// Example DI container setup
class DIContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  register(name, factory, options = {}) {
    this.services.set(name, { factory, options });
  }

  get(name) {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service ${name} not found`);

    if (service.options.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory(this));
      }
      return this.singletons.get(name);
    }

    return service.factory(this);
  }
}
```

### Event Bus Communication

Components communicate through a centralized event bus rather than direct coupling:

```javascript
// Event-driven communication
eventBus.emit('action:recorded', { action });
eventBus.on('action:executed', ({ result }) => {
  // Handle action completion
});
```

## 📦 Project Structure

```
ai-autoclicker/
├── src/                        # ✅ Modular extension source files
│   ├── manifest.json           # Extension configuration
│   ├── common/                 # Shared utilities and assets
│   ├── ai/                     # AI instruction processing
│   ├── popup/                  # Extension popup UI
│   ├── settings/               # Settings page
│   ├── background/             # Service worker
│   └── content/                # Content scripts with submodules
├── deploy/                     # Built extension (generated by npm run build)
├── build.js                    # Simple build script (copies src/ → deploy/)
├── package.json                # NPM dependencies and scripts
├── .eslintrc.js                # ESLint configuration
├── README.md                   # This file
├── ARCHITECTURE.md             # Architecture documentation
├── DEVELOPMENT.md              # Development guide
├── MODULARIZATION_COMPLETE.md  # Modularization completion notes
├── REFACTORING_SUMMARY.md      # Refactoring summary
└── .gitignore                  # Git ignore file
```

## 🚀 Installation and Usage

### Requirements
- Google Chrome 88+
- Node.js 14+ (for development)
- Google API Key for Gemini (optional)

### Local Installation

1. **Clone repository**
```bash
git clone https://github.com/yourusername/ai-autoclicker.git
cd ai-autoclicker
```

2. **Install dependencies**
```bash
npm install
```

3. **Build extension**
```bash
npm run build
```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked extension"
   - Select the `deploy/` folder

5. **Configure API key** (optional)
   - Get key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Open "Extension settings" and enter the key

### Usage

#### Manual Mode
1. Click "🔴 Record" in extension popup
2. Perform actions on the page (clicks, text input, scroll)
3. Click "⏹️ Stop" to finish recording
4. Click "▶️ Play" to replay actions

#### Automatic Mode (with AI)
1. Switch to "Automatic" tab
2. Write instructions in English: *"Click the Login button, enter email, then password, click submit"*
3. Click "▶️ Start"
4. Extension analyzes instructions and executes actions

#### Scenario Management
- **Export**: Click "📥 Export" to save actions to JSON
- **Import**: Click "📤 Import" and select JSON file
- **Speed**: Use slider to change playback speed

## 💡 AI Instruction Examples

### Login
```
Click the "Login" button, enter email "user@example.com", then enter password "password123", click "Submit"
```

### Form Filling
```
Find the "Name" field and enter "John Doe"
Select "United States" from the "Country" dropdown
Check the "I agree to terms" checkbox
Click the "Register" button
```

### Navigation and Scroll
```
Scroll page down 400 pixels
Click the "Next" link
Wait 2 seconds for page to load
Click the "Download" button
```

## 🔧 For Developers

### Build System
```bash
npm run build       # Copy src/ to deploy/ (maintains modular structure)
npm run lint        # ESLint with auto-fix (0 errors, 2 non-critical warnings)
npm run test        # Jest tests
npm run format      # Prettier formatting
```

#### Build Process Details
- **Input**: Modular `src/` directory structure
- **Output**: `deploy/` directory with identical modular structure
- **Process**: Simple copy operation maintaining all directory relationships
- **Result**: Chrome-ready extension with proper module paths
- **Status**: ✅ Working correctly with current modular structure

### Architecture Guidelines

#### No Window Globals
- Avoid `window.*` global variables
- Use dependency injection for shared services
- Each component should receive its dependencies

#### Event-Driven Design
- Use the event bus for cross-component communication
- Emit events for state changes
- Subscribe to events rather than direct method calls

#### Modular Structure
- Each directory has a single responsibility
- Shared utilities go in `common/`
- Feature-specific code stays in its directory

### Testing
```bash
npm test            # Run all tests
npm run test:watch  # Watch mode
```

## 🐛 Troubleshooting

### Extension Not Working
1. Check extension is enabled in `chrome://extensions/`
2. Reload the page (Ctrl+R)
3. Open developer console (F12) and check for errors

### AI Not Analyzing Instructions
1. Check API key in settings
2. Click "🧪 Test" to verify connection
3. Ensure you have quota remaining (1000 requests/day)

### Elements Not Found
1. Check element is visible on page
2. Try more descriptive names
3. Open console and use `elementFinder.find('...')` for debugging

## 📝 Data Formats

### Action Format

```javascript
{
  type: 'click',                    // Action type
  target: 'Login button',           // Text or description
  selector: '.button-login',       // CSS selector
  timestamp: 1699450000000,        // Execution time (optional)
  value: 'user@example.com'        // Value (for input)
}
```

### Exported JSON
```json
[
  {
    "type": "click",
    "target": "Login button",
    "selector": "button.login"
  },
  {
    "type": "input",
    "target": "Email",
    "value": "user@example.com"
  },
  {
    "type": "wait",
    "duration": 1000
  }
]
```

## 🔄 Breaking Changes v1.x → v2.0

> **Note**: v2.0.0 migration is **COMPLETE** with full modular architecture implemented.

### ✅ Completed Changes

#### File Structure Changes
- **Before**: Files scattered in `src/` root (flat structure)
- **After**: ✅ Organized into logical directories (`common/`, `ai/`, `popup/`, etc.)
- **Status**: ✅ All files moved to appropriate modules

#### Entry Point Renames
- **Before**: `popup.html`, `popup.js`, `settings.html`, `settings.js`, `background.js`, `content.js`
- **After**: ✅ `popup/index.html`, `popup/index.js`, `settings/index.html`, `settings/index.js`, `background/index.js`, `content/index.js`
- **Status**: ✅ All entry points renamed for consistency

#### Manifest Path Updates
- **Before**: Relative paths to flat structure
- **After**: ✅ Paths reflecting modular structure
- **Status**: ✅ `manifest.json` updated with all new paths

#### HTML Script/CSS References
- **Before**: Direct references to flat files
- **After**: ✅ Relative paths to modular structure
- **Status**: ✅ Both popup and settings HTML updated

#### Icon Organization
- **Before**: Icons in root `images/` directory
- **After**: ✅ Icons moved to `common/assets/`
- **Status**: ✅ All icon paths updated in manifest

### 📋 Migration for Users

#### For New Users
- ✅ Use v2.0.0 directly - no migration needed

#### For v1.x Users
1. **Remove v1.x**: Uninstall old extension from `chrome://extensions/`
2. **Install v2.0.0**: Load new version from `deploy/` folder
3. **Reconfigure**: Enter Gemini API key in Settings
4. **Re-record**: Old scenarios incompatible with v2.0 format

### 🧪 Verification Status

- ✅ Build system works: `npm run build` copies modular structure correctly
- ✅ Extension loads: All paths resolve in Chrome
- ✅ Scripts execute: HTML files load scripts from correct paths
- ✅ Icons display: All three icon sizes load correctly
- ✅ Linting passes: Code quality maintained (0 errors, 2 non-critical warnings)

## 📄 License

This project is licensed under MIT License.

---

**Version**: 2.0.0  
**Last Updated**: 2024  
**Architecture**: ✅ Modular with Dependency Injection (Stage 1 COMPLETE)