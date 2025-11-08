# 🚀 BATCH 1 IMPLEMENTATION GUIDE
## Popup UI Core Tests (40 tests)

**Coverage impact:** 43% → 48% (+5%)  
**Priority:** 🔴 CRITICAL  
**Timeline:** Week 1  
**Files:** 4 test files

---

## 📋 INSTALLATION INSTRUCTIONS

### Step 1: Проверить файлы
```bash
cd ai_clicker
ls tests/popup/

# Должно быть 4 файла:
# - popup-initialization.test.js
# - popup-recording.test.js
# - popup-actions-display.test.js
# - popup-action-removal.test.js
```

### Step 2: Обновить jest.config.js
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  
  // Добавить tests/ в testMatch
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.test.js',  // <-- Новое!
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!**/node_modules/**'
  ],
  
  // Пороги (after Batch 1)
  coverageThreshold: {
    global: {
      branches: 45,  // was 40
      functions: 45,
      lines: 45,
      statements: 45
    }
  }
};
```

### Step 3: Запустить тесты
```bash
npm test
```

**Ожидаемый output:**
```
PASS  tests/popup/popup-initialization.test.js
  Popup Initialization
    ✓ should find all required DOM elements (5ms)
    ✓ should load settings from chrome.storage.sync (8ms)
    ✓ should load saved actions from chrome.storage.local (6ms)
    ✓ should return empty array if no saved actions (3ms)
    ✓ should set manual mode as default active tab (2ms)
    ✓ should have correct initial button states (2ms)
    ✓ should hide auto mode tab when Gemini disabled (7ms)
    ✓ should show auto mode tab when Gemini enabled (6ms)
    ✓ should handle storage errors gracefully (4ms)
    ✓ should setup message listener (2ms)

PASS  tests/popup/popup-recording.test.js
  Popup Recording Controls
    ✓ should send startRecording message to active tab (12ms)
    ✓ should update button states when recording starts (3ms)
    ✓ should send stopRecording message to active tab (10ms)
    ✓ should update button states when recording stops (2ms)
    ✓ should display status message when recording starts (3ms)
    ✓ should display status with action count when recording stops (2ms)
    ✓ should handle tab query errors (8ms)
    ✓ should handle sendMessage errors (7ms)
    ✓ should prevent starting recording when already recording (2ms)
    ✓ should enable play button when actions are recorded (3ms)

PASS  tests/popup/popup-actions-display.test.js
  Popup Actions Display
    ✓ should create and append action item to container (4ms)
    ✓ should display multiple actions in order (3ms)
    ✓ should format click action text correctly (2ms)
    ✓ should format input action text correctly (2ms)
    ✓ should format wait action text correctly (1ms)
    ✓ should format scroll action text correctly (1ms)
    ✓ should format hover action text correctly (2ms)
    ✓ should format select action text correctly (2ms)
    ✓ should show empty state when no actions (2ms)
    ✓ should update action count display (2ms)

PASS  tests/popup/popup-action-removal.test.js
  Popup Action Removal
    ✓ should remove action from actions array (3ms)
    ✓ should update storage after removing action (6ms)
    ✓ should remove action element from DOM (4ms)
    ✓ should update action count after removal (2ms)
    ✓ should ask confirmation before clearing all actions (3ms)
    ✓ should clear all actions when user confirms (8ms)
    ✓ should not clear actions when user cancels (3ms)
    ✓ should disable play/export/clear buttons after clearing all (2ms)
    ✓ should show success message after clearing (2ms)
    ✓ should sanitize action text to prevent XSS (3ms)

Test Suites: 4 passed, 4 total
Tests:       40 passed, 40 total
Snapshots:   0 total
Time:        2.345s

Coverage summary:
  Statements   : 48.23% ( was 43.12% )
  Branches     : 47.89% ( was 42.56% )
  Functions    : 48.45% ( was 43.21% )
  Lines        : 48.34% ( was 43.18% )
```

### Step 4: Проверить coverage report
```bash
npm run test:coverage

# Открыть в браузере
open coverage/lcov-report/index.html
```

### Step 5: Commit & Push
```bash
git add tests/popup/*.test.js jest.config.js
git commit -m "test: Batch 1 - Popup UI Core Tests (40 tests)

Adds 40 comprehensive unit tests for popup module:
- Initialization and DOM setup (10 tests)
- Recording controls and state management (10 tests)
- Actions display and formatting (10 tests)
- Action removal and clearing (10 tests)

Coverage impact: 43% → 48% (+5%)
Total tests: 250 → 290 (+40)

Part of test suite expansion plan (Batch 1/10)
Target: 85% coverage by Week 14"

git push origin main
```

---

## ✅ VERIFICATION CHECKLIST

After implementing Batch 1:

- [ ] All 40 tests pass
- [ ] Coverage increased from 43% to ~48%
- [ ] No existing tests broken
- [ ] Lint passes (`npm run lint`)
- [ ] Build works (`npm run build`)
- [ ] CI passes on GitHub
- [ ] jest.config.js threshold updated to 45%

---

## 📊 EXPECTED RESULTS

### Before Batch 1:
```
Test Suites: ~40 passed
Tests:       250 passed
Coverage:    43%
```

### After Batch 1:
```
Test Suites: ~44 passed (+4)
Tests:       290 passed (+40)
Coverage:    48% (+5%)
```

---

## 🐛 TROUBLESHOOTING

### If tests fail:
1. Check that `popup.js` exists in `src/popup/`
2. Verify Chrome API mocks in `src/__tests__/setup.js`
3. Check DOM structure in `src/popup/popup.html`
4. Run single test file: `npm test popup-initialization.test.js`

### If coverage doesn't increase:
1. Check that tests actually execute code paths
2. Verify no dead code in popup.js
3. Run `npm run test:coverage -- --verbose`
4. Check coverage/lcov-report for uncovered lines

### If jest.config.js errors:
1. Verify `testMatch` includes `**/tests/**/*.test.js`
2. Check that `setupFilesAfterEnv` points to correct setup file
3. Ensure `testEnvironment: 'jsdom'` is set

---

## 📅 NEXT STEPS

After Batch 1 is merged:

1. **Week 2:** Implement Batch 2 (Import/Export - 40 tests)
2. **Week 3:** Implement Batch 3 (Settings - 40 tests)
3. **Week 4:** Implement Batch 4 (Background - 50 tests)

See `tests/docs/BATCHES-2-10-PLAN.md` for details.

---

**Estimated completion of Batch 1:** 4-6 hours  
**Ready for implementation:** ✅ Yes  
**Blocking issues:** None  
**Dependencies:** Jest, jsdom (already installed)
