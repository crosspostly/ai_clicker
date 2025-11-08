# Deployment Guide - AI-Autoclicker v2.0.0

## For End Users

### Installation from Chrome Web Store
*(When published)*

1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "ИИ-Автокликер" or "AI-Autoclicker"
3. Click "Add to Chrome"
4. Grant requested permissions
5. Click extension icon to open popup

### Installation from Local Files

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-autoclicker.git
cd ai-autoclicker
```

2. Build the extension:
```bash
npm install
npm run build
```

3. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top-right)
   - Click "Load unpacked"
   - Select the `dist/` folder
   - Extension appears in toolbar

### First Time Setup

1. **Open extension settings** (⚙️ button in popup)
2. **Add Google Gemini API key** (optional but recommended):
   - Get free key at [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Paste into settings
   - Click "🧪 Test" to verify connection
3. **Start using**:
   - Switch to "Manual" for recording
   - Switch to "Automatic" for AI-powered automation

## For Developers

### Development Environment Setup

```bash
# Clone and setup
git clone https://github.com/yourusername/ai-autoclicker.git
cd ai-autoclicker

# Install dependencies
npm install

# Start development
npm run dev
```

The `npm run dev` command will:
- Build the extension to `dist/`
- Watch for file changes
- Auto-rebuild when you save

### Development Workflow

1. **Make changes** to files in `src/`
2. **Save** - auto-rebuild triggers
3. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Find AI-Autoclicker
   - Click the refresh/reload button
4. **Test** the changes
5. **Commit** when working

### Testing Your Changes

#### Unit Testing
```bash
npm test
```

#### Manual Testing Checklist
- [ ] Record simple click
- [ ] Record text input
- [ ] Playback at normal speed
- [ ] Playback at 2x speed
- [ ] Test AI parsing (if API key added)
- [ ] Export actions
- [ ] Import actions
- [ ] Check console for errors (F12)

#### Browser Testing
Test on:
- Chrome 88+ (primary)
- Edge 88+ (Chromium-based)
- Opera 74+ (Chromium-based)

### Code Quality

Before committing:

```bash
# Check code quality
npm run lint

# Format code
npm run format
```

### Debugging

#### Inspect Popup
1. Right-click extension icon
2. Select "Inspect popup"
3. Console tab shows errors

#### Inspect Content Script
1. Open page where extension runs
2. Press F12 for DevTools
3. Console tab shows content script logs

#### Inspect Background Script
1. Go to `chrome://extensions/`
2. Find AI-Autoclicker
3. Click "Service Worker" link
4. Console shows background logs

#### Common Debug Patterns

```javascript
// In any script
console.log('Debug:', value);
console.error('Error:', error);

// In popup/settings
chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  console.log('Active tab:', tabs[0]);
});

// In content script
console.log('Page title:', document.title);
console.log('Element found:', elementFinder.find('text'));
```

## For Release / Publishing

### Version Bump

1. Update version in `package.json`:
```json
{
  "version": "2.0.1"
}
```

2. Update version in `src/manifest.json`:
```json
{
  "version": "2.0.1"
}
```

3. Add entry to `CHANGELOG.md`:
```markdown
## [2.0.1] - 2024-11-10

### Fixed
- Bug fix description
```

### Build for Release

```bash
# Clean build
npm run build

# Verify dist/ folder
ls dist/

# Test build in Chrome as unpacked
```

### Create Release Package

```bash
# Create zip (Linux/Mac)
cd dist && zip -r ../ai-autoclicker-2.0.1.zip . && cd ..

# Verify zip
unzip -l ai-autoclicker-2.0.1.zip | head -20
```

### Publishing to Chrome Web Store

1. **Create developer account**:
   - Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole)
   - Sign in with Google account
   - Pay $5 one-time registration fee

2. **Prepare listing**:
   - Write clear description
   - Create screenshots (1280x800px)
   - Upload icon (128x128px)
   - Add promotional images

3. **Upload extension**:
   - Drag-drop `ai-autoclicker-2.0.1.zip` to console
   - Fill metadata
   - Submit for review

4. **Wait for review**:
   - Google reviews typically within 24 hours
   - May request changes
   - Once approved, extension goes live

### Post-Release

1. **Create GitHub Release**:
```bash
git tag v2.0.1
git push origin v2.0.1
```

2. **Upload to GitHub**:
   - Go to Releases
   - Create new release
   - Attach zip file
   - Add changelog notes

3. **Announce**:
   - Update website/docs
   - Notify users via email/social
   - Pin release in discussions

## Troubleshooting Deployment

### Extension Won't Load
- Check manifest.json validity: `node -e "require('./dist/manifest.json')"`
- Verify all referenced files exist
- Check JavaScript syntax: `node -c dist/content/content.js`

### Features Not Working
- Ensure all scripts loaded: Check content_scripts in manifest
- Verify CSS applied: Inspect element in DevTools
- Check message passing: Look for errors in console

### Performance Issues
- Check for memory leaks: Check DevTools Memory tab
- Verify caching works: Inspect ElementFinder.getCacheStats()
- Monitor extension size: `du -sh dist/`

### Testing Failed
- Clear cache: `npm run build` again
- Reload extension: `chrome://extensions/` → Reload
- Clear storage: Settings → Clear all data

## File Organization for Distribution

```
dist/
├── manifest.json          # Extension config
├── common/                # Utilities
│   ├── constants.js
│   ├── logger.js
│   ├── validator.js
│   ├── storage.js
│   └── helpers.js
├── popup/                 # Popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/               # Content script
│   ├── content.js
│   ├── content.css
│   ├── ElementFinder.js
│   ├── ActionRecorder.js
│   └── ActionExecutor.js
├── background/            # Background worker
│   └── background.js
├── settings/              # Settings page
│   ├── settings.html
│   ├── settings.css
│   └── settings.js
└── ai/                    # AI modules
    └── InstructionParser.js
```

## Maintenance

### Regular Tasks

**Weekly**:
- Review GitHub issues
- Monitor error reports
- Check user feedback

**Monthly**:
- Update dependencies: `npm outdated`
- Run security audit: `npm audit`
- Test on latest Chrome version

**Quarterly**:
- Review performance metrics
- Refactor code if needed
- Plan next version features

### Version Support

- **v2.0.x**: Current - bug fixes and minor improvements
- **v1.0.x**: Deprecated - critical bugs only
- Older versions: Not supported

## Rollback Procedure

If critical issue found after release:

```bash
# Revert commit
git revert v2.0.1

# Push update
npm run build
# Re-publish to store with patch version (2.0.2)

# Announce issue and fix
```

## Monitoring

### Error Tracking
Consider using:
- [Sentry](https://sentry.io) - Error tracking
- [Google Analytics](https://analytics.google.com) - Usage metrics
- GitHub Issues - User bug reports

### User Analytics
Track:
- Installation numbers
- Daily active users
- Feature usage
- Error rates
- Performance metrics

## License & Attribution

When publishing, include:
- License file (MIT)
- Authors/contributors list
- Third-party libraries used
- Links to source repository

Example footer:
```
AI-Autoclicker v2.0.0
Made with ❤️ by [Your Name]
Licensed under MIT License
GitHub: github.com/yourusername/ai-autoclicker
```

---

**Last Updated**: November 8, 2024  
**Version**: 2.0.0  
**Status**: Ready for Production
