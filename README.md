# 🤖 AI Clicker - Intelligent Browser Automation Extension

> Transform your browser into an AI-powered automation assistant with voice control and real-time collaboration

[![Tests](https://github.com/crosspostly/ai_clicker/actions/workflows/ci.yml/badge.svg)](https://github.com/crosspostly/ai_clicker/actions)
[![Coverage](https://img.shields.io/badge/coverage-63.8%25-yellow)](https://github.com/crosspostly/ai_clicker)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 🌟 Features

### ✅ Current Features (v2.0)
- **📝 Action Recording** - Record clicks, typing, and navigation
- **🎯 Smart Playback** - Replay recorded actions with configurable speed
- **🤖 AI-Powered** - Uses Google Gemini to understand natural language instructions
- **📊 Export/Import** - Save and share automation scenarios
- **🎨 Modern UI** - Clean, intuitive popup interface
- **🏗️ Modern Architecture** - ES6 modules with Rollup bundling

### 🚧 In Progress
- **🔧 Critical Bugfixes** - Fixing ActionRecorder core issues ([#35](https://github.com/crosspostly/ai_clicker/issues/35))
- **🧪 Test Coverage** - Increasing to 45%+ (currently 63.8% passing)

### 🚀 Coming Soon (v3.0 - Live Mode) ([#36](https://github.com/crosspostly/ai_clicker/issues/36))
- **🎤 Voice Control** - Speak commands naturally
- **👁️ Visual AI** - AI sees your screen in real-time
- **🤝 Real-time Collaboration** - Work together with AI
- **📱 Non-blocking UI** - Sidebar overlay, no screen blocking
- **💬 Natural Conversations** - Talk to AI like a co-worker

---

## 🚀 Quick Start

### Installation

#### From Source
```bash
# 1. Clone repository
git clone https://github.com/crosspostly/ai_clicker.git
cd ai_clicker

# 2. Install dependencies
npm install

# 3. Build extension
npm run build

# 4. Load in Chrome
# Open chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select deploy/ folder

# 5. Get Gemini API key (optional for AI mode)
# https://makersuite.google.com/app/apikey
```

### Setup

1. Click the extension icon in your toolbar
2. Go to Settings
3. Enter your [Google Gemini API key](https://makersuite.google.com/app/apikey)
4. Click "Save Settings"

---

## 📖 Usage

### Manual Mode (Recording & Playback)

**Record Actions:**
1. Click "Start Recording"
2. Perform actions on the webpage (click, type, scroll)
3. Click "Stop Recording"
4. Actions are automatically saved

**Playback:**
1. Click "Play Actions" to replay your recorded scenario
2. Adjust playback speed in settings (0.5x - 3x)

**Export/Import:**
- Click "Export" to save scenario as JSON
- Click "Import" to load saved scenarios

### AI Mode (Natural Language)

**Give Instructions:**
1. Switch to "AI Mode"
2. Enter natural language instruction:
   ```
   "Find all product links and click the first one"
   ```
3. Click "Execute with AI"
4. AI will interpret and execute the action

**Example Instructions:**
- "Fill out the form with test data"
- "Click the 'Sign Up' button"
- "Scroll to the bottom of the page"
- "Find the search box and type 'AI automation'"

### Live Mode (v3.0 - Coming Soon)

**Voice Control:**
1. Click "Enable Live Mode"
2. Grant microphone and screen capture permissions
3. Speak your commands:
   ```
   "Hey AI, open Gmail and find emails from Pavel"
   ```
4. Watch as AI performs actions in real-time
5. AI responds with voice and shows progress in sidebar

**Real-time Collaboration:**
- AI sees your screen (screenshots every 2 seconds)
- AI hears your voice (continuous listening)
- AI speaks responses (natural voice)
- AI performs actions (with visual highlights)
- You remain in control (non-blocking overlay)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  Chrome Extension (Manifest V3)                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Content Script                          │   │
│  │ - DOM manipulation                      │   │
│  │ - Event recording                       │   │
│  │ - Action execution                      │   │
│  │ - Live Mode overlay (v3.0)              │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ Background Service Worker               │   │
│  │ - API communication                     │   │
│  │ - State management                      │   │
│  │ - WebSocket (v3.0)                      │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ Popup UI                                │   │
│  │ - User controls                         │   │
│  │ - Settings                              │   │
│  │ - Action list                           │   │
│  └─────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Google Gemini API                              │
│  - gemini-2.0-flash-exp (current)               │
│  - gemini-2.0-flash-live (v3.0)                 │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Development

### Prerequisites
- Node.js 20+ and npm
- Chrome or Chromium-based browser
- Google Gemini API key

### Development Commands

```bash
# Installation
npm install              # Install dependencies

# Build
npm run build            # Development build
npm run build:prod       # Production build + minification
npm run build:watch      # Watch mode for development

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting errors
npm run format           # Prettier formatting

# Utilities
npm run clean            # Remove build artifacts
```

### Project Structure

```
ai_clicker/
├── src/
│   ├── ai/
│   │   ├── GeminiClient.js          # Gemini API integration
│   │   ├── GeminiLiveClient.js      # v3.0: Live API
│   │   └── InstructionParser.js     # NL instruction parsing
│   ├── background/
│   │   └── index.js                 # Service worker
│   ├── common/
│   │   ├── constants.js             # Shared constants
│   │   ├── logger.js                # Logging utility
│   │   ├── storage.js               # Storage manager
│   │   ├── validator.js             # Input validation
│   │   ├── helpers.js               # Utility functions
│   │   ├── ScreenCapture.js         # v3.0: Screen capture
│   │   └── VoiceInput.js            # v3.0: Voice recording
│   ├── content/
│   │   ├── index.js                 # Content script entry
│   │   ├── executor/
│   │   │   └── ActionExecutor.js    # Action execution
│   │   ├── finder/
│   │   │   └── ElementFinder.js     # Element selection
│   │   ├── recorder/
│   │   │   └── ActionRecorder.js    # Action recording
│   │   └── LiveModeOverlay.js       # v3.0: Live UI
│   ├── popup/
│   │   ├── index.js                 # Popup logic
│   │   ├── popup.html               # Popup UI
│   │   └── popup.css                # Popup styles
│   └── __tests__/                   # Unit tests
├── tests/                           # Integration tests
├── deploy/                          # Build output
├── docs/                            # Documentation
│   ├── bugfix-plan.md               # Critical bugfix plan
│   ├── gemini-live-plan.md          # Live Mode implementation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── CONTRIBUTING.md
│   └── ROADMAP.md
├── manifest.json                    # Extension manifest
├── package.json
├── jest.config.cjs
├── .babelrc
├── .eslintrc.cjs
└── README.md
```

---

## 🐛 Known Issues & Roadmap

### Current Status (v2.0)
- ✅ Tests: 432/677 passing (63.8%)
- ✅ ESLint: Passing
- ✅ Build: Passing
- ⚠️ Coverage: 36.99% (goal: 45%+)

### Critical Issues ([#35](https://github.com/crosspostly/ai_clicker/issues/35))

**ActionRecorder Bugs (URGENT):**
- [ ] Fix event listener binding - recording not starting
- [ ] Fix handleScroll - scroll events not captured
- [ ] Fix handleChange - checkbox/radio errors
- [ ] Fix getRecordingStatus - duration undefined
- [ ] Update test mocks - add closest(), getAttribute()

**Popup Exports:**
- [ ] Export handleMessage, updateUI functions
- [ ] Export getRecordedActions, clearRecordedActions
- [ ] Fix 40 failing popup tests

**Impact:** After fixes → **550/677 tests passing (81%+)**, coverage **45%+**

### Planned Features (v3.0) ([#36](https://github.com/crosspostly/ai_clicker/issues/36))

**Gemini Live Integration:**
- [ ] Voice control (speech-to-text + text-to-speech)
- [ ] Screen capture (2 FPS streaming)
- [ ] Real-time overlay UI
- [ ] WebSocket communication
- [ ] Multimodal AI (audio + vision)

**Timeline:**
- Week 1: Foundation (8 hours)
- Week 2: UI + Integration (12 hours)
- Week 3: Testing & Polish (6 hours)
- Release: v3.0 with Live Mode

See [docs/ROADMAP.md](docs/ROADMAP.md) and implementation plans in [docs/](docs/) for full details.

---

## 🧪 Testing

### Current Test Status

```bash
# Statistics
✅ 432/677 tests passing (63.8%)
❌ 245/677 tests failing (36.2%)
✅ 22/35 test suites passing
❌ 13/35 test suites failing
⚠️ Coverage: 36.99% (threshold: 40%)

# Run tests
npm test                  # All tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### Test Categories

| Category | Tests | Status |
|----------|-------|--------|
| Common utilities | ~100 | ✅ 95% passing |
| AI parser | ~50 | ✅ 90% passing |
| ActionRecorder | ~30 | ❌ 40% passing (CRITICAL) |
| ActionExecutor | ~40 | ✅ 85% passing |
| Popup | ~80 | ❌ 50% passing (needs exports) |
| Background | ~20 | ❌ 0% passing (module errors) |
| Integration | ~15 | ✅ 80% passing |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Workflow

1. Create an issue describing the feature/bug
2. Get approval from maintainers
3. Implement the change
4. Write/update tests
5. Update documentation
6. Submit PR with reference to issue

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** - For powerful AI capabilities
- **Chrome Extensions** - For the platform
- **Jest** - Testing framework
- **Rollup** - Module bundling
- **Open Source Community** - For inspiration and tools

---

## 📞 Contact & Support

- **Issues:** [GitHub Issues](https://github.com/crosspostly/ai_clicker/issues)
- **Discussions:** [GitHub Discussions](https://github.com/crosspostly/ai_clicker/discussions)
- **Author:** [@crosspostly](https://github.com/crosspostly)

---

## 🎯 Quick Links

- **[Critical Bugfixes Plan](docs/bugfix-plan.md)** - ActionRecorder fixes
- **[Gemini Live Plan](docs/gemini-live-plan.md)** - v3.0 implementation
- **[Architecture](docs/ARCHITECTURE.md)** - System design
- **[Contributing](docs/CONTRIBUTING.md)** - How to contribute
- **[Roadmap](docs/ROADMAP.md)** - Future plans

---

**Version:** 2.0.0  
**Status:** 🟡 Stable (critical bugs in progress)  
**Next Release:** v2.1 (bugfixes), v3.0 (Live Mode)  
**Updated:** 2025-11-09

---

**Built with ❤️ by [@crosspostly](https://github.com/crosspostly)**  
**Powered by AI 🤖**

⭐ **If you find this project useful, please give it a star!**