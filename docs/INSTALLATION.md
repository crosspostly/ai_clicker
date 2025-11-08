# 📦 Installation Guide

Complete guide to install and set up AI-Autoclicker v2.0 Chrome extension.

---

## 🎯 Prerequisites

### System Requirements
- **Chrome Browser** version 88+ (Chrome Extension Manifest V3 compatible)
- **Node.js** 16+ and npm (for development)
- **Git** (for cloning repository)

### Optional Requirements
- **Google Gemini API Key** (for AI-powered automation)
  - Get free key: [Google AI Studio](https://makersuite.google.com/app/apikey)
  - 1,000 free requests per day
  - No credit card required

---

## 🚀 Quick Installation

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/crosspostly/ai_clicker.git
cd ai_clicker
```

### Step 2: Install Dependencies

```bash
# Install npm dependencies
npm install

# Verify installation
npm --version  # Should be 8+
node --version # Should be 16+
```

### Step 3: Build Extension

```bash
# Build for development
npm run build

# Or build for production
npm run build:prod
```

**Expected Output:**
```
🚀 Starting build process...
🔨 Running Rollup bundler...
✅ Rollup bundling complete!
📋 Copying static files...
✅ Copied manifest.json
✅ Copied popup.html -> popup.html
✅ Copied settings.html -> settings.html
✅ Copied popup.css -> popup.css
✅ Copied settings.css -> settings.css
✅ Copied content.css -> content.css
✅ Copied icon16.png
✅ Copied icon48.png
✅ Copied icon128.png
🔍 Verifying build...
✅ All required files present in deploy/
📊 Checking bundle sizes...
📦 content.js: 45.23 KB
📦 popup.js: 23.87 KB
📦 settings.js: 18.45 KB
📦 background.js: 12.34 KB

✅ Build complete! Extension ready in deploy/ (2.34s)
```

### Step 4: Load in Chrome

1. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

2. **Load Extension**
   - Click "Load unpacked extension"
   - Select the `deploy/` folder from the project
   - Click "Select Folder"

3. **Verify Installation**
   - AI-Autoclicker icon appears in Chrome toolbar
   - Extension listed in chrome://extensions/ with details
   - No error messages in extension details

---

## 🔧 Development Setup

### Watch Mode Development

For active development with auto-rebuild:

```bash
# Start watch mode
npm run build:watch

# In another terminal, run tests
npm run test:watch
```

**Workflow:**
1. Make code changes in `src/`
2. Rollup automatically rebuilds to `deploy/`
3. Reload extension in Chrome (click reload icon)
4. Test changes immediately

### Development Commands

```bash
# Development
npm run build:dev        # Development build with source maps
npm run build:watch      # Watch mode for development
npm run build:prod       # Production build with minification

# Code Quality
npm run lint            # ESLint check and fix
npm run format           # Prettier formatting

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode for testing
npm run test:coverage    # Coverage report

# Utilities
npm run clean            # Clean build artifacts
```

---

## 🤖 AI Configuration

### Getting Gemini API Key

1. **Visit Google AI Studio**
   - Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Sign in with Google account
   - Click "Create API Key"

2. **Configure Extension**
   - Click AI-Autoclicker icon in Chrome toolbar
   - Go to Settings tab
   - Enter API key in "Gemini API Key" field
   - Click "Save Settings"

3. **Test AI Integration**
   - Go to any webpage
   - Open AI-Autoclicker popup
   - Switch to "Automatic" tab
   - Enter: "Click the login button"
   - Click "Run AI"
   - Should see action executed

### AI Models Used

The extension automatically tries Gemini models in this order:

1. **gemini-2.0-flash** (primary) - Fast, stable, cost-effective
2. **gemini-2.5-flash** (fallback) - Latest features, good reasoning
3. **gemini-2.5-pro** (last resort) - Most capable, slower

---

## 📁 File Structure After Installation

```
ai_clicker/
├── src/                    # Source code (development)
│   ├── common/              # Shared utilities
│   ├── ai/                  # AI processing
│   ├── popup/               # Extension popup
│   ├── settings/            # Settings page
│   ├── background/           # Service worker
│   ├── content/             # Content scripts
│   └── images/              # Extension icons
├── deploy/                 # Built extension (load this in Chrome)
│   ├── manifest.json         # Extension manifest
│   ├── content.js           # Bundled content script
│   ├── popup.js             # Bundled popup script
│   ├── settings.js          # Bundled settings script
│   ├── background.js         # Bundled service worker
│   ├── popup.html           # Popup interface
│   ├── settings.html         # Settings interface
│   ├── *.css               # Stylesheets
│   └── images/             # Extension icons
├── tests/                  # Test suite
├── docs/                   # Documentation
└── package.json            # Node.js configuration
```

---

## 🐛 Troubleshooting

### Common Installation Issues

#### Extension Won't Load

**Problem:** "Could not load extension" error in Chrome

**Solutions:**
```bash
# 1. Check build completed successfully
npm run build
# Look for "Build complete!" message

# 2. Verify deploy/ folder exists
ls -la deploy/
# Should see manifest.json, *.js, *.html files

# 3. Check manifest.json syntax
cat deploy/manifest.json
# Should be valid JSON
```

#### Build Errors

**Problem:** npm run build fails

**Common Solutions:**
```bash
# 1. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Check Node.js version
node --version  # Should be 16+
npm --version   # Should be 8+

# 3. Update dependencies
npm update
```

#### Extension Permissions Error

**Problem:** "Permissions denied" or similar errors

**Solutions:**
1. **Check manifest.json permissions** - Should include:
   ```json
   "permissions": ["activeTab", "storage"],
   "host_permissions": ["<all_urls>"],
   "background": { "service_worker": "..." }
   ```

2. **Reload extension** after fixing manifest
3. **Restart Chrome** if permissions persist

#### AI Features Not Working

**Problem:** AI mode gives errors

**Solutions:**
1. **Verify API key** in settings
2. **Check internet connection**
3. **Test API key manually:**
   ```bash
   curl -H "Content-Type: application/json" \
        -d '{"contents":[{"parts":[{"text":"Hello"}]}' \
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY"
   ```

### Development Issues

#### Watch Mode Not Working

**Problem:** Changes not reflected after editing files

**Solutions:**
```bash
# 1. Ensure Rollup is running
npm run build:watch
# Should see "Watching for file changes..." message

# 2. Check file permissions
ls -la src/
# Ensure write permissions on source files

# 3. Manually reload extension
# Click reload icon in chrome://extensions/
```

#### Tests Failing

**Problem:** npm test fails

**Solutions:**
```bash
# 1. Install test dependencies
npm install --include=dev

# 2. Check Jest configuration
cat jest.config.js
# Verify testMatch includes tests/ directory

# 3. Run specific test file
npm test -- content/element-finder.test.js
```

---

## 🔄 Updates and Maintenance

### Updating the Extension

```bash
# 1. Pull latest changes
git pull origin main

# 2. Update dependencies
npm update

# 3. Rebuild
npm run build

# 4. Reload extension in Chrome
# chrome://extensions/ → Click reload icon
```

### Cleaning Build Artifacts

```bash
# Clean all build files
npm run clean

# Manual clean (if needed)
rm -rf deploy/
rm -f *.zip
```

---

## 📚 Next Steps

After successful installation:

1. **[Read Usage Guide](../README.md#usage)** - Learn basic automation
2. **[Explore Development](DEVELOPMENT.md)** - Start customizing
3. **[Run Tests](TESTING.md)** - Verify your setup
4. **[Contribute](../CONTRIBUTING.md)** - Help improve the project

---

## 🔗 Additional Resources

- **[Development Guide](DEVELOPMENT.md)** - Local development workflows
- **[Architecture Overview](../ARCHITECTURE.md)** - System design
- **[Testing Documentation](TESTING.md)** - Jest testing setup
- **[Contributing Guide](../CONTRIBUTING.md)** - How to contribute
- **[GitHub Repository](https://github.com/crosspostly/ai_clicker)** - Source and issues

---

**Last Updated:** 2025-11-08  
**Version:** 2.0.0  
**Status:** 🟢 Current and Tested

---

*Need help? Check our [troubleshooting section](#troubleshooting) or [open an issue](https://github.com/crosspostly/ai_clicker/issues).*
