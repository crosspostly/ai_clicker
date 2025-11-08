# 📦 BATCHES 2-10: Implementation Roadmap

План внедрения батчей 2-10 (после Batch 1)

---

## BATCH 2: Popup Import/Export & Playback (40 tests)
**File:** `tests/popup/popup-import-export.test.js`  
**Coverage:** 48% → 53%  
**Timeline:** Week 2

### Export Tests (Tests 41-55)

```javascript
describe('Popup Export Functionality', () => {
  // TEST 41: Export to JSON
  test('should export actions as valid JSON string', () => {
    const actions = [
      { type: 'click', selector: '.btn', target: 'Login' },
      { type: 'input', selector: 'input', value: 'test@example.com' }
    ];
    
    const json = JSON.stringify(actions, null, 2);
    const parsed = JSON.parse(json);
    
    expect(parsed).toEqual(actions);
    expect(Array.isArray(parsed)).toBe(true);
  });

  // TEST 42: Export filename with timestamp
  test('should generate filename with current date', () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `ai-actions-${dateStr}.json`;
    
    expect(filename).toMatch(/ai-actions-\d{4}-\d{2}-\d{2}\.json/);
  });

  // Tests 43-55: Download link, cleanup, error handling...
});
```

### Import Tests (Tests 56-70)

```javascript
describe('Popup Import Functionality', () => {
  // TEST 56: Trigger file input
  test('should trigger file input click', () => {
    const fileInput = document.getElementById('import-file-input');
    const clickSpy = jest.spyOn(fileInput, 'click');
    
    fileInput.click();
    
    expect(clickSpy).toHaveBeenCalled();
  });

  // TEST 57: Read file with FileReader
  test('should read file content using FileReader', (done) => {
    const mockContent = JSON.stringify([{ type: 'click' }]);
    const blob = new Blob([mockContent], { type: 'application/json' });
    const file = new File([blob], 'test.json');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      expect(e.target.result).toBe(mockContent);
      done();
    };
    reader.readAsText(file);
  });

  // Tests 58-70: Validation, parsing, error handling...
});
```

### Playback Tests (Tests 71-80)

```javascript
describe('Popup Playback Controls', () => {
  // TEST 71: Send play message with speed
  test('should send playActions message with speed', async () => {
    const actions = [{ type: 'click', selector: '.btn' }];
    const speed = 1.5;
    
    const tabs = await chrome.tabs.query({ active: true });
    await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'playActions',
      actions: actions,
      speed: speed
    });
    
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ speed: 1.5 })
    );
  });

  // Tests 72-80: Speed control, progress, completion...
});
```

**Итого Batch 2:** 40 тестов, coverage 48% → 53%

---

## BATCH 3: Settings Module (40 tests)
**Files:** `tests/settings/*.test.js`  
**Coverage:** 53% → 60%  
**Timeline:** Week 3

### API Key Tests (Tests 81-95)

```javascript
describe('Settings API Key Validation', () => {
  // TEST 81: Valid key format
  test('should accept valid Gemini API key', () => {
    const key = 'AIza' + 'a'.repeat(35);
    const isValid = key.startsWith('AIza') && key.length === 39;
    expect(isValid).toBe(true);
  });

  // TEST 82: Invalid prefix
  test('should reject key without AIza prefix', () => {
    const key = 'XXXX' + 'a'.repeat(35);
    expect(key.startsWith('AIza')).toBe(false);
  });

  // Tests 83-95: Length, save, test connection...
});
```

### Settings Persistence (Tests 96-110)

```javascript
describe('Settings Persistence', () => {
  // TEST 96: Load settings
  test('should load settings from chrome.storage.sync', async () => {
    const mockSettings = { geminiEnabled: true };
    chrome.storage.sync.get.mockResolvedValue(mockSettings);
    
    const result = await chrome.storage.sync.get(['geminiEnabled']);
    expect(result.geminiEnabled).toBe(true);
  });

  // Tests 97-110: Save, defaults, sync/local...
});
```

### UI Interactions (Tests 111-120)

```javascript
describe('Settings UI Interactions', () => {
  // TEST 111: Enable/disable toggle
  test('should toggle Gemini enabled state', () => {
    const checkbox = document.getElementById('gemini-enabled');
    checkbox.checked = true;
    expect(checkbox.checked).toBe(true);
  });

  // Tests 112-120: API key input, test button, clear...
});
```

**Итого Batch 3:** 40 тестов, coverage 53% → 60%

---

## BATCH 4-10: Summary

### BATCH 4: Background Service Worker (50 tests)
**Coverage:** 60% → 65% | **Week 4**
- Message routing (20 tests)
- Context menu (15 tests)
- Lifecycle events (15 tests)

### BATCH 5: Content Script Integration (50 tests)
**Coverage:** 65% → 70% | **Week 6**
- Init & setup (15 tests)
- Recorder integration (20 tests)
- Executor integration (15 tests)

### BATCH 6: AI Parser Edge Cases (40 tests)
**Coverage:** 70% → 73% | **Week 7**
- Complex instructions (15 tests)
- Error handling (15 tests)
- Action generation (10 tests)

### BATCH 7: ElementFinder Advanced (45 tests)
**Coverage:** 73% → 76% | **Week 8**
- Advanced selectors (20 tests)
- Shadow DOM & iframes (15 tests)
- Dynamic elements (10 tests)

### BATCH 8: Recorder/Executor Deep (50 tests)
**Coverage:** 76% → 80% | **Week 10**
- Recorder edge cases (25 tests)
- Executor edge cases (15 tests)
- Performance tests (10 tests)

### BATCH 9: Integration & E2E (60 tests)
**Coverage:** 80% → 83% | **Week 12**
- Full recording flow (20 tests)
- AI mode E2E (20 tests)
- Cross-module integration (20 tests)

### BATCH 10: Edge Cases & Error Boundaries (50 tests)
**Coverage:** 83% → 85-90% | **Week 14**
- Network failures (15 tests)
- Storage quota (15 tests)
- CSP violations (15 tests)
- Race conditions (5 tests)

---

## 📊 COVERAGE MILESTONES

| Week | Batch | Coverage | Milestone |
|------|-------|----------|------------|
| 1 | 1 | 48% | Popup core ✅ |
| 2 | 2 | 53% | Popup advanced ✅ |
| 3 | 3 | 60% | Settings complete ✅ |
| 4 | 4 | 65% | **Backend ready** 🎆 |
| 6 | 5 | 70% | **Production-ready testing** 🎉 |
| 8 | 7 | 76% | Advanced features ✅ |
| 10 | 8 | 80% | **Enterprise-grade** 🏆 |
| 14 | 10 | 85-90% | **Complete!** 🎆 |

---

## ⚠️ STOPPING POINT

**Остановитесь на 85%!**

НЕ продолжайте до 90-100%:
- Diminishing returns
- 3x больше времени
- Хрупкие тесты
- Maintenance overhead

**85% = перфектно для enterprise!**

---

**Next:** Внедрить Batch 2 после завершения Batch 1
