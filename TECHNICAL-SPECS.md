# Technical Specifications - AI-Autoclicker v2.0.0

## System Architecture

### High-Level Overview
```
┌─────────────────────────────────────────────────────────────┐
│                  Chrome Extension (MV3)                      │
├─────────────────┬──────────────────┬────────────────────────┤
│  popup.html     │  Popup UI        │  Main Extension UI     │
│  popup.js       │  (400px panel)   │  (manual & auto modes) │
└─────────────────┴──────────────────┴────────────────────────┘
         ↕                                      ↕
┌─────────────────────────────────────────────────────────────┐
│              Message Passing (Runtime)                       │
│  chrome.runtime.sendMessage()                               │
└─────────────────────────────────────────────────────────────┘
         ↕                                      ↕
┌──────────────────────┐              ┌──────────────────────┐
│  background.js       │              │  content.js          │
│  Service Worker      │              │  (Per-tab script)    │
│  - Message routing   │              │  - Recording         │
│  - Storage mgmt      │              │  - Execution         │
└──────────────────────┘              │  - AI integration    │
                                      └──────────────────────┘
                                               ↕
                                      ┌──────────────────────┐
                                      │    Page DOM          │
                                      │  - Click listeners   │
                                      │  - Element queries   │
                                      └──────────────────────┘
```

## Data Models

### Action Object
```javascript
{
  type: 'click'|'input'|'hover'|'scroll'|'wait'|'select'|'double_click'|'right_click',
  target?: string,          // Element identifier (text, selector, etc)
  selector?: string,        // CSS selector (auto-generated)
  value?: string|number,    // For input: text; For select: option value; For scroll: pixels
  duration?: number,        // For wait: milliseconds
  pixels?: number,          // For scroll: alternative to value
  timestamp?: number,       // Unix timestamp of recording
  description?: string      // Human-readable description
}
```

### Execution Result Object
```javascript
{
  actionIndex: number,
  action: Action,
  status: 'success'|'failed',
  error?: string,
  duration: number,         // ms taken
  timestamp: number,        // Unix timestamp
  elementFound: boolean,
  attempts: number
}
```

### Storage Schema

#### chrome.storage.sync (Settings)
```javascript
{
  geminiApiKey: string,              // Encrypted via Chrome
  geminiEnabled: boolean,            // Default: true
  logLevel: 'DEBUG'|'INFO'|'WARN'|'ERROR',  // Default: INFO
  maxRetries: number,                // Default: 3
  timeout: number,                   // milliseconds, Default: 30000
  showHints: boolean,                // Default: true
  saveHistory: boolean               // Default: true
}
```

#### chrome.storage.local (Data)
```javascript
{
  recordedActions: {
    actions: Action[],
    savedAt: number,       // Unix timestamp
    expiresAt: number      // Expiration time
  },
  executionHistory: {
    actionIndex: number,
    action: Action,
    status: string,
    error?: string,
    duration: number,
    timestamp: number
  }[]
}
```

## Message Protocol

### Popup ↔ Content Script

#### Start Recording
```javascript
{
  action: 'startRecording'
}
```

#### Stop Recording
```javascript
{
  action: 'stopRecording'
}
```

#### Play Actions
```javascript
{
  action: 'playActions',
  actions: Action[],
  speed: number           // 0.5 to 3.0
}
```

#### Start AI Mode
```javascript
{
  action: 'startAIMode',
  instructions: string,          // User instructions
  geminiApiKey?: string,         // Optional
  useGemini: boolean
}
```

#### Stop AI Mode
```javascript
{
  action: 'stopAIMode'
}
```

### Content Script → Popup

#### Action Recorded
```javascript
{
  type: 'actionRecorded',
  data: Action,
  actionCount: number
}
```

#### AI Status Update
```javascript
{
  type: 'aiStatus',
  status: string,                // e.g. 'analyzing', 'executing'
  message: string,               // Display message
  level: 'info'|'warn'|'error'   // Log level
}
```

#### AI Log Entry
```javascript
{
  type: 'aiLog',
  message: string,
  level: 'info'|'warn'|'error'|'success'
}
```

## API Reference

### Logger
```javascript
class Logger {
  constructor(name, level)
  log(level, message, data?)
  debug(message, data?)
  info(message, data?)
  warn(message, data?)
  error(message, data?)
  getLogs(level?, limit?)  // Returns: Log[]
  clear()
  export()                 // Returns: JSON string
  setLevel(level)
}
```

### Validator
```javascript
class Validator {
  static validateApiKey(key)       // Throws: ValidationError
  static validateInstructions(instructions)
  static validateAction(action)
  static validateUrl(url)
  static validateSelector(selector)
  static validateXPath(xpath)
  static sanitizeHtml(html)        // Returns: sanitized string
  static sanitizeText(text, maxLength)
  static validateEmail(email)
  static validateRange(value, min, max)
  static validateDuration(duration)
}
```

### StorageManager
```javascript
class StorageManager {
  static async get(keys, storageType)              // Promise<Object>
  static async set(data, storageType)              // Promise<void>
  static async remove(keys, storageType)           // Promise<void>
  static async clear(storageType)                  // Promise<void>
  static async saveActions(actions, expirationDays)
  static async getActions()                        // Promise<Action[]>
  static async addExecutionHistory(execution)      // Promise<void>
  static async getExecutionHistory(limit)          // Promise<ExecutionResult[]>
}
```

### ElementFinder
```javascript
class ElementFinder {
  find(target)                           // Returns: Element | null
  findAll(selector)                      // Returns: Element[]
  findByText(text)
  findBySelector(selector)
  findByXPath(xpath)
  findByAriaLabel(label)
  findByLabelText(labelText)
  findByButtonText(text)
  findByPlaceholder(placeholder)
  findClosestParent(element, selector)
  findInContainer(container, selector)
  async waitFor(target, timeout)         // Promise<Element>
  isInteractive(element)                 // Returns: boolean
  isVisible(element)                     // Returns: boolean
  generateSelector(element)              // Returns: CSS selector
  clearCache()
  getCacheStats()                        // Returns: {size, maxSize}
}
```

### ActionRecorder
```javascript
class ActionRecorder {
  start()
  stop()
  getActions()                           // Returns: Action[]
  clear()
  export()                               // Returns: JSON string
  import(jsonString)                     // Returns: boolean
  on(event, callback)
  off(event, callback)
  emit(event, data)
}

// Events
'recording-started'
'recording-stopped'  // { actions: Action[] }
'action-recorded'    // { action: Action, count: number }
```

### ActionExecutor
```javascript
class ActionExecutor {
  async executeAction(action, speed)     // Promise<void>
  async executeSequence(actions, speed)  // Promise<void>
  stop()
  on(event, callback)
  off(event, callback)
  emit(event, data)
}

// Events
'action-started'     // { action, index, total }
'action-completed'   // { action, status }
'action-failed'      // { action, error }
'sequence-started'   // { actionCount }
'sequence-completed' // { actionCount }
'sequence-error'     // { action, index, error }
'sequence-stopped'
```

### InstructionParser
```javascript
class InstructionParser {
  static async parse(instructions, useGemini, apiKey, pageContext)
                                         // Returns: Action[]
  static async parseWithGemini(instructions, apiKey, pageContext)
                                         // Returns: Action[]
  static parseWithFallback(instructions) // Returns: Action[]
  static validateActions(actions)        // Returns: boolean
  static mergeDuplicates(actions)        // Returns: Action[]
  static optimizeSequence(actions)       // Returns: Action[]
}
```

## Performance Characteristics

### ElementFinder Caching
- **Max Cache Size**: 500 selectors
- **LRU Eviction**: Oldest entries removed first
- **Hit Rate**: ~70-80% in typical workflows
- **Memory Impact**: ~1-2MB per 500 cached selectors

### Selector Strategies Performance
| Strategy | Speed | Accuracy | Reliability |
|----------|-------|----------|-------------|
| By Text | Very Fast | Medium | Medium |
| By CSS | Very Fast | High | High |
| By XPath | Fast | High | High |
| By aria-label | Fast | High | High |
| By placeholder | Very Fast | High | High |
| Multi-strategy | Medium | Very High | Very High |

### Action Execution Timing
- **Click**: 100ms + 200ms = 300ms baseline
- **Input**: 50ms + (len × 50ms) = variable
- **Select**: 100ms + 200ms = 300ms
- **Scroll**: 50ms + (pixels/2)ms = variable
- **Wait**: user-specified (100ms - 300s)

### Memory Usage
- **Logger**: ~50KB (500 entries max)
- **ElementFinder**: ~2MB (500 selectors max)
- **ActionRecorder**: ~100KB per 100 actions
- **Total**: ~2-3MB typical operation

## Security Constraints

### Input Limits
| Input | Min | Max | Notes |
|-------|-----|-----|-------|
| API Key | 10 chars | 500 chars | Format validated |
| Instructions | 1 char | 5000 chars | Sanitized |
| Text Input | 0 chars | 10000 chars | Escaped |
| Actions | 1 | 1000 | Per sequence |
| Wait Duration | 100ms | 300000ms | 5 min max |
| Scroll Distance | -10000px | 10000px | Max 10k px |

### XSS Prevention
- All HTML output uses `textContent` not `innerHTML`
- `Validator.sanitizeHtml()` applied to user input
- DOM escaping for attribute values
- Content Security Policy headers recommended

### Permissions Model
```json
{
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["<all_urls>", "https://generativelanguage.googleapis.com/*"],
  "content_scripts": [{"run_at": "document_start"}]
}
```

## Error Handling

### Custom Error Hierarchy
```
Error
├── ValidationError
├── ExecutionError
└── StorageError
```

### Error Codes
| Code | Message | Severity |
|------|---------|----------|
| VAL-001 | Invalid API key | HIGH |
| VAL-002 | Invalid selector | MEDIUM |
| EXEC-001 | Element not found | MEDIUM |
| EXEC-002 | Action timeout | MEDIUM |
| STOR-001 | Storage quota exceeded | HIGH |
| STOR-002 | Storage access denied | HIGH |

## Testing Strategy

### Unit Tests (Jest)
```javascript
describe('ElementFinder', () => {
  describe('find', () => {
    it('should find element by text');
    it('should cache selector');
    it('should handle missing elements');
  });
});
```

### Integration Tests
- Popup ↔ Content communication
- Recording + Execution cycle
- AI parsing + Execution

### Manual Testing
- Cross-browser compatibility
- Various DOM structures
- Different websites/applications

## Performance Optimization Opportunities

### Current Bottlenecks
1. DOM queries in loops (mitigated by caching)
2. Scroll debouncing (250ms delay acceptable)
3. Character-by-character input typing (realistic UX)

### Future Optimizations
1. Service Worker message batching
2. Shadow DOM support
3. iframe navigation handling
4. Mutation observer for dynamic content
5. Parallel execution of independent actions

## Browser Compatibility

### Minimum Requirements
- **Chrome**: 88+ (MV3 support)
- **Edge**: 88+ (Chromium-based)
- **Opera**: 74+ (Chromium-based)

### APIs Used
- `chrome.runtime` - Message passing
- `chrome.storage` - Data persistence
- `chrome.tabs` - Tab management
- `document.evaluate` - XPath support
- `MutationObserver` - Optional, not required
- `fetch` - Network requests

---

**Last Updated**: November 8, 2024  
**Version**: 2.0.0  
**Status**: Production Ready
