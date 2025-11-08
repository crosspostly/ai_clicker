# 📋 Changelog

All notable changes to AI-Autoclicker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2025-11-08

### Added
- 🏗️ **ES6 Modules Migration** - Complete migration from CommonJS to ES6 import/export syntax
- 📦 **Rollup Bundling** - Modern build system with 4 optimized bundles
- 🗺️ **Source Maps** - Debugging support for development builds
- 🧪 **Comprehensive Testing** - Jest test suite with 250+ tests and 43% coverage
- 🔧 **Modern Development Workflow** - Watch mode, hot reloading, and optimized builds
- 📁 **Modular Architecture** - Feature-based directory structure
- 🎯 **Event-Driven Communication** - Decoupled component architecture
- 🛡️ **Enhanced Security** - CSP compliance and input validation
- 📚 **Complete Documentation** - Comprehensive developer and user guides
- 🤖 **Gemini API 2.0/2.5** - Updated to latest stable models with fallback chain

### Changed
- 🔄 **Build System** - From file copying to Rollup bundling
- 📉 **Bundle Size** - Reduced from ~2-3MB to ~500KB
- ⚡ **Performance** - Faster loading and execution
- 🏗️ **Code Organization** - From flat to modular structure
- 🧪 **Testing Framework** - Jest with Chrome API mocks
- 📝 **Documentation** - Complete overhaul and modernization

### Fixed
- 🐛 **Gemini API Deprecation** - Migrated from deprecated `gemini-pro` to `gemini-2.0-flash`
- 🔧 **Build Pipeline** - Reliable bundling and verification
- 🧪 **Test Infrastructure** - Stable CI/CD with proper thresholds
- 📦 **Dependency Management** - Explicit ES6 imports/exports

### Removed
- 🗑️ **Legacy Documentation** - Archived outdated progress reports
- ❌ **CommonJS Modules** - Fully migrated to ES6
- 📁 **Flat File Structure** - Replaced with modular organization

### Security
- 🔒 **Input Validation** - Comprehensive validation through validator.js
- 🛡️ **XSS Prevention** - Proper escaping and CSP compliance
- 🔐 **API Key Security** - Secure storage and transmission

### Performance
- ⚡ **Bundle Optimization** - Tree-shaking and dead code elimination
- 🚀 **Load Times** - Reduced from ~500ms to ~200ms
- 📦 **Asset Optimization** - Minified production builds

---

## [1.x.x] - Legacy Versions

### Features
- Basic action recording and playback
- Manual mode without AI assistance
- Simple popup interface
- Chrome Extension V2 compatibility

### Known Issues
- No ES6 module support
- Large bundle sizes
- Limited testing coverage
- Deprecated Gemini API models

---

## Migration Guide

### From v1.x to v2.0

**Breaking Changes:**
- Extension is incompatible with v1.x scenarios
- New API key required for Gemini 2.0/2.5
- Different build process and file structure

**Steps:**
1. Export scenarios from v1.x (if needed)
2. Remove old extension
3. Install v2.0
4. Re-enter API key
5. Import scenarios (may require adjustments)

---

## Links

- [Installation Guide](docs/INSTALLATION.md)
- [Development Setup](docs/DEVELOPMENT.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Testing Documentation](docs/TESTING.md)
- [Gemini API Migration](docs/GEMINI-API-MIGRATION.md)

---

**Note:** For versions prior to 2.0.0, please refer to the archived documentation in `docs/archive/`.
