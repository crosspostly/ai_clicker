# 🤖 AI-Autoclicker v2.0.0

> **Status:** 🟢 Production Ready | Modern ES6 Architecture with Rollup Bundling

Powerful Chrome extension for web automation using Google Gemini AI and manual recording.

[![CI Status](https://github.com/crosspostly/ai_clicker/actions/workflows/ci.yml/badge.svg)](https://github.com/crosspostly/ai_clicker/actions)
[![Coverage](https://img.shields.io/badge/coverage-43%25-yellow)](https://github.com/crosspostly/ai_clicker)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚀 Quick Start

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
# Click "Load unpacked extension"
# Select deploy/ folder

# 5. Get API key (optional)
# https://makersuite.google.com/app/apikey
```

---

## ✨ Features

- 🎬 **Action Recording** - Automatic recording of clicks, input, scrolling
- 🤖 **AI Analysis** - Google Gemini converts text instructions to actions
- ⚡ **Playback** - Repeat scenarios with adjustable speed
- 💾 **Import/Export** - Save scenarios in JSON format
- 🔒 **Security** - Data validation and XSS protection
- 🏗️ **Modern Architecture** - ES6 modules with Rollup bundling
- 🧪 **Comprehensive Testing** - Jest test suite with 40%+ coverage

---

## 📁 Project Structure

```
src/
├── manifest.json           # Extension configuration
│
├── images/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── common/                 # Shared utilities (ES6 modules)
│   ├── constants.js        # Application constants
│   ├── logger.js           # Centralized logging
│   ├── validator.js        # Data and action validation
│   ├── storage.js          # Chrome Storage API wrapper
│   ├── helpers.js          # Utilities (delay, debounce, throttle)
│   └── events.js           # Event-driven communication
│
├── ai/                     # AI processing
│   └── InstructionParser.js  # Natural language → actions parsing
│
├── popup/                  # Extension popup UI
│   ├── index.html          # Main interface
│   ├── index.js            # UI logic (43% test coverage)
│   └── popup.css           # Styles
│
├── settings/               # Settings page
│   ├── index.html          # Gemini API settings
│   ├── index.js            # Configuration management
│   └── settings.css        # Settings styles
│
├── background/             # Background Service Worker
│   └── index.js            # Event listeners, message routing
│
├── content/                # Content scripts (page injection)
│   ├── index.js            # Main entry point
│   ├── content.css         # Visual indicators (recording, playback)
│   ├── recorder/
│   │   └── ActionRecorder.js  # User action recording (60% coverage)
│   ├── executor/
│   │   └── ActionExecutor.js  # Action execution (55% coverage)
│   └── finder/
│       └── ElementFinder.js   # Smart element selection (70% coverage)
│
├── rollup.config.js        # Rollup bundler configuration
└── __tests__/              # 250+ unit & integration tests
    ├── setup.js            # Jest + Chrome API mocks
    ├── common/             # Utility tests
    ├── ai/                 # AI parser tests
    └── integration/        # E2E scenarios

deploy/                      # Built extension (output)
├── content.js              # Bundled content script
├── popup.js                # Bundled popup script
├── settings.js             # Bundled settings script
├── background.js           # Bundled service worker
└── [static files...]       # HTML, CSS, images, manifest
```

---

## 🎯 Usage

### Manual Mode

1. Click the extension icon
2. Press **"🔴 Record"**
3. Perform actions on the page
4. Press **"⏹️ Stop"**
5. Press **"▶️ Play"** to replay

### AI Mode (with Gemini)

1. Switch to **"Automatic"** tab
2. Enter instructions in English or Russian:
   ```
   Click the Login button, enter email test@example.com, 
   enter password 12345, press submit
   ```
3. Press **"▶️ Run AI"**

### Example Instructions

**Login:**
```
Find the Email field and enter user@mail.com
Find the Password field and enter mypassword123
Click the Login button
```

**Form Filling:**
```
Enter "John Doe" in the Name field
Select "United States" from the Country dropdown
Check the "I agree to terms" checkbox
Click the Register button
```

**Navigation:**
```
Scroll down the page by 500 pixels
Wait 2 seconds
Click the Next link
```

---

## 🔧 Development

### Commands

```bash
# Installation
npm install              # Install dependencies

# Build
npm run build            # Development build → deploy/
npm run build:dev        # Development with Rollup watch
npm run build:prod       # Production build + minification
npm run build:watch      # Watch mode for development

# Code Quality
npm run lint             # ESLint check
npm run format           # Prettier formatting

# Testing
npm test                 # Run all tests (Jest)
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage report
npm run test:verbose     # Verbose test output

# Utilities
npm run clean            # Remove deploy/ and ZIP files
```

### Architecture

**Current State:**
- ✅ ES6 modules with import/export syntax
- ✅ Rollup bundling with 4 optimized bundles
- ✅ Modern build pipeline with minification
- ✅ Event-driven communication between modules
- ✅ Feature-based directory structure
- ✅ Source maps for development

**Bundle Structure:**
- `content.js` - Content scripts and page interaction
- `popup.js` - Extension popup interface
- `settings.js` - Settings and configuration
- `background.js` - Service worker and background tasks

**Principles:**
- ✅ Separation of concerns
- ✅ Single responsibility per module
- ✅ CSP compliance (no eval, no inline scripts)
- ✅ Explicit dependencies (no globals)
- ✅ Tree-shaking and dead code elimination

**Modules:**

| Module | Purpose | Test Coverage |
|--------|---------|---------------|
| `common/` | Shared utilities | 65% |
| `ai/` | Gemini integration | 50% |
| `popup/` | Extension UI | 40% |
| `settings/` | Configuration | 35% |
| `background/` | Service Worker | 30% |
| `content/` | Page scripts | 55% |

**Overall coverage:** 43% (target: 65-70%)

---

## 🧪 Testing

### Current State

```bash
# Statistics
✅ 250+ unit tests
✅ 15+ integration tests
✅ 43% code coverage
✅ Jest framework with Chrome API mocks
⚠️ E2E tests planned

# Running tests
npm test                  # All tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:verbose      # Verbose output
```

### Coverage Targets

**Current:** 43%  
**Target:** 65-70%  
**Roadmap:**
- Month 1: 43% → 55% (+30-40 tests)
- Month 2: 55% → 65% (+40-50 tests)
- Month 3: 65% → 70% (+20-30 tests)

### Why Not 100%?

**100% coverage is NOT needed:**
- Industry standard: 60-80%
- Last 20% requires 3x more effort
- Diminishing returns
- False sense of security
- Over-specification kills flexibility

**Optimal range: 65-75%**

---

## 🏗️ Build System

### How It Works

**Current Implementation:**
```javascript
// 1. Clean deploy/
await fs.remove('deploy/')

// 2. Rollup bundling
rollup -c src/rollup.config.js
// Creates 4 optimized bundles:
// - content.js (page interaction)
// - popup.js (extension UI)
// - settings.js (configuration)
// - background.js (service worker)

// 3. Copy static files
copy HTML, CSS, images, manifest.json

// 4. Verify build
check all required files exist
report bundle sizes
```

**✅ Features:**
- ✅ ES6 module bundling with Rollup
- ✅ Tree-shaking and dead code elimination
- ✅ Source maps for development
- ✅ Minification for production
- ✅ 4 optimized bundles instead of 300+ files

**Results:**
- 📦 4 optimized bundles
- ⚡ Fast loading
- 📏 Small size (~500KB vs 2-3MB)
- 🗺️ Source maps for debugging

**Bundle Structure:**
- `content.js` - Page interaction and automation
- `popup.js` - Extension popup interface
- `settings.js` - Configuration management
- `background.js` - Service worker and background tasks

---

## 📝 Форматы данных

### Действие (Action)

```json
{
  "type": "click",
  "selector": "button.login",
  "target": "Кнопка входа",
  "timestamp": 1699450000000
}
```

### Сценарий (JSON Export)

```json
[
  {
    "type": "click",
    "selector": "button.login",
    "target": "Войти"
  },
  {
    "type": "input",
    "selector": "input[name='email']",
    "value": "user@example.com"
  },
  {
    "type": "wait",
    "duration": 1000
  }
]
```

---

## 🐛 Устранение проблем

### Расширение не загружается
- Проверьте что загружена папка `deploy/`, а не `src/`
- Убедитесь что `npm run build` выполнен успешно
- Проверьте консоль на ошибки в `chrome://extensions/`

### AI не работает
- Проверьте API ключ в настройках
- Нажмите "🧪 Тест" для проверки соединения
- Лимит: 1000 бесплатных запросов в день

### Элементы не находятся
- Убедитесь что элемент виден на странице
- Используйте более конкретные описания
- Откройте консоль (F12) для отладки

### CI/CD падает
- Jest coverage threshold: 40% (временно)
- Планируется повышение до 65-70%

---

## 🔄 Migration from v1.x

**⚠️ Important:** v2.0 is incompatible with v1.x

**Migration Steps:**
1. Export scenarios from v1.x (if needed)
2. Remove old extension
3. Install v2.0
4. Re-enter API key
5. Import scenarios (some errors possible)

**What Changed:**
- ✅ New modular architecture
- ✅ ES6+ classes instead of global variables
- ✅ Event-driven system
- ✅ Enhanced security (CSP)
- ✅ New validation system
- ✅ Rollup bundling for performance

---

## 🗺️ Roadmap

### v2.1 (Month 1-2)
- [ ] Add 40-60 tests (coverage → 55%)
- [ ] Refactor popup UI
- [ ] Performance optimizations
- [ ] Enhanced error handling

### v2.2 (Month 2-3)
- [ ] Add 50-70 tests (coverage → 65%)
- [ ] E2E tests (Playwright)
- [ ] Security audit
- [ ] User experience improvements

### v2.3 (Month 3-4)
- [ ] Add 20-30 tests (coverage → 70%)
- [ ] Beta testing with users
- [ ] Internationalization (i18n)
- [ ] Advanced recording features

### v3.0 (Long-term)
- [ ] TypeScript migration
- [ ] Advanced AI features (GPT-4)
- [ ] Chrome Web Store publication
- [ ] Cross-browser support (Firefox, Edge)

---

## 📈 Project Metrics

### Current Metrics

| Metric | Value | Target |
|--------|-------|--------|
| **Lines of Code** | ~3,500 | N/A |
| **Test Coverage** | 43% | 65-70% |
| **Number of Tests** | 250+ | 400+ |
| **Build Size** | ~500 KB | <1 MB |
| **Bundle Count** | 4 files | 4 files |
| **Load Time** | ~200ms | <200ms |

### Quality Assessment

| Criteria | Score | Status |
|----------|-------|--------|
| Functionality | 9/10 | ✅ Excellent |
| Code Quality | 8/10 | ✅ Good |
| Testing | 7/10 | ✅ Good |
| Performance | 8/10 | ✅ Good |
| Security | 8/10 | ✅ Good |
| Documentation | 9/10 | ✅ Excellent |
| CI/CD | 8/10 | ✅ Good |
| Scalability | 7/10 | ✅ Good |

**Overall Score:** 8.0/10 (Production Ready)

---

## 📄 Documentation

### Core Documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Architecture details and module structure
- **[DEVELOPMENT.md](DEVELOPMENT.md)** — Development setup and workflows
- **[CHANGELOG.md](CHANGELOG.md)** — Version history and changes

### User & Developer Guides
- **[docs/README.md](docs/README.md)** — Complete documentation index
- **[docs/INSTALLATION.md](docs/INSTALLATION.md)** — Installation and setup guide
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** — Development workflows
- **[docs/TESTING.md](docs/TESTING.md)** — Testing with Jest

### API & Reference
- **[docs/GEMINI-API-MIGRATION.md](docs/GEMINI-API-MIGRATION.md)** — Gemini API migration guide
- **[docs/FINAL-READINESS-CHECK.md](docs/FINAL-READINESS-CHECK.md)** — Release readiness checklist

### Testing Documentation
- **[tests/README.md](tests/README.md)** — Test suite overview
- **[tests/docs/](tests/docs/)** — Test planning and batch guides

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

**Conventions (Conventional Commits):**
- `feat:` - new functionality
- `fix:` - bug fix
- `docs:` - documentation
- `refactor:` - refactoring without functionality change
- `test:` - adding/fixing tests
- `chore:` - build process changes

**PR Requirements:**
- ✅ Lint passed (`npm run lint`)
- ✅ Tests passed (`npm test`)
- ✅ Coverage not decreased
- ✅ Build works (`npm run build`)
- ✅ Documentation updated (if applicable)

---

## 📜 License

MIT License - see [LICENSE](LICENSE)

---

## 📞 Contact

**Author:** [crosspostly](https://github.com/crosspostly)  
**Repository:** [ai_clicker](https://github.com/crosspostly/ai_clicker)  
**Issues:** [GitHub Issues](https://github.com/crosspostly/ai_clicker/issues)

---

## 🙏 Acknowledgments

- **Google Gemini API** - AI processing
- **Jest** - Testing framework
- **Rollup** - Module bundling
- **ESLint** - Code quality
- **Chrome Extensions** - Platform

---

**Version:** 2.0.0  
**Updated:** 2025-11-08  
**Status:** 🟢 Production Ready (8.0/10)  

---

**⭐ If this project is useful, give it a star on GitHub!**