# AUDIT Part 4: Phase 2 & 3 Detailed Plans

## Overview

This document provides comprehensive implementation plans for Phase 2 (Playback Engine + UI/UX Redesign) and Phase 3 (Testing + CI/CD + Documentation) of the AI-Autoclicker extension, taking into account all conflicts and issues identified in Part 3.

---

## PHASE 2: Playback Engine + UI/UX Redesign

### 2.1 New Components - Playback Engine

#### Core Playback Components

| Component | Type | Path | Est. Lines | Dependencies | Priority |
|-----------|------|------|------------|--------------|----------|
| PlaybackEngine | Class | `src/playback/PlaybackEngine.js` | 250 | ActionExecutor, ElementFinder, StorageService | CRITICAL |
| PlaybackQueue | Class | `src/playback/PlaybackQueue.js` | 180 | EventEmitter, Logger | HIGH |
| PlaybackStateManager | Class | `src/playback/PlaybackStateManager.js` | 200 | StorageService, EventEmitter | HIGH |
| PlaybackValidator | Class | `src/playback/PlaybackValidator.js` | 150 | Validator, Constants | MEDIUM |
| PlaybackUI | Class | `src/playback/PlaybackUI.js` | 220 | LiveModeOverlay, EventEmitter | HIGH |
| PlaybackController | Class | `src/playback/PlaybackController.js` | 280 | PlaybackEngine, PlaybackUI, MessageRouter | CRITICAL |
| ActionTiming | Class | `src/playback/ActionTiming.js` | 120 | Logger | MEDIUM |
| ErrorRecovery | Class | `src/playback/ErrorRecovery.js` | 160 | Logger, StorageService | MEDIUM |

#### Integration Components

| Component | Type | Path | Est. Lines | Dependencies | Priority |
|-----------|------|------|------------|--------------|----------|
| ModeSwitcher | Class | `src/common/ModeSwitcher.js` | 140 | EventEmitter, StorageService | CRITICAL |
| SharedStateManager | Class | `src/common/SharedStateManager.js` | 200 | StorageService, EventEmitter | HIGH |
| UnifiedMessageRouter | Class | `src/background/UnifiedMessageRouter.js` | 320 | EventEmitter, Logger | CRITICAL |

### 2.2 Existing Component Modifications

#### Critical Modifications (Conflict Resolution)

| File | Modification Type | Lines Affected | Description | Effort (hrs) |
|------|-------------------|----------------|-------------|--------------|
| `src/popup/index.js` | Function Rename | 234 | Rename `handleToggleLiveMode` → `handlePopupToggleLiveMode` | 2 |
| `src/content/index.js` | Function Rename | 286 | Rename `handleToggleLiveMode` → `handleContentToggleLiveMode` | 2 |
| `src/background/index.js` | Message Router Replace | 20-50 | Replace with UnifiedMessageRouter | 6 |
| `src/background/voiceHandler.js` | Storage Migration | 6, 324 | Migrate to storageService | 4 |
| `src/popup/settings.js` | Storage Migration | 5 | Migrate to storageService | 3 |
| `src/settings/index.js` | DEPRECATED | ALL | Remove old settings system | 2 |

#### UI/UX Updates

| File | Modification Type | Changes Required | Effort (hrs) |
|------|-------------------|------------------|--------------|
| `src/popup/index.html` | UI Enhancement | Add playback controls, mode switcher | 4 |
| `src/popup/popup.css` | Styling Update | Playback controls styling, mode indicators | 6 |
| `src/content/LiveModeOverlay.js` | Integration | Add playback overlay support | 8 |
| `src/common/constants.js` | Constants Add | Playback constants, mode enums | 2 |

### 2.3 Integration Strategy: Playback ↔ Live Mode

#### Shared State Management

```javascript
// Mode definitions
export const MODES = {
  LIVE: 'live',
  PLAYBACK: 'playback',
  IDLE: 'idle'
};

// Shared state structure
const sharedState = {
  currentMode: MODES.IDLE,
  isActive: false,
  recording: null,
  playback: null,
  overlay: {
    visible: false,
    type: null // 'live' or 'playback'
  }
};
```

#### UI Switching Logic

1. **Mode Switcher Component**: Centralized mode management
2. **Overlay Management**: Single overlay system with type switching
3. **Control Isolation**: Separate controls for each mode
4. **State Persistence**: Mode state saved to Chrome storage

#### Resource Management

1. **Audio Stream Mutex**: Prevent concurrent Live/Playback audio
2. **WebSocket Pooling**: Single connection management
3. **DOM Event Isolation**: Namespaced event handlers
4. **Memory Cleanup**: Proper cleanup on mode switches

### 2.4 UI/UX Design Specifications

#### Playback Controls Layout

```
Popup UI Structure:
┌─────────────────────────┐
│ Mode Switcher           │ [LIVE] [PLAYBACK]
├─────────────────────────┤
│ Live Controls           │ (shown when LIVE mode)
│ - Start Recording       │
│ - Voice Input           │
├─────────────────────────┤
│ Playback Controls       │ (shown when PLAYBACK mode)
│ - Load Recording        │
│ - Play/Pause/Stop       │
│ - Speed Control         │
│ - Progress Bar          │
├─────────────────────────┤
│ Shared Settings         │
│ - Model Selection       │
│ - API Settings          │
└─────────────────────────┘
```

#### Overlay Design

- **Live Mode**: Red border, "LIVE MODE" indicator
- **Playback Mode**: Blue border, "PLAYBACK MODE" indicator
- **Shared Elements**: Action highlighting, status messages
- **Z-index Hierarchy**: Live (9999), Playback (9998), Content (default)

---

## PHASE 3: Testing + CI/CD + Documentation

### 3.1 Test Coverage for Gemini Live (Existing 11 Files)

#### Current Test Status Analysis

| File | Current Tests | Required Tests | Gap | Priority |
|------|---------------|----------------|-----|----------|
| `src/services/geminiLive.js` | 8 | 15 | +7 | HIGH |
| `src/common/VoiceInput.js` | 0 | 10 | +10 | CRITICAL |
| `src/popup/voice.js` | 0 | 8 | +8 | HIGH |
| `src/background/voiceHandler.js` | 5 | 12 | +7 | HIGH |
| Integration Tests | 0 | 20 | +20 | CRITICAL |

#### Required Additional Tests

1. **GeminiLiveService Tests** (`tests/services/geminiLive.advanced.test.js`)
   - Fallback chain testing (3 tests)
   - WebSocket connection management (2 tests)
   - Audio stream handling (2 tests)

2. **VoiceInput Tests** (`tests/common/VoiceInput.test.js`)
   - Microphone access (2 tests)
   - Audio processing (3 tests)
   - Error handling (3 tests)
   - Cleanup (2 tests)

3. **Voice Handler Tests** (`tests/background/voiceHandler.advanced.test.js`)
   - Message routing (3 tests)
   - State management (2 tests)
   - Error recovery (2 tests)

4. **Integration Tests** (`tests/integration/voice-flow.test.js`)
   - End-to-end voice command flow (10 tests)
   - Cross-component communication (5 tests)
   - Error propagation (5 tests)

### 3.2 Test Coverage for Playback Engine (Phase 2 Components)

#### Unit Tests

| Component | Test File | Tests Required | Coverage Target |
|-----------|-----------|----------------|-----------------|
| PlaybackEngine | `tests/playback/PlaybackEngine.test.js` | 12 | 95% |
| PlaybackQueue | `tests/playback/PlaybackQueue.test.js` | 10 | 90% |
| PlaybackStateManager | `tests/playback/PlaybackStateManager.test.js` | 11 | 95% |
| PlaybackValidator | `tests/playback/PlaybackValidator.test.js` | 8 | 85% |
| PlaybackUI | `tests/playback/PlaybackUI.test.js` | 9 | 85% |
| PlaybackController | `tests/playback/PlaybackController.test.js` | 14 | 95% |
| ActionTiming | `tests/playback/ActionTiming.test.js` | 7 | 80% |
| ErrorRecovery | `tests/playback/ErrorRecovery.test.js` | 8 | 85% |

#### Integration Tests

| Test Suite | File | Scenarios | Effort (hrs) |
|------------|------|-----------|--------------|
| Playback Flow | `tests/integration/playback-flow.test.js` | 15 scenarios | 12 |
| Mode Switching | `tests/integration/mode-switching.test.js` | 10 scenarios | 8 |
| Error Recovery | `tests/integration/error-recovery.test.js` | 8 scenarios | 6 |
| State Persistence | `tests/integration/state-persistence.test.js` | 6 scenarios | 4 |

#### E2E Tests

| Scenario | Description | Test File | Effort (hrs) |
|----------|-------------|-----------|--------------|
| Record → Playback | Full recording and playback cycle | `tests/e2e/record-playback.test.js` | 10 |
| Voice → Action | Voice command to action execution | `tests/e2e/voice-action.test.js` | 8 |
| Mode Switch | Live ↔ Playback switching | `tests/e2e/mode-switch.test.js` | 6 |
| Error Recovery | Error handling and recovery | `tests/e2e/error-recovery.test.js` | 8 |

### 3.3 CI/CD Workflow Updates

#### New GitHub Actions Workflows

```yaml
# .github/workflows/extension-testing.yml
name: Extension Testing
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Build extension
        run: npm run build
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  extension-testing:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Chrome
        uses: browser-actions/setup-chrome@latest
      - name: Run E2E tests
        run: npm run test:e2e
```

#### Test Configuration Updates

| File | Updates Required | Purpose |
|------|------------------|---------|
| `jest.config.cjs` | ES modules support, Chrome API mocks | Fix test failures |
| `tests/setup.js` | Enhanced Chrome API mocking | Comprehensive testing |
| `package.json` | New test scripts | CI/CD integration |

#### WebSocket Testing Strategy

1. **Mock WebSocket Server**: For unit tests
2. **Integration Test Server**: Real WebSocket for integration tests
3. **Chrome Extension Testing**: Puppeteer with extension loading
4. **Voice API Mocking**: Web Audio API simulation

### 3.4 Documentation Tasks

#### Architecture Documentation Updates

| Document | Updates Required | Effort (hrs) |
|----------|------------------|--------------|
| `ARCHITECTURE.md` | Add Playback Engine architecture | 6 |
| `docs/playback-engine.md` | New comprehensive guide | 8 |
| `docs/mode-management.md` | Live ↔ Playback integration | 4 |
| `docs/api-reference.md` | New APIs documentation | 6 |

#### API Documentation

| Component | Documentation Required | Format |
|-----------|------------------------|--------|
| PlaybackEngine | Class methods, events, examples | JSDoc + Markdown |
| UnifiedMessageRouter | Message format, routing rules | JSDoc + README |
| SharedStateManager | State schema, methods | JSDoc + examples |

#### Setup Guide Updates

| Section | Content Required | Effort (hrs) |
|---------|-----------------|--------------|
| Development Setup | Playback Engine development | 4 |
| Testing Guide | New test frameworks, E2E setup | 6 |
| Debugging Guide | Chrome extension debugging | 3 |
| Contributing Guidelines | Code review checklist | 2 |

#### Troubleshooting Guide

| Area | Common Issues | Solutions | Effort (hrs) |
|------|---------------|-----------|--------------|
| Mode Switching | State conflicts, UI issues | Resolution steps | 3 |
| Voice Integration | Audio permissions, API limits | Troubleshooting flow | 4 |
| Playback Issues | Timing errors, DOM changes | Debug procedures | 3 |
| Extension Loading | Manifest issues, permissions | Setup verification | 2 |

---

## Complete Execution Order with Dependencies

### Phase 2 Implementation Order

#### Week 1: Foundation (32 hours)

| Step | Task | Dependencies | Effort (hrs) |
|------|------|--------------|--------------|
| 2.1.1 | Fix Critical Conflicts (function names, storage) | None | 6 |
| 2.1.2 | Implement UnifiedMessageRouter | Step 2.1.1 | 8 |
| 2.1.3 | Create SharedStateManager | Step 2.1.1 | 6 |
| 2.1.4 | Implement ModeSwitcher | Step 2.1.3 | 6 |
| 2.1.5 | Update constants and enums | None | 2 |
| 2.1.6 | Basic UI layout updates | Step 2.1.4 | 4 |

#### Week 2: Core Playback Engine (40 hours)

| Step | Task | Dependencies | Effort (hrs) |
|------|------|--------------|--------------|
| 2.2.1 | Create PlaybackEngine | Week 1 complete | 10 |
| 2.2.2 | Create PlaybackQueue | Step 2.2.1 | 8 |
| 2.2.3 | Create PlaybackStateManager | Step 2.2.2 | 10 |
| 2.2.4 | Create PlaybackValidator | Step 2.2.1 | 6 |
| 2.2.5 | Create ActionTiming | Step 2.2.2 | 6 |

#### Week 3: Integration & UI (36 hours)

| Step | Task | Dependencies | Effort (hrs) |
|------|------|--------------|--------------|
| 2.3.1 | Create PlaybackUI | Week 2 complete | 8 |
| 2.3.2 | Create PlaybackController | Step 2.3.1 | 10 |
| 2.3.3 | Create ErrorRecovery | Step 2.3.2 | 8 |
| 2.3.4 | Integrate with LiveModeOverlay | Step 2.3.1 | 6 |
| 2.3.5 | Complete UI/UX updates | Step 2.3.4 | 4 |

### Phase 3 Implementation Order

#### Week 4: Testing Foundation (48 hours)

| Step | Task | Dependencies | Effort (hrs) |
|------|------|--------------|--------------|
| 3.1.1 | Fix existing test failures | None | 12 |
| 3.1.2 | Update Jest configuration | Step 3.1.1 | 4 |
| 3.1.3 | Create Playback Engine unit tests | Phase 2 complete | 16 |
| 3.1.4 | Create Gemini Live additional tests | Phase 2 complete | 8 |
| 3.1.5 | Setup test infrastructure | Step 3.1.2 | 8 |

#### Week 5: Advanced Testing (40 hours)

| Step | Task | Dependencies | Effort (hrs) |
|------|------|--------------|--------------|
| 3.2.1 | Create integration tests | Week 4 complete | 16 |
| 3.2.2 | Create E2E test suite | Step 3.2.1 | 12 |
| 3.2.3 | Setup CI/CD pipeline | Step 3.2.1 | 8 |
| 3.2.4 | WebSocket testing setup | Step 3.2.3 | 4 |

#### Week 6: Documentation & Polish (32 hours)

| Step | Task | Dependencies | Effort (hrs) |
|------|------|--------------|--------------|
| 3.3.1 | Update architecture documentation | Phase 2 complete | 12 |
| 3.3.2 | Create API documentation | Step 3.3.1 | 8 |
| 3.3.3 | Update guides and troubleshooting | Step 3.3.2 | 8 |
| 3.3.4 | Final testing and validation | All previous steps | 4 |

---

## Success Criteria & Acceptance Tests

### Phase 2 Success Criteria

✅ **Functional Requirements**
- All Playback Engine components implemented and tested
- Live ↔ Playback mode switching works seamlessly
- No resource conflicts (audio, WebSocket, DOM)
- UI/UX provides clear mode indication and controls

✅ **Technical Requirements**
- 95% code coverage for new components
- No critical or high severity conflicts remain
- All existing functionality preserved
- Build process completes without errors

✅ **Performance Requirements**
- Mode switching under 500ms
- Playback accuracy > 99%
- Memory usage increase < 20%
- No memory leaks in mode switching

### Phase 3 Success Criteria

✅ **Testing Requirements**
- Overall test coverage > 90%
- All tests pass consistently
- CI/CD pipeline green on main branch
- E2E tests cover critical user flows

✅ **Documentation Requirements**
- All new components documented
- API reference complete and accurate
- Setup guide reproducible by new developers
- Troubleshooting guide covers common issues

✅ **Quality Requirements**
- Code review pass rate > 95%
- No critical security vulnerabilities
- Extension loads in Chrome without errors
- Performance benchmarks met

---

## Risk Mitigation Strategies

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Chrome API changes | Medium | High | Feature detection, fallbacks |
| WebSocket instability | Medium | Medium | Retry logic, connection pooling |
| Memory leaks | Low | High | Comprehensive testing, cleanup |
| DOM conflicts | Medium | Medium | Event namespacing, cleanup |

### Project Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | Medium | Strict change control |
| Integration issues | Medium | High | Incremental integration |
| Test coverage gaps | Low | Medium | Coverage requirements |
| Documentation debt | Medium | Low | Documentation first approach |

---

## Summary

**Total Estimated Effort: 228 hours**
- Phase 2: 108 hours (3 weeks)
- Phase 3: 120 hours (3 weeks)

**Critical Path Dependencies:**
1. Conflict resolution must precede all Phase 2 work
2. UnifiedMessageRouter must be implemented before mode switching
3. Test infrastructure must be updated before new test creation
4. CI/CD pipeline must be working before E2E tests

**Key Success Factors:**
- Systematic conflict resolution from Part 3
- Incremental integration with continuous testing
- Comprehensive documentation throughout development
- Regular code reviews and quality gates

This plan provides a detailed, conflict-aware roadmap for implementing the Playback Engine and comprehensive testing strategy while maintaining system stability and code quality.
