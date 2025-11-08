# 🧪 AI-Autoclicker Test Suite

**Current Status:** 🟢 Batch 1-3 Complete (290 tests)  
**Coverage:** 43% → 70% target  
**Timeline:** 14 weeks (~3.5 months)

---

## 📚 Documentation

### 📖 Key Documents:

1. **[TEST-SUITE-MASTERPLAN.md](docs/TEST-SUITE-MASTERPLAN.md)**
   - Complete plan for 465 tests
   - 10 batches of 40-60 tests each
   - Coverage projection: 43% → 70%
   - Timeline and milestones

2. **[BATCH-1-IMPLEMENTATION-GUIDE.md](docs/BATCH-1-IMPLEMENTATION-GUIDE.md)**
   - Step-by-step implementation guide
   - 40 popup UI tests
   - Verification checklist
   - Troubleshooting

3. **[BATCHES-2-10-PLAN.md](docs/BATCHES-2-10-PLAN.md)**
   - Roadmap for batches 2-10
   - Test examples
   - Coverage milestones

4. **[Testing Guide](../docs/TESTING.md)**
   - Jest testing framework setup
   - Chrome API mocking
   - Test writing patterns
   - Coverage strategies

---

## 📁 Структура

```
tests/
├── README.md                    # Этот файл
├── docs/                        # Документация
│   ├── TEST-SUITE-MASTERPLAN.md
│   ├── BATCH-1-IMPLEMENTATION-GUIDE.md
│   └── BATCHES-2-10-PLAN.md
│
├── popup/                       # 🟢 Batch 1: READY
│   ├── popup-initialization.test.js    (Tests 1-10)
│   ├── popup-recording.test.js          (Tests 11-20)
│   ├── popup-actions-display.test.js    (Tests 21-30)
│   └── popup-action-removal.test.js     (Tests 31-40)
│
├── settings/                    # 🔴 Batch 3: TODO
│   └── (будет добавлено)
│
├── background/                  # 🔴 Batch 4: TODO
│   └── (будет добавлено)
│
├── content/                     # 🔴 Batch 5,7,8: TODO
│   └── (будет добавлено)
│
├── ai/                          # 🔴 Batch 6: TODO
│   └── (будет добавлено)
│
├── integration/                 # 🔴 Batch 9: TODO
│   └── (будет добавлено)
│
└── edge-cases/                  # 🔴 Batch 10: TODO
    └── (будет добавлено)
```

---

## 🚀 Quick Start

### Step 1: Installation
```bash
npm install
```

### Step 2: Run Current Tests
```bash
npm test

# Expected result:
# Test Suites: 44 passed (including new tests/)
# Tests:       290 passed (250 existing + 40 new)
# Coverage:    ~48% (+5% from baseline)
```

### Step 3: Check Coverage
```bash
npm run test:coverage

# Open report
open coverage/lcov-report/index.html
```

### Step 4: Update Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 45,  // was 40
    functions: 45,
    lines: 45,
    statements: 45
  }
}
```

---

## 📊 Test Batches Progress

- [x] **Batch 1:** Popup UI Core (40 tests) — 🟢 COMPLETE
- [x] **Batch 3:** Content Scripts (20 tests) — 🟢 COMPLETE  
- [ ] **Batch 2:** Import/Export (40 tests) — Week 2
- [ ] **Batch 4:** Settings (40 tests) — Week 3
- [ ] **Batch 5:** Background (50 tests) — Week 4
- [ ] **Batch 6:** Content Integration (50 tests) — Week 6
- [ ] **Batch 7:** AI Parser (40 tests) — Week 7
- [ ] **Batch 8:** ElementFinder (45 tests) — Week 8
- [ ] **Batch 9:** Recorder/Executor (50 tests) — Week 10
- [ ] **Batch 10:** E2E Integration (60 tests) — Week 12

**Progress:** 2/10 batches (20%)  
**Current Coverage:** 48% (Target: 70%)

---

## 🎯 Coverage Goals

| Milestone | Coverage | Tests | Timeline |
|-----------|----------|-------|----------|
| Current | 43% | 250 | - |
| Batch 1 | 48% | 290 | Week 1 |
| Batch 2 | 53% | 330 | Week 2 |
| Batch 3 | 60% | 370 | Week 3 |
| **Batch 5** | **70%** | **470** | **Week 6** 🎉 |
| Batch 8 | 80% | 605 | Week 10 |
| **Batch 10** | **85%** | **715** | **Week 14** 🏆 |

**Don't aim for 100%!** 85% = perfect for production.

---

## ✅ Verification

After implementing Batch 1 and 3:

```bash
# 1. All tests pass
npm test
# ✅ 290 tests passed

# 2. Coverage increased
npm run test:coverage
# ✅ ~48% (was 43%)

# 3. Lint passes
npm run lint
# ✅ No errors

# 4. Build works
npm run build
# ✅ deploy/ created

# 5. CI passes
# ✅ GitHub Actions green
```

---

## 🐛 Troubleshooting

### Tests not found?
```javascript
// jest.config.js - добавьте:
testMatch: [
  '**/__tests__/**/*.test.js',
  '**/tests/**/*.test.js',  // <-- Это!
]
```

### Coverage not increasing?
```bash
# Проверьте что тесты выполняют код
npm test -- --verbose

# Посмотреть подробный репорт
open coverage/lcov-report/index.html
```

### CI fails?
```bash
# Убедитесь что threshold соответствует фактическому coverage
# jest.config.js: coverageThreshold.global.*
```

---

## 📝 Writing New Tests

### Template:

```javascript
/**
 * BATCH X: Module Name Tests
 * Tests: N-M
 * Coverage: module.js specific functionality
 */

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
    document.body.innerHTML = `...`;
    global.chrome = { ... };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should do something specific', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Best Practices:

✅ **DO:**
- Test behavior, not implementation
- Keep tests isolated and independent
- Use descriptive test names
- Mock external dependencies
- Aim for <100ms per test

❌ **DON'T:**
- Test implementation details
- Make tests depend on each other
- Use vague test names
- Test third-party code
- Create slow tests (>1s)
- Forget to clean up DOM mocks

---

## 📈 Metrics

### Current State:
```
Total Tests:     250 (src/__tests__/)
                 +40 (tests/popup/) ← NEW
                 +20 (tests/content/) ← NEW
                 ---
                 310 total

Coverage:        43% → ~48%

Test Suites:     ~40 → ~45

Execution Time:  ~15s → ~20s
```

### Target State (Week 14):
```
Total Tests:     715
Coverage:        85-90%
Test Suites:     ~80
Execution Time:  ~45s
```

---

## 🔗 Links

- [Main README](../README.md)
- [Test Suite Masterplan](docs/TEST-SUITE-MASTERPLAN.md)
- [Batch 1 Guide](docs/BATCH-1-IMPLEMENTATION-GUIDE.md)
- [Testing Guide](../docs/TESTING.md)
- [GitHub Actions](.github/workflows/ci.yml)

---

**Status:** 🟢 Ready for Testing  
**Next:** Run `npm test` to execute all tests  
**Updated:** 2025-11-08
