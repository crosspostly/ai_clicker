# 🔧 Action Recorder Bug Fixes - Detailed Implementation Plan

**Date:** 2025-11-09  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 4-6 hours  
**Impact:** +20 tests passing, core functionality restored

**Related Issue:** [#35](https://github.com/crosspostly/ai_clicker/issues/35)

---

## 📊 Current Status

- **Tests Passing:** 432/677 (63.8%)
- **Tests Failing:** 245/677 (36.2%)
- **ActionRecorder Issues:** ~20 failing tests
- **Coverage:** 36.99% (below 40% threshold)

---

## 🎯 Goals

After implementing these fixes:
- **Tests Passing:** ~550/677 (81%)
- **ActionRecorder Issues:** 0 failing tests
- **Coverage:** 45%+ (above threshold)

---

## 🔴 Critical Bugs to Fix

### 1. Event Listeners Not Attached (CRITICAL)

**Problem:** `addEventListener` calls are not binding correctly

**File:** `src/content/recorder/ActionRecorder.js`

**Root Cause:** Methods lose `this` context when passed to `addEventListener`

**Solution:**

```javascript
class ActionRecorder {
  constructor() {
    this.isRecording = false;
    this.recordedActions = [];
    this.startTime = null;
    this.lastScrollTime = 0;
    
    // ✅ FIX: Bind all event handlers in constructor
    this.handleClick = this.handleClick.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  start() {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.recordedActions = [];
    this.startTime = Date.now();
    
    // Now these will work correctly with bound this
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('input', this.handleInput, true);
    document.addEventListener('change', this.handleChange, true);
    window.addEventListener('scroll', this.handleScroll, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
  }

  stop() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    
    // Remove listeners using the same bound functions
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('input', this.handleInput, true);
    document.removeEventListener('change', this.handleChange, true);
    window.removeEventListener('scroll', this.handleScroll, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
  }
}
```

**Tests Fixed:** ~2 tests

---

### 2. handleScroll Not Recording Actions (CRITICAL)

**Problem:** Scroll events are not being recorded

**File:** `src/content/recorder/ActionRecorder.js`

**Root Cause:** Missing logic to push scroll events to recordedActions array

**Solution:**

```javascript
handleScroll(event) {
  if (!this.isRecording) return;
  
  // Throttle scroll events (max 1 per 100ms)
  const now = Date.now();
  if (now - this.lastScrollTime < 100) {
    return;
  }
  this.lastScrollTime = now;
  
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  
  // ✅ FIX: Check for duplicates/micro-scrolls
  const lastScroll = this.recordedActions
    .filter(a => a.type === 'scroll')
    .pop();
    
  if (lastScroll) {
    const deltaY = Math.abs(scrollY - lastScroll.scrollY);
    const deltaX = Math.abs(scrollX - lastScroll.scrollX);
    
    // Ignore micro-scrolls (less than 10px)
    if (deltaY < 10 && deltaX < 10) {
      return;
    }
  }
  
  // ✅ FIX: RECORD the scroll action
  this.recordedActions.push({
    type: 'scroll',
    scrollX: scrollX,
    scrollY: scrollY,
    timestamp: now - this.startTime
  });
}
```

**Tests Fixed:** ~3 tests

---

### 3. handleChange Fails on Checkbox/Radio (CRITICAL)

**Problem:** `TypeError: Cannot read properties of undefined (reading 'type')`

**File:** `src/content/recorder/ActionRecorder.js`

**Root Cause:** Missing null check for event.target

**Solution:**

```javascript
handleChange(event) {
  if (!this.isRecording) return;
  
  const target = event.target;
  
  // ✅ FIX: Validate target exists and has type
  if (!target || !target.type) {
    return;
  }
  
  // Ignore non-interactive elements
  if (this.shouldIgnoreElement(target)) {
    return;
  }
  
  const action = {
    type: 'change',
    elementType: target.type,
    timestamp: Date.now() - this.startTime
  };
  
  // ✅ FIX: Handle different input types correctly
  switch (target.type) {
    case 'checkbox':
    case 'radio':
      action.checked = target.checked;
      action.value = target.value;
      action.name = target.name; // Important for radio groups
      break;
      
    case 'select-one':
    case 'select-multiple':
      action.value = target.value;
      action.selectedIndex = target.selectedIndex;
      break;
      
    case 'file':
      action.fileName = target.files[0]?.name || '';
      break;
      
    default:
      action.value = target.value;
  }
  
  // Add selector
  action.selector = this.getSelector(target);
  
  this.recordedActions.push(action);
}
```

**Tests Fixed:** ~2 tests

---

### 4. getRecordingStatus Returns Incomplete Data

**Problem:** `status.duration` is `undefined`

**File:** `src/content/recorder/ActionRecorder.js`

**Root Cause:** Duration not calculated when isRecording is false

**Solution:**

```javascript
getRecordingStatus() {
  // ✅ FIX: Always return all fields with valid values
  return {
    isRecording: this.isRecording,
    actionCount: this.recordedActions.length,
    duration: this.isRecording && this.startTime 
      ? Date.now() - this.startTime 
      : 0,  // Return 0 instead of undefined
    startTime: this.startTime || null,
    lastAction: this.recordedActions[this.recordedActions.length - 1] || null
  };
}
```

**Tests Fixed:** ~2 tests

---

### 5. Missing Element Methods in Test Mocks

**Problem:** `element.closest is not a function`, `element.getAttribute is not a function`

**File:** `src/__tests__/content/recorder/ActionRecorder.test.js`

**Root Cause:** Mock elements don't implement DOM Element interface

**Solution:**

```javascript
/**
 * Create a complete mock DOM element
 */
function createMockElement(overrides = {}) {
  const element = {
    // Basic properties
    textContent: '',
    id: '',
    className: '',
    tagName: 'DIV',
    type: 'text',
    value: '',
    checked: false,
    name: '',
    placeholder: '',
    
    // ✅ FIX: Add closest() method
    closest: jest.fn((selector) => {
      // Return null by default (element not found)
      // Can be overridden in tests
      return null;
    }),
    
    // ✅ FIX: Add getAttribute() method
    getAttribute: jest.fn((attr) => {
      const defaultAttrs = {
        'id': element.id,
        'class': element.className,
        'name': element.name,
        'type': element.type,
        'placeholder': element.placeholder,
        'aria-label': '',
        'data-testid': '',
        ...(overrides.attributes || {})
      };
      return defaultAttrs[attr] || null;
    }),
    
    // ✅ FIX: Add setAttribute() method
    setAttribute: jest.fn((attr, value) => {
      // Update internal state if needed
      if (attr === 'id') element.id = value;
      if (attr === 'class') element.className = value;
    }),
    
    // ✅ FIX: Add hasAttribute() method
    hasAttribute: jest.fn((attr) => {
      return element.getAttribute(attr) !== null;
    }),
    
    // ✅ FIX: Add querySelector() method
    querySelector: jest.fn((selector) => null),
    
    // ✅ FIX: Add querySelectorAll() method
    querySelectorAll: jest.fn((selector) => []),
    
    // Apply overrides
    ...overrides
  };
  
  return element;
}

// Usage in tests:
describe('ActionRecorder - handleChange', () => {
  it('should record checkbox change correctly', () => {
    const recorder = new ActionRecorder();
    recorder.start();
    
    const mockCheckbox = createMockElement({
      type: 'checkbox',
      checked: true,
      value: 'option1',
      name: 'myCheckbox',
      id: 'checkbox-1',
      attributes: {
        'aria-label': 'Accept terms'
      }
    });
    
    const event = {
      target: mockCheckbox,
      type: 'change'
    };
    
    recorder.handleChange(event);
    
    expect(recorder.recordedActions).toHaveLength(1);
    expect(recorder.recordedActions[0]).toMatchObject({
      type: 'change',
      elementType: 'checkbox',
      checked: true,
      value: 'option1',
      name: 'myCheckbox'
    });
  });
});
```

**Tests Fixed:** ~8 tests

---

### 6. Popup Functions Not Exported

**Problem:** `popup.handleMessage is not a function`, `popup.updateUI is not a function`

**File:** `src/popup/index.js`

**Root Cause:** Functions are not exported, only used internally

**Solution:**

```javascript
// At the top of the file
let _isRecording = false;
let recordedActions = [];
let _isAutoMode = false;
let geminiEnabled = false;
let geminiApiKey = null;

// ... DOM element declarations ...

/**
 * Handle message from background/content scripts
 * ✅ FIX: Export this function
 */
export function handleMessage(message) {
  switch (message.type) {
    case 'actionRecorded':
      recordedActions.push(message.data);
      addActionToUI(message.data, recordedActions.length - 1);
      saveActions();
      updatePlaybackButton();
      break;
      
    case 'aiStatus':
      updateAIStatus(message.status, message.message);
      break;
      
    case 'aiLog':
      addLog(message.message, message.level || 'info');
      break;
  }
}

/**
 * Update UI elements based on state
 * ✅ FIX: Export this function
 */
export function updateUI(state) {
  if (state.isRecording !== undefined) {
    _isRecording = state.isRecording;
    startRecordingBtn.disabled = state.isRecording;
    stopRecordingBtn.disabled = !state.isRecording;
  }
  
  if (state.actionCount !== undefined) {
    playActionsBtn.disabled = state.actionCount === 0;
    exportActionsBtn.disabled = state.actionCount === 0;
  }
}

/**
 * Update AI status display
 * ✅ FIX: Export this function
 */
export function updateAIStatus(status, message) {
  statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  if (message) {
    addLog(message, 'info');
  }
}

/**
 * Get current recorded actions (for testing)
 * ✅ FIX: Export this function
 */
export function getRecordedActions() {
  return recordedActions;
}

/**
 * Clear all recorded actions (for testing)
 * ✅ FIX: Export this function
 */
export function clearRecordedActions() {
  recordedActions = [];
  actionsContainer.innerHTML = '';
  updatePlaybackButton();
}

// Keep DOMContentLoaded initialization
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadSettings();
    await loadSavedActions();
    setupEventListeners();
    setupMessageListeners();
  } catch (error) {
    console.error('Popup initialization error:', error);
    addLog('Ошибка инициализации', 'error');
  }
});
```

**Tests Fixed:** ~40 tests

---

## 📋 Implementation Checklist

### Phase 1: ActionRecorder Core Fixes (2 hours)
- [ ] Fix event listener binding in constructor
- [ ] Implement handleScroll recording logic
- [ ] Add null checks in handleChange
- [ ] Fix getRecordingStatus to return duration
- [ ] Add throttling to handleScroll

### Phase 2: Test Mock Improvements (1 hour)
- [ ] Create createMockElement() helper function
- [ ] Add closest() to all element mocks
- [ ] Add getAttribute() to all element mocks
- [ ] Add setAttribute() to all element mocks
- [ ] Update all ActionRecorder tests to use new mocks

### Phase 3: Popup Exports (1 hour)
- [ ] Export handleMessage function
- [ ] Export updateUI function
- [ ] Export updateAIStatus function
- [ ] Export getRecordedActions function
- [ ] Export clearRecordedActions function
- [ ] Update popup tests to import these functions

### Phase 4: Testing & Validation (1-2 hours)
- [ ] Run all tests locally
- [ ] Verify ActionRecorder tests pass
- [ ] Verify Popup tests pass
- [ ] Check coverage increases to 45%+
- [ ] Manual testing in browser
- [ ] Push to GitHub and verify CI passes

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test -- ActionRecorder.test.js
npm test -- popup/index.test.js
```

### Integration Tests
```bash
npm test -- tests/content/action-recorder.test.js
```

### Coverage Check
```bash
npm test -- --coverage
```

**Expected Results:**
- ActionRecorder tests: 100% passing
- Popup tests: 100% passing
- Overall coverage: 45%+
- Total tests passing: 550+/677 (81%+)

---

## 🚀 Deployment Plan

### 1. Create Feature Branch
```bash
git checkout -b fix/action-recorder-critical-bugs
```

### 2. Implement Fixes
- Apply all code changes from this plan
- Run tests after each phase
- Commit with descriptive messages

### 3. Create Pull Request
- Title: "fix: resolve ActionRecorder critical bugs and test failures"
- Description: Link to this implementation plan
- Request review from team

### 4. Verify CI
- All tests pass
- Coverage above 40%
- Lint passes
- Build succeeds

### 5. Merge to Main
- Squash commits
- Update CHANGELOG.md
- Tag release

---

## 📈 Expected Impact

### Before Fixes:
- Tests: 432/677 passing (63.8%)
- ActionRecorder: 10 failing tests
- Popup: 40 failing tests
- Coverage: 36.99%

### After Fixes:
- Tests: ~550/677 passing (81%+)
- ActionRecorder: 0 failing tests
- Popup: 0 failing tests
- Coverage: ~45%

### User Impact:
- ✅ Recording works reliably
- ✅ All action types recorded correctly
- ✅ Checkbox/radio changes tracked
- ✅ Scroll events captured
- ✅ Status reporting accurate

---

## 🔗 Related Issues

- [#35](https://github.com/crosspostly/ai_clicker/issues/35) - ActionRecorder critical bugs
- Blocks [#36](https://github.com/crosspostly/ai_clicker/issues/36) - Gemini Live integration

---

## 📝 Notes

- All changes are backward compatible
- No breaking changes to public API
- Tests will need mock updates
- Documentation will be updated in separate PR

---

**Author:** AI Assistant  
**Reviewer:** @crosspostly  
**Status:** 🟡 Ready for Implementation
**Updated:** 2025-11-09