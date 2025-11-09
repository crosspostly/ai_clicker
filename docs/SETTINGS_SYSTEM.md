# Settings System

The Settings System provides a comprehensive 5-tab interface for configuring all aspects of the AI Autoclicker extension with persistent storage, validation, and import/export capabilities.

## Overview

The Settings System offers a user-friendly interface for managing extension preferences, API configurations, theme settings, and advanced options. It features Chrome storage sync for cross-device synchronization and robust validation for all settings.

## Features

- **5-Tab Interface**: General, Voice, Playback, Advanced, and About tabs
- **Chrome Storage Sync**: Automatic synchronization across devices
- **Comprehensive Validation**: Real-time validation with helpful error messages
- **Import/Export**: Backup and restore settings with JSON format
- **Theme Support**: Light, dark, and auto theme detection
- **Keyboard Shortcuts**: Configurable shortcuts for common actions
- **Reset Functionality**: Reset to defaults with confirmation

## Interface Overview

### Tab Navigation
The settings interface uses a tab-based layout for organized access to different setting categories:

```
[General] [Voice] [Playback] [Advanced] [About]
```

Each tab contains related settings organized into logical sections with clear labels and helpful descriptions.

## General Settings

### Appearance

#### Theme Selection
```javascript
{
  theme: 'light' | 'dark' | 'auto'
}
```

**Options:**
- **Light**: Classic light theme with high contrast
- **Dark**: Dark theme for reduced eye strain
- **Auto**: Automatically switches based on system preference

#### Custom Colors
```javascript
{
  customColors: {
    primary: '#1a73e8',
    background: '#ffffff',
    text: '#202124',
    accent: '#4285f4'
  }
}
```

### Behavior

#### Auto-save
```javascript
{
  autoSave: boolean  // Automatically save changes
}
```

When enabled, settings are saved immediately when changed. When disabled, users must manually save changes.

#### Notifications
```javascript
{
  notifications: {
    enabled: boolean,
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
    duration: number  // milliseconds
  }
}
```

## Voice Settings

### API Configuration

#### Gemini API Key
```javascript
{
  gemini: {
    apiKey: string  // Google Gemini API key
  }
}
```

**Security:**
- Keys are stored securely in Chrome storage
- Encrypted transmission to API
- No keys exposed in source code
- Regular validation of key format

#### Model Selection
```javascript
{
  gemini: {
    model: 'auto' | 'gemini-2.0-flash-exp' | 'gemini-2.0-flash-001' | 'gemini-1.5-flash' | 'gemini-1.5-pro'
  }
}
```

**Models:**
- **Auto**: Automatically selects best available model
- **gemini-2.0-flash-exp**: Latest experimental model
- **gemini-2.0-flash-001**: Stable 2.0 flash model
- **gemini-1.5-flash**: Fast and efficient model
- **gemini-1.5-pro**: High accuracy model

### Language Settings

#### Voice Language
```javascript
{
  gemini: {
    language: 'en' | 'ru' | 'auto'
  }
}
```

**Languages:**
- **English**: Full English language support
- **Russian**: Native Russian language processing
- **Auto**: Automatic language detection

#### Voice Settings
```javascript
{
  voice: {
    sensitivity: number,      // 0.0 - 1.0
    autoGainControl: boolean,
    noiseSuppression: boolean,
    echoCancellation: boolean
  }
}
```

### Audio Feedback

#### Voice Feedback
```javascript
{
  voice: {
    audioFeedback: boolean,
    transcriptionEnabled: boolean,
    commandConfirmation: boolean
  }
}
```

## Playback Settings

### Speed Control

#### Playback Speed
```javascript
{
  playback: {
    speed: number  // 0.5 - 3.0 (multiplier)
  }
}
```

**Speed Options:**
- **0.5x**: Half speed for precise control
- **1.0x**: Normal speed
- **1.5x**: 50% faster
- **2.0x**: Double speed
- **3.0x**: Triple speed for quick execution

#### Timing Settings
```javascript
{
  playback: {
    defaultDelay: number,      // milliseconds between actions
    clickDelay: number,         // delay after clicks
    inputDelay: number,        // delay after input
    scrollDelay: number        // delay after scrolling
  }
}
```

### Visual Effects

#### Animation Settings
```javascript
{
  playback: {
    animations: {
      enabled: boolean,
      duration: number,       // milliseconds
      highlightColor: string,
      progressBar: boolean,
      elementHighlight: boolean
    }
  }
}
```

#### Audio Feedback
```javascript
{
  playback: {
    audio: {
      enabled: boolean,
      successSound: string,    // audio file path
      errorSound: string,      // audio file path
      completionSound: string,  // audio file path
      volume: number          // 0.0 - 1.0
    }
  }
}
```

## Advanced Settings

### Performance

#### Timeout Settings
```javascript
{
  advanced: {
    timeouts: {
      actionTimeout: number,     // milliseconds
      apiTimeout: number,        // milliseconds
      elementWaitTimeout: number  // milliseconds
    }
  }
}
```

#### Retry Logic
```javascript
{
  advanced: {
    retry: {
      maxAttempts: number,
      baseDelay: number,         // milliseconds
      maxDelay: number,          // milliseconds
      backoffFactor: number
    }
  }
}
```

### Debugging

#### Debug Mode
```javascript
{
  advanced: {
    debug: {
      enabled: boolean,
      logLevel: 'error' | 'warn' | 'info' | 'debug',
      consoleOutput: boolean,
      fileLogging: boolean
    }
  }
}
```

#### Developer Options
```javascript
{
  advanced: {
    developer: {
      showElementSelectors: boolean,
      highlightElements: boolean,
      showTimingInfo: boolean,
      enableExperimentalFeatures: boolean
    }
  }
}
```

### Storage

#### Storage Management
```javascript
{
  advanced: {
    storage: {
      maxHistorySize: number,    // number of items
      autoCleanup: boolean,
      backupInterval: number,     // hours
      compressionEnabled: boolean
    }
  }
}
```

## About Tab

### Version Information
```javascript
{
  version: {
    current: '3.0.0',
    build: string,
    releaseDate: string,
    updateAvailable: boolean
  }
}
```

### System Information
```javascript
{
  system: {
    browser: string,
    browserVersion: string,
    platform: string,
    extensionId: string,
    permissions: Array<string>
  }
}
```

### Resources
- Documentation links
- Support contacts
- Community resources
- Privacy policy
- License information

## API Reference

### SettingsValidator Class

#### Validation Methods

##### `validateApiKey(key)`
Validates Gemini API key format.

```javascript
const result = validator.validateApiKey('AIzaSyDaGmWKa4JsXZ-HjGw63IS5dN4');
// Returns: { isValid: true, message: 'Valid API key' }
```

##### `validateModel(model)`
Validates model selection.

```javascript
const result = validator.validateModel('gemini-2.0-flash-exp');
// Returns: { isValid: true, message: 'Valid model' }
```

##### `validateSettings(settings)`
Validates complete settings object.

```javascript
const result = validator.validateSettings({
  gemini: { apiKey: 'AIza...', model: 'auto' },
  theme: 'dark',
  playback: { speed: 1.5 }
});
// Returns: { isValid: boolean, errors: Array<string>, warnings: Array<string> }
```

### StorageService Class

#### Storage Methods

##### `saveSettings(settings)`
Saves settings to Chrome storage.

```javascript
const result = await storageService.saveSettings(settings);
// Returns: { success: boolean, error?: string }
```

##### `loadSettings()`
Loads settings from Chrome storage.

```javascript
const settings = await storageService.loadSettings();
// Returns: settings object
```

##### `exportSettings()`
Exports settings to JSON string.

```javascript
const exportData = await storageService.exportSettings();
// Returns: JSON string with metadata
```

##### `importSettings(jsonData, options)`
Imports settings from JSON string.

```javascript
const result = await storageService.importSettings(jsonData, {
  merge: true,      // Merge with existing settings
  validate: true     // Validate imported settings
});
// Returns: { success: boolean, errors?: Array<string>, warnings?: Array<string> }
```

## Import/Export

### Export Format
Settings are exported as JSON with metadata:

```json
{
  "version": "3.0.0",
  "exportDate": "2024-01-15T10:30:00.000Z",
  "settings": {
    "gemini": {
      "apiKey": "AIzaSyDaGmWKa4JsXZ-HjGw63IS5dN4",
      "model": "auto",
      "language": "en"
    },
    "theme": "dark",
    "playback": {
      "speed": 1.5,
      "audio": {
        "enabled": true,
        "volume": 0.8
      }
    }
  },
  "metadata": {
    "exportedBy": "AI Autoclicker v3.0.0",
    "checksum": "abc123..."
  }
}
```

### Import Options
```javascript
const importOptions = {
  merge: boolean,        // Merge with existing settings
  overwrite: boolean,    // Overwrite existing values
  validate: boolean,     // Validate imported settings
  backup: boolean        // Create backup before import
};
```

### Version Compatibility
The import system handles version differences:

```javascript
const versionMapping = {
  '2.0.0': {
    'gemini.apiKey': 'api.gemini.key',
    'theme': 'appearance.theme'
  },
  '1.0.0': {
    'apiKey': 'api.gemini.key'
  }
};
```

## Keyboard Shortcuts

### Default Shortcuts
```javascript
const defaultShortcuts = {
  'Ctrl+S': 'saveSettings',
  'Ctrl+Z': 'undo',
  'Ctrl+Y': 'redo',
  'Ctrl+R': 'resetToDefaults',
  'Ctrl+E': 'exportSettings',
  'Ctrl+I': 'importSettings',
  'Ctrl+T': 'toggleTheme',
  'F1': 'showHelp'
};
```

### Custom Shortcuts
Users can customize keyboard shortcuts:

```javascript
const customShortcuts = {
  'Ctrl+Alt+S': 'saveSettings',
  'Ctrl+Shift+Z': 'undo',
  'Ctrl+Shift+Y': 'redo'
};
```

## Validation Rules

### API Key Validation
```javascript
const apiKeyRules = {
  required: true,
  minLength: 39,
  maxLength: 39,
  pattern: /^AIzaSy[A-Za-z0-9_-]{33}$/,
  message: 'Invalid Gemini API key format'
};
```

### Model Validation
```javascript
const modelRules = {
  allowedValues: [
    'auto',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ],
  message: 'Invalid model selection'
};
```

### Speed Validation
```javascript
const speedRules = {
  type: 'number',
  min: 0.5,
  max: 3.0,
  step: 0.1,
  message: 'Speed must be between 0.5 and 3.0'
};
```

## Error Handling

### Validation Errors
```javascript
{
  field: 'gemini.apiKey',
  type: 'validation',
  message: 'API key is required',
  code: 'REQUIRED_FIELD'
}
```

### Storage Errors
```javascript
{
  type: 'storage',
  operation: 'save',
  message: 'Storage quota exceeded',
  code: 'QUOTA_EXCEEDED',
  recoverable: true
}
```

### Import Errors
```javascript
{
  type: 'import',
  stage: 'parsing',
  message: 'Invalid JSON format',
  line: 15,
  column: 3,
  code: 'JSON_PARSE_ERROR'
}
```

## Performance Optimization

### Lazy Loading
Settings tabs are loaded on demand:

```javascript
const tabLoaders = {
  general: () => import('./tabs/general.js'),
  voice: () => import('./tabs/voice.js'),
  playback: () => import('./tabs/playback.js'),
  advanced: () => import('./tabs/advanced.js'),
  about: () => import('./tabs/about.js')
};
```

### Debouncing
Input changes are debounced to reduce save operations:

```javascript
const debouncedSave = debounce((settings) => {
  storageService.saveSettings(settings);
}, 500);
```

### Caching
Frequently accessed settings are cached:

```javascript
const settingsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedSetting(key) {
  const cached = settingsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  return null;
}
```

## Security Considerations

### API Key Protection
- Keys stored in encrypted Chrome storage
- No keys in localStorage or cookies
- Secure transmission to API endpoints
- Key rotation support

### Data Validation
- All user inputs validated
- XSS prevention in settings display
- CSRF protection for save operations
- Content Security Policy compliance

### Privacy Protection
- Minimal data collection
- No analytics without consent
- Local storage preference
- Data export for portability

## Testing

### Unit Tests
```javascript
describe('SettingsValidator', () => {
  test('should validate API key format', () => {
    const result = validator.validateApiKey('AIzaSyInvalid');
    expect(result.isValid).toBe(false);
  });
});
```

### Integration Tests
```javascript
describe('Settings Integration', () => {
  test('should save and load settings', async () => {
    const settings = { theme: 'dark' };
    await storageService.saveSettings(settings);
    const loaded = await storageService.loadSettings();
    expect(loaded.theme).toBe('dark');
  });
});
```

### E2E Tests
```javascript
describe('Settings UI', () => {
  test('should switch tabs correctly', async () => {
    await page.click('[data-tab="voice"]');
    expect(await page.isVisible('#voice-tab')).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

#### Settings Not Saving
1. Check Chrome storage permissions
2. Verify storage quota not exceeded
3. Check for validation errors
4. Try browser restart

#### Import Fails
1. Verify JSON format is valid
2. Check version compatibility
3. Ensure no corrupted data
4. Try manual validation

#### Theme Not Applying
1. Check CSS file loading
2. Verify theme settings saved
3. Clear browser cache
4. Check for CSS conflicts

### Debug Tools

#### Console Logging
```javascript
settingsService.setDebugMode(true);
// Enables detailed logging
```

#### Settings Inspector
```javascript
// View all current settings
console.log(await storageService.loadSettings());

// View storage usage
console.log(await storageService.getStorageInfo());
```

## Future Enhancements

### Planned Features
- Settings synchronization with cloud storage
- Advanced theming with custom CSS
- Settings templates for different use cases
- Integration with external configuration tools
- Settings analytics and usage tracking

### Technical Improvements
- IndexedDB for large settings storage
- Web Workers for heavy processing
- Service Worker for background sync
- Progressive Web App support
- Advanced validation with custom rules

---

**Settings System v3.0.0** - Complete control over your automation experience! ⚙️