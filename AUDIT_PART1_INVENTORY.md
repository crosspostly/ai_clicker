# AUDIT Part 1: Architecture Inventory

## Phase V3.0 Part 1 - Complete Project Structure Analysis

---

## 1. Структура deploy/

### File Tree with Hierarchy and Sizes

```
deploy/
├── manifest.json                    (1.1K)
├── background.js                    (27K)
├── content.js                       (35K)
├── popup.js                         (22K)
├── voice.js                         (8.2K)
├── settings.js                      (23K)
├── popup.html                       (3.6K)
├── voice.html                       (9.8K)
├── settings.html                    (14K)
├── content.css                      (4.0K)
├── popup.css                        (7.3K)
├── settings.css                     (11K)
└── images/
    ├── icon16.png                   (3.8K)
    ├── icon48.png                   (3.8K)
    └── icon128.png                  (7.0K)
```

### Total Bundle Sizes
- **JavaScript Total**: 115.25 KB
- **CSS Total**: 22.3 KB  
- **HTML Total**: 27.4 KB
- **Images Total**: 14.6 KB
- **Grand Total**: 179.55 KB

---

## 2. Новые файлы Gemini Live (11 файлов)

### Core Gemini Live Files

| Path | Purpose | Dependencies |
|------|---------|--------------|
| `src/ai/GeminiLiveClient.js` | WebSocket client for Gemini Live API with multi-model fallback | `../common/constants.js` |
| `src/services/geminiLive.js` | Service layer for Gemini Live streaming and session management | `../common/constants.js` |
| `src/background/LiveModeManager.js` | Background orchestrator for Live Mode components | `../ai/GeminiLiveClient.js`, `../common/ScreenCapture.js` |
| `src/content/LiveModeOverlay.js` | UI overlay for Live Mode with transcription display | No external dependencies |
| `src/common/VoiceInput.js` | Voice recording and transcription service | No external dependencies |
| `src/background/voiceHandler.js` | Background voice command processing | `../services/geminiLive.js`, `../services/storageService.js`, `../common/constants.js` |

### UI and Integration Files

| Path | Purpose | Dependencies |
|------|---------|--------------|
| `src/popup/voice.js` | Voice control UI with recording interface | `../common/constants.js` |
| `src/popup/voice.html` | Voice control popup interface | None (HTML) |
| `tests/services/geminiLive.test.js` | Unit tests for Gemini Live service | Jest testing framework |

### Supporting Files

| Path | Purpose | Dependencies |
|------|---------|--------------|
| `src/common/ScreenCapture.js` | Screen capture functionality for Live Mode | No external dependencies |
| `src/ai/InstructionParser.js` | Enhanced for voice command parsing | No external dependencies |

---

## 3. manifest.json Analysis

### Version and Basic Info
- **Manifest Version**: 3
- **Extension Version**: 3.0.0
- **Name**: "ИИ-Автокликер"
- **Description**: "Автоматизация действий на веб-страницах с поддержкой Google Gemini Live"

### Permissions
```json
"permissions": [
  "activeTab",
  "scripting", 
  "storage",
  "tabs",
  "tabCapture",
  "desktopCapture"
]
```

### Host Permissions
```json
"host_permissions": [
  "<all_urls>",
  "https://generativelanguage.googleapis.com/*"
]
```

### Content Scripts Configuration
```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"],
    "run_at": "document_end",
    "all_frames": false
  }
]
```

### Background Service Worker
```json
"background": {
  "service_worker": "background.js",
  "type": "module"
}
```

### Key Differences from v2.0
1. **New Permissions**: Added `tabCapture`, `desktopCapture` for screen sharing
2. **Enhanced Host Permissions**: Added Gemini API endpoint
3. **Module Type**: Background script now uses `"type": "module"`
4. **Version Bump**: From 2.0.0 to 3.0.0
5. **Updated Description**: Added Gemini Live support mention

---

## 4. package.json и зависимости

### New Dependencies for Gemini Live
No new npm dependencies were added. Gemini Live functionality uses:
- **Native Web APIs**: WebSocket, Web Audio API, MediaRecorder, Speech Recognition
- **Chrome Extension APIs**: tabs, tabCapture, desktopCapture
- **Existing Dependencies**: Leveraged current build tools (Rollup, Babel)

### Critical Package Versions
```json
"devDependencies": {
  "@rollup/plugin-node-resolve": "^16.0.3",
  "@rollup/plugin-replace": "^6.0.3", 
  "@rollup/plugin-terser": "^0.4.4",
  "rollup": "^4.53.1",
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^30.2.0"
}
```

### Missing Dependencies
✅ **All required dependencies are present**
- Build tools (Rollup, Babel) - ✅ Present
- Testing framework (Jest) - ✅ Present  
- Linting/Formatting (ESLint, Prettier) - ✅ Present
- No runtime dependencies required (uses native APIs)

---

## 5. Точки интеграции

### content/index.js - Новые обработчики
```javascript
// Live Mode imports
import { LiveModeOverlay } from './LiveModeOverlay.js';
import { VoiceInput } from '../common/VoiceInput.js';

// New message handlers
- 'startLiveMode': Initializes LiveModeOverlay and VoiceInput
- 'stopLiveMode': Cleans up Live Mode components  
- 'voiceTranscription': Handles transcription updates
- 'executeVoiceCommand': Executes parsed voice commands
```

### background/index.js - Новые listeners и routing
```javascript
// Live Mode imports
import { voiceHandler } from './voiceHandler.js';
import { liveModeManager } from './LiveModeManager.js';

// New message actions
- 'startLiveMode': Routes to liveModeManager.start()
- 'stopLiveMode': Routes to liveModeManager.stop()
- 'sendUserInput': Forwards user input to Gemini Live
- 'toggleScreenCapture': Controls screen sharing
```

### popup/index.js - Новые UI элементы для Live Mode
```javascript
// Voice control integration
- Voice button in main popup interface
- Recording status indicator
- Transcription display area
- Model selection dropdown
- Error handling for voice failures
```

### services/ - Новые и модифицированные сервисы

#### Новые сервисы:
1. **geminiLive.js** - Gemini Live API service layer
2. **settingsValidator.js** - Enhanced for voice settings validation
3. **storageService.js** - Enhanced for Live Mode preferences

#### Модифицированные сервисы:
- **InstructionParser** - Enhanced for voice command parsing
- **constants.js** - Added voice-related constants and API configs

---

## 6. Integration Points Diagram (Text)

```
┌─────────────────┐    Messages    ┌─────────────────┐
│   popup.html    │ ←──────────→  │ background.js   │
│   voice.js      │               │ LiveModeManager │
│   settings.js   │               │ voiceHandler    │
└─────────────────┘               └─────────────────┘
         ↑                                 ↑
         │ Chrome Extension APIs           │
         │                                 │
┌─────────────────┐               ┌─────────────────┐
│   content.js    │ ←──────────→  │ GeminiLiveClient│
│ LiveModeOverlay │               │   WebSocket     │
│   VoiceInput    │               │   AI Service    │
└─────────────────┘               └─────────────────┘
         ↑                                 ↑
         │                                 │
┌─────────────────┐               ┌─────────────────┐
│   Web Page      │               │ Gemini Live API │
│   DOM Elements  │               │  (Google Cloud) │
└─────────────────┘               └─────────────────┘

Data Flow:
1. User speaks → VoiceInput → popup/voice.js → background/voiceHandler
2. voiceHandler → GeminiLiveClient → Gemini Live API  
3. AI Response → LiveModeManager → content/LiveModeOverlay
4. Commands executed → ActionExecutor → Web Page DOM
```

---

## 7. Key Architectural Changes

### Message Architecture
- **Popup → Background → Content**: Relay pattern for all Live Mode communications
- **Async Handling**: All message listeners use IIFE pattern with `return true`
- **Error Propagation**: Comprehensive error handling across all layers

### Voice Processing Pipeline
1. **Capture**: VoiceInput (Web Audio API + MediaRecorder)
2. **Transcription**: Web Speech API + Gemini Live streaming  
3. **Parsing**: InstructionParser enhanced for voice commands
4. **Execution**: ActionExecutor with voice-specific actions
5. **Feedback**: LiveModeOverlay with real-time transcription

### Multi-Model Fallback Chain
```
gemini-2.0-flash-exp → gemini-2.0-flash-001 → gemini-1.5-flash → gemini-1.5-pro
```

### Storage Integration
- **Chrome Storage Sync**: Settings persistence across devices
- **Local Backup**: Fallback storage for offline scenarios
- **Live Mode Settings**: Voice preferences, model selection, language config

---

## 8. Bundle Analysis

### JavaScript Bundle Contents
- **background.js** (27K): Service worker, voice handling, Live Mode management
- **content.js** (35K): DOM interaction, overlay UI, voice input processing  
- **popup.js** (22K): Main popup UI, settings integration
- **voice.js** (8.2K): Voice control interface, recording management
- **settings.js** (23K): Settings UI, validation, import/export

### CSS Bundle Contents
- **content.css** (4.0K): Live Mode overlay styling
- **popup.css** (7.3K): Main popup and voice interface styling
- **settings.css** (11K): Comprehensive settings page styling

---

## 9. Security Considerations

### API Key Management
- ✅ Stored in Chrome storage (encrypted)
- ✅ Never exposed in content scripts
- ✅ Validation before API calls

### Screen Capture Permissions
- ✅ Explicit user consent required
- ✅ Limited to active tab
- ✅ Clear privacy indicators in overlay

### WebSocket Security
- ✅ WSS protocol (secure WebSocket)
- ✅ Google API domain validation
- ✅ Connection timeout handling

---

## Summary

Phase V3.0 Part 1 successfully integrates Gemini Live voice capabilities with:

- **11 New Files**: Complete voice processing pipeline
- **179.55 KB Total**: Optimized bundle size for Chrome extension
- **Multi-Model Support**: 4-tier fallback chain for reliability  
- **Real-time Processing**: Voice → Transcription → AI → Action
- **Comprehensive UI**: Voice controls, live transcription, settings management
- **Robust Architecture**: Message relay pattern, error handling, storage persistence

The extension is now ready for Phase V3.0 Part 2: Playback Engine + UI/UX Redesign.