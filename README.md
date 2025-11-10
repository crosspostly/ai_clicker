# 🤖 AI Autoclicker v3.0.0 - Voice-Powered Browser Automation

> Transform your browser into an intelligent automation assistant with real-time voice control, advanced playback engine, and comprehensive settings system.

[![Tests](https://github.com/crosspostly/ai_clicker/actions/workflows/release.yml/badge.svg)](https://github.com/crosspostly/ai_clicker/actions)
[![Coverage](https://img.shields.io/badge/coverage-78%25-brightgreen)](https://github.com/crosspostly/ai_clicker)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.0.0-orange)](https://github.com/crosspostly/ai_clicker/releases/tag/v3.0.0)

---

## 🎉 Major Release v3.0.0

AI Autoclicker v3.0.0 represents a complete transformation of the extension with three major new systems that revolutionize browser automation:

### 🎤 **Voice Control System**
- **Real-time voice commands** via Google Gemini Live API
- **Multi-language support** (English, Russian, auto-detection)
- **Natural language processing** for intelligent command parsing
- **Fallback chain** for maximum reliability
- **Audio streaming** with Web Audio API

### 🎬 **Advanced Playback Engine**
- **Deterministic replay** of recorded actions with precise timing
- **Visual animations** and audio feedback
- **State management** with pause/resume/stop controls
- **Error recovery** with intelligent retry logic
- **Variable playback speeds** (0.5x - 3.0x)

### ⚙️ **Comprehensive Settings System**
- **5-tab interface**: General, Voice, Playback, Advanced, About
- **Chrome storage sync** with local backup
- **Real-time validation** and helpful error messages
- **Import/export** functionality with JSON format
- **Theme support** (light/dark/auto)

---

## 🌟 Features

### 🎤 Voice Control
- **Natural Commands**: "Click the submit button", "Type hello world", "Scroll down"
- **Multi-language**: English and Russian support with auto-detection
- **Real-time Processing**: Continuous audio streaming with low latency
- **Smart Parsing**: Converts speech to structured browser actions
- **Fallback Reliability**: Multiple Gemini models with automatic failover

### 🎬 Playback Engine
- **Action Types**: Click, double-click, right-click, input, scroll, wait
- **Precise Timing**: Configurable delays and playback speeds
- **Visual Feedback**: Element highlighting and progress indicators
- **Audio Feedback**: Success/error sounds and completion notifications
- **Error Recovery**: Automatic retry with exponential backoff

### 🎛️ Settings Management
- **Intuitive Interface**: Organized 5-tab layout with clear sections
- **Cross-device Sync**: Automatic synchronization via Chrome storage
- **Validation System**: Real-time validation with helpful error messages
- **Backup & Restore**: Import/export settings with version compatibility
- **Customization**: Themes, shortcuts, and advanced options

### 🏗️ Technical Excellence
- **Modern Architecture**: ES6 modules with clean separation of concerns
- **Message System**: Robust Popup ↔ Background ↔ Content communication
- **Testing Suite**: 78+ tests with 75%+ coverage
- **CI/CD Pipeline**: Automated testing, building, and releases
- **Documentation**: Comprehensive guides and API references

---

## 🚀 Quick Start

### Installation

#### From Chrome Web Store
1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search "AI Autoclicker"
3. Click "Add to Chrome"
4. Grant necessary permissions

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
# Open Chrome → Extensions → Developer Mode → Load unpacked
# Select the 'deploy' folder
```

### Initial Setup

1. **Configure API Key**
   - Click extension icon → Settings → Voice tab
   - Enter your Google Gemini API key
   - Test connection with "Test API Key" button

2. **Choose Preferences**
   - Set your preferred language (English/Russian/Auto)
   - Select theme (Light/Dark/Auto)
   - Configure playback speed and audio feedback

3. **Grant Permissions**
   - Allow microphone access for voice control
   - Grant necessary permissions for automation

---

## 📖 Usage Guide

### 🎤 Voice Control

#### Basic Commands
```bash
# Click actions
"click the submit button"
"нажми кнопку отправки"

# Input actions
"type hello world in the search box"
"введи привет мир в поле поиска"

# Scroll actions
"scroll down"
"прокрути вниз"

# Complex actions
"click login, then type admin in username field"
"нажми вход, затем введи admin в поле имени"
```

#### Starting Voice Control
1. Click extension icon
2. Go to Voice tab or click "Start Voice"
3. Allow microphone access
4. Speak commands naturally
5. Watch real-time transcription and execution

### 🎬 Recording & Playback

#### Recording Actions
1. Click "Start Recording"
2. Perform actions manually (click, type, scroll)
3. Click "Stop Recording"
4. Review recorded sequence
5. Save with descriptive name

#### Playing Back Actions
1. Select saved recording from list
2. Configure playback options (speed, audio, visual)
3. Click "Play" to execute sequence
4. Monitor progress and results

### ⚙️ Settings Configuration

#### Voice Settings
- **API Configuration**: Gemini API key and model selection
- **Language Settings**: Choose preferred language
- **Audio Settings**: Microphone sensitivity and feedback

#### Playback Settings
- **Speed Control**: Adjust playback speed (0.5x - 3.0x)
- **Timing Options**: Configure delays between actions
- **Visual Effects**: Enable animations and highlighting
- **Audio Feedback**: Success/error sounds and volume

#### Advanced Options
- **Performance**: Timeout settings and retry logic
- **Debugging**: Detailed logging and error tracking
- **Storage**: Backup and cleanup options

---

## 🏗️ Architecture

### Component Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Popup       │    │   Background    │    │    Content     │
│                 │    │                 │    │                 │
│ • Settings UI   │◄──►│ • Voice Handler │◄──►│ • DOM Control  │
│ • Recording     │    │ • Playback Mgr │    │ • Visual FX     │
│ • Playback      │    │ • Message Relay │    │ • Action Exec  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Services     │
                    │                 │
                    │ • Gemini Live  │
                    │ • Storage      │
                    │ • Validator    │
                    │ • Integration  │
                    └─────────────────┘
```

### Message Flow
```
Voice Command → Voice Handler → Gemini Live → Command Parser → Playback Engine → Content Script → DOM
     ↑                                                                 ↓
Audio Feedback ← Voice Handler ← Background ← Content Script ← Action Results ← Visual Effects
```

### Key Services

#### VoiceHandler (`src/background/voiceHandler.js`)
- Manages voice sessions and audio streaming
- Coordinates with Gemini Live API
- Handles command history and feedback

#### PlaybackEngine (`src/services/playbackEngine.js`)
- Executes action sequences with precise timing
- Provides visual and audio feedback
- Handles state management and error recovery

#### VoicePlaybackIntegration (`src/services/voicePlaybackIntegration.js`)
- Bridges voice commands to playback execution
- Manages command queues and job tracking
- Ensures state consistency

---

## 🧪 Testing

### Test Suite Overview
- **78+ comprehensive tests** covering all major components
- **75%+ code coverage** for new development
- **Multiple test types**: Unit, Integration, UI, E2E
- **Automated CI/CD** with quality gates

### Running Tests
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/services/voiceControl.test.js
```

### Test Categories
- **Voice Control Tests** (15): Web Audio API, Gemini Live, command parsing
- **Settings Tests** (12): Storage sync, validation, import/export
- **Playback Tests** (18): Action execution, state management, error recovery
- **Integration Tests** (27): End-to-end flows, message passing
- **UI Tests** (6): Settings panels, tabs, interactions

---

## 🔧 Development

### Project Structure
```
ai_clicker/
├── src/
│   ├── background/          # Background scripts
│   ├── content/            # Content scripts
│   ├── popup/              # Popup interface
│   ├── services/           # Core services
│   ├── settings/           # Settings system
│   └── common/            # Shared utilities
├── tests/                 # Test suite
├── docs/                  # Documentation
├── .github/workflows/      # CI/CD pipelines
└── deploy/                # Built extension
```

### Build System
```bash
# Development build with sourcemaps
npm run build:dev

# Production build with optimization
npm run build:prod

# Watch mode for development
npm run build:watch

# Clean build artifacts
npm run clean
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check (if applicable)
npm run type-check
```

---

## 📚 Documentation

### User Guides
- [**Voice Control Guide**](docs/VOICE_CONTROL.md) - Complete voice command reference
- [**Playback Engine Guide**](docs/PLAYBACK_ENGINE.md) - Recording and playback documentation
- [**Settings System Guide**](docs/SETTINGS_SYSTEM.md) - Configuration and customization

### Developer Resources
- [**Testing Guide**](docs/TESTING.md) - Testing strategy and best practices
- [**API Reference**](docs/API.md) - Complete API documentation
- [**Architecture Overview**](docs/ARCHITECTURE.md) - System design and patterns

### Additional Resources
- [**Contributing Guide**](CONTRIBUTING.md) - How to contribute to development
- [**Development Setup**](DEVELOPMENT.md) - Local development environment
- [**Changelog**](CHANGELOG.md) - Version history and updates

---

## 🔒 Security & Privacy

### Data Protection
- **API Keys**: Stored securely in Chrome storage with encryption
- **Audio Data**: Processed in real-time, not stored locally
- **Settings**: Synchronized with user consent
- **Privacy**: No data collection without explicit permission

### Permissions Required
- `activeTab`: Access current tab for automation
- `scripting`: Inject content scripts for DOM manipulation
- `storage`: Save settings and preferences
- `tabs`: Manage tab state and navigation
- `microphone`: Voice control (optional, user-granted)

### Security Measures
- **Content Security Policy**: Strict CSP for XSS prevention
- **Input Validation**: Comprehensive validation of all inputs
- **API Security**: Secure transmission to external services
- **Permission Minimization**: Request only necessary permissions

---

## 🐛 Troubleshooting

### Common Issues

#### Voice Control Not Working
1. **Check Microphone**: Ensure microphone is connected and permitted
2. **API Key**: Verify Gemini API key is valid and active
3. **Network**: Check internet connection and API accessibility
4. **Language**: Ensure correct language settings

#### Playback Not Executing
1. **Element Selectors**: Verify selectors are valid and elements exist
2. **Page Load**: Ensure page is fully loaded before playback
3. **Permissions**: Check extension has necessary permissions
4. **JavaScript**: Ensure page allows JavaScript execution

#### Settings Not Saving
1. **Storage Quota**: Check Chrome storage quota isn't exceeded
2. **Sync Status**: Verify Chrome sync is working properly
3. **Validation**: Ensure all settings pass validation
4. **Browser Restart**: Try restarting Chrome browser

### Debug Mode
Enable debug mode for detailed logging:
1. Go to Settings → Advanced tab
2. Enable "Debug Mode"
3. Check browser console for detailed logs
4. Use browser DevTools for step-by-step debugging

### Getting Help
- **GitHub Issues**: [Report bugs](https://github.com/crosspostly/ai_clicker/issues)
- **Discussions**: [Community forum](https://github.com/crosspostly/ai_clicker/discussions)
- **Documentation**: [Complete docs](docs/)
- **Email**: support@ai-autoclicker.com

---

## 🤝 Contributing

We welcome contributions! See [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit pull request

### Code Standards
- **ESLint**: Follow project linting rules
- **Testing**: Maintain 75%+ coverage
- **Documentation**: Update docs for new features
- **Commits**: Use conventional commit messages

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI processing and natural language understanding
- **Chrome Extensions API** - Browser automation capabilities
- **Open Source Community** - Tools, libraries, and inspiration
- **Beta Testers** - Valuable feedback and bug reports

---

## 🚀 What's Next

### v3.1.0 (Planned)
- **Advanced Voice Commands**: Context-aware and conditional commands
- **Visual AI**: Element detection using computer vision
- **Custom Shortcuts**: User-defined keyboard shortcuts
- **Performance Analytics**: Usage statistics and optimization suggestions

### v3.2.0 (Future)
- **Multi-tab Control**: Coordinate actions across multiple tabs
- **Cloud Sync**: Settings and recordings cloud synchronization
- **Team Collaboration**: Share recordings and workflows
- **Mobile Support**: Firefox and Safari extensions

---

## 📊 Version 3.0.0 Highlights

- ✅ **78 comprehensive tests** with 75%+ coverage
- ✅ **Complete voice control system** with multi-language support
- ✅ **Advanced playback engine** with visual and audio feedback
- ✅ **5-tab settings interface** with real-time validation
- ✅ **Robust message architecture** for component communication
- ✅ **CI/CD pipeline** with automated testing and releases
- ✅ **Comprehensive documentation** and user guides
- ✅ **Security enhancements** and privacy protections
- ✅ **Performance optimizations** and memory management
- ✅ **Error recovery** and graceful failure handling

---

**AI Autoclicker v3.0.0** - The future of browser automation is here! 🎤🤖

[⬇️ Download v3.0.0](https://github.com/crosspostly/ai_clicker/releases/tag/v3.0.0) • [📖 Documentation](docs/) • [🐛 Report Issues](https://github.com/crosspostly/ai_clicker/issues) • [💬 Discussions](https://github.com/crosspostly/ai_clicker/discussions)