# 🧪 AI-Autoclicker Test Suite

**Текущий статус:** 🟡 Batch 1 Ready (40 tests)  
**Coverage:** 43% → 85% target  
**Timeline:** 14 weeks (~3.5 months)

---

## 📚 Документация

### 📖 Основные документы:

1. **[TEST-SUITE-MASTERPLAN.md](docs/TEST-SUITE-MASTERPLAN.md)**
   - Полный план 465 тестов
   - 10 батчей по 40-60 тестов
   - Coverage projection: 43% → 85%
   - Timeline и milestones

2. **[BATCH-1-IMPLEMENTATION-GUIDE.md](docs/BATCH-1-IMPLEMENTATION-GUIDE.md)**
   - Пошаговая инструкция внедрения
   - 40 тестов popup UI
   - Verification checklist
   - Troubleshooting

3. **[BATCHES-2-10-PLAN.md](docs/BATCHES-2-10-PLAN.md)**
   - Роадмап батчей 2-10
   - Примеры тестов
   - Coverage milestones

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

### Шаг 1: Установка
```bash
npm install
```

### Шаг 2: Запуск Batch 1
```bash
npm test

# Ожидаемый результат:
# Test Suites: 44 passed (+4 new from tests/)
# Tests:       290 passed (+40 new)
# Coverage:    ~48% (+5%)
```

### Шаг 3: Проверка coverage
```bash
npm run test:coverage

# Открыть репорт
open coverage/lcov-report/index.html
```

### Шаг 4: Поднять threshold
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

- [x] **Batch 1:** Popup UI Core (40 tests) — 🟢 READY
- [ ] **Batch 2:** Import/Export (40 tests) — Week 2
- [ ] **Batch 3:** Settings (40 tests) — Week 3
- [ ] **Batch 4:** Background (50 tests) — Week 4
- [ ] **Batch 5:** Content Integration (50 tests) — Week 6
- [ ] **Batch 6:** AI Parser (40 tests) — Week 7
- [ ] **Batch 7:** ElementFinder (45 tests) — Week 8
- [ ] **Batch 8:** Recorder/Executor (50 tests) — Week 10
- [ ] **Batch 9:** E2E Integration (60 tests) — Week 12
- [ ] **Batch 10:** Edge Cases (50 tests) — Week 14

**Progress:** 1/10 batches (10%)  
**Coverage:** 43% (Target: 85%)

---

## 🎯 Coverage Goals

| Milestone | Coverage | Tests | Timeline |
|-----------|----------|-------|----------|
| Current | 43% | 250 | - |
| Batch 1 | 48% | 290 | Week 1 |
| Batch 3 | 60% | 370 | Week 3 |
| **Batch 5** | **70%** | **470** | **Week 6** 🎉 |
| Batch 8 | 80% | 605 | Week 10 |
| **Batch 10** | **85%** | **715** | **Week 14** 🏆 |

**НЕ стремиться к 100%!** 85% = перфектно для production.

---

## ✅ Verification

После внедрения Batch 1:

```bash
# 1. Все тесты проходят
npm test
# ✅ 290 tests passed

# 2. Coverage увеличился
npm run test:coverage
# ✅ ~48% (was 43%)

# 3. Lint проходит
npm run lint
# ✅ No errors

# 4. Build работает
npm run build
# ✅ deploy/ created

# 5. CI проходит
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

---

## 📈 Metrics

### Current State:
```
Total Tests:     250 (src/__tests__/)
                 +40 (tests/popup/) ← NEW
                 ---
                 290 total

Coverage:        43% → ~48%

Test Suites:     ~40 → ~44

Execution Time:  ~15s → ~18s
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
- [GitHub Actions](.github/workflows/ci.yml)

---

**Статус:** 🟢 Ready for Testing  
**Next:** Run `npm test` to execute Batch 1  
**Updated:** 2025-11-08
