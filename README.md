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

### Current State (Flat Structure)
The extension currently uses a flat structure under `src/` with all files at the root level. This was implemented as an intermediate step to ensure stability during the modular migration.

### Target Modular Structure (Planned)
The extension is designed to migrate to a modular architecture with clear separation of concerns:

```
src/
├── common/                     # Shared utilities and core classes
│   ├── constants.js
│   ├── logger.js
│   ├── validator.js
│   ├── storage.js
│   ├── helpers.js
│   └── events.js               # Event bus implementation
├── ai/                         # AI and instruction processing
│   ├── InstructionParser.js
│   └── ElementFinder.js
├── popup/                      # Extension popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── settings/                   # Extension settings page
│   ├── settings.html
│   ├── settings.css
│   └── settings.js
├── background/                 # Service worker
│   └── background.js
├── content/                    # Content scripts and page interaction
│   ├── content.js
│   ├── content.css
│   ├── ActionRecorder.js
│   └── ActionExecutor.js
└── assets/                     # Static assets
    └── images/
```

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
├── src/                        # Current: Flat extension files
├── deploy/                     # Built extension (generated)
├── build.js                    # Simple build script
├── package.json                # NPM dependencies
├── .eslintrc.js                # ESLint configuration
├── README.md                   # This file
├── ARCHITECTURE.md             # Architecture documentation
├── DEVELOPMENT.md              # Development guide
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
npm run build       # Copy src/ to deploy/
npm run lint        # ESLint with auto-fix
npm run test        # Jest tests
npm run format      # Prettier formatting
```

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

> **Note**: The v2.0 migration introduces a modular architecture with dependency injection. While the current implementation uses a flat structure for stability, the API and patterns are designed for the upcoming modular refactor.

### File Structure Changes
- **Before**: Files scattered in `src/` root
- **After**: Organized into logical directories (`common/`, `ai/`, `popup/`, etc.)
- **Impact**: Import paths will need to be updated

### Global State Removal
- **Before**: Global variables and `window.*` usage
- **After**: Dependency injection container manages all services
- **Impact**: Code accessing globals must use injected dependencies

### Event Bus Introduction
- **Before**: Direct method calls and Chrome message passing
- **After**: Centralized event bus for internal communication
- **Impact**: Replace direct calls with event emissions

### Bootstrap Changes
- **Before**: Manual instantiation in each file
- **After**: Centralized DI container bootstrap
- **Impact**: Entry points will initialize from DI container

### Manifest Path Updates
- **Before**: Relative paths to flat structure
- **After**: Paths reflecting modular structure
- **Impact**: `manifest.json` paths will be updated

### Storage Schema Updates
- **Before**: Simple key-value storage
- **After**: Structured storage with versioning
- **Impact**: Migration script needed for existing users

### Migration Checklist
- [ ] Update import statements for new module paths
- [ ] Replace global variable access with DI injection
- [ ] Convert direct method calls to event bus emissions
- [ ] Update manifest.json paths for modular structure
- [ ] Test existing functionality after migration
- [ ] Run storage migration for existing users

## 📄 License

This project is licensed under MIT License.

---

**Version**: 2.0.0  
**Last Updated**: 2024  
**Architecture**: Modular with Dependency Injection (in progress)