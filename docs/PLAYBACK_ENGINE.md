# Playback Engine

The Playback Engine provides deterministic replay of recorded browser actions with precise timing, visual feedback, and comprehensive error handling.

## Overview

The Playback Engine transforms recorded user actions into automated sequences that can be replayed reliably. It supports various action types, timing controls, and provides both visual and audio feedback during execution.

## Features

- **Deterministic Replay**: Precise reproduction of recorded actions
- **Timing Control**: Configurable delays and playback speeds
- **Visual Feedback**: Element highlighting and progress indicators
- **Audio Feedback**: Success/error sounds and notifications
- **Error Recovery**: Retry logic and graceful failure handling
- **State Management**: Pause, resume, and stop capabilities
- **Event System**: Comprehensive progress and completion events

## Architecture

### Core Components

#### PlaybackEngine (`src/services/playbackEngine.js`)
The main engine that orchestrates action execution.

#### PlaybackHandler (`src/background/playbackHandler.js`)
Background script integration for cross-tab playback.

#### PlaybackRenderer (`src/content/playbackRenderer.js`)
Content script component for DOM interaction and visual effects.

### Message Flow

```
Popup → Background → PlaybackEngine → ContentScript → DOM
  ↑         ↓              ↓              ↑
UI ← Events ← Progress ← Results ← Actions
```

## Action Types

### Click Actions
```javascript
{
  type: 'click',
  selector: '#submit-button',
  delay: 500,
  description: 'Click submit button'
}
```

### Input Actions
```javascript
{
  type: 'input',
  selector: '#username',
  text: 'john.doe',
  delay: 300,
  description: 'Type username'
}
```

### Scroll Actions
```javascript
{
  type: 'scroll',
  direction: 'down',
  amount: 300,
  delay: 200,
  description: 'Scroll down'
}
```

### Wait Actions
```javascript
{
  type: 'wait',
  duration: 2000,
  description: 'Wait 2 seconds'
}
```

### Double Click Actions
```javascript
{
  type: 'double_click',
  selector: '.file-item',
  delay: 500,
  description: 'Double click file'
}
```

### Right Click Actions
```javascript
{
  type: 'right_click',
  selector: '#context-menu',
  delay: 500,
  description: 'Right click element'
}
```

## API Reference

### PlaybackEngine Class

#### Constructor
```javascript
const engine = new PlaybackEngine();
```

#### Methods

##### `replay(actions, options)`
Executes a sequence of actions.

```javascript
const result = await engine.replay(actions, {
  speed: 1.5,           // Playback speed multiplier
  stopOnError: false,    // Stop on first error
  retryCount: 3,        // Number of retries per action
  batch: false,         // Batch operations
  pauseAtEach: false    // Pause after each action
});
```

**Parameters:**
- `actions` (Array): Array of action objects
- `options.speed` (number): Playback speed multiplier (0.5-3.0)
- `options.stopOnError` (boolean): Stop execution on first error
- `options.retryCount` (number): Number of retries for failed actions
- `options.batch` (boolean): Enable batch processing
- `options.pauseAtEach` (boolean): Pause after each action

**Returns:**
```javascript
{
  success: boolean,
  completed: number,
  failed: number,
  errors: Array<string>,
  executionTime: number,
  actions: Array<Object>
}
```

##### `pause()`
Pauses the current playback.

```javascript
await engine.pause();
```

##### `resume()`
Resumes paused playback.

```javascript
await engine.resume();
```

##### `stop()`
Stops the current playback.

```javascript
const result = await engine.stop();
// Returns: { success: boolean, stopped: number }
```

##### `getStatus()`
Gets current playback status.

```javascript
const status = engine.getStatus();
// Returns: {
//   status: 'idle' | 'running' | 'paused' | 'complete' | 'error',
//   currentIndex: number,
//   totalActions: number,
//   completed: number,
//   failed: number,
//   progress: number
// }
```

##### `on(event, listener)`
Adds event listener.

```javascript
engine.on('progress', (data) => {
  console.log(`Progress: ${data.percentage}%`);
});

engine.on('complete', (result) => {
  console.log('Playback completed:', result);
});

engine.on('error', (error) => {
  console.error('Playback error:', error);
});
```

##### `off(event, listener)`
Removes event listener.

```javascript
const listener = (data) => console.log(data);
engine.on('progress', listener);
engine.off('progress', listener);
```

### PlaybackHandler Class

#### Constructor
```javascript
const handler = new PlaybackHandler();
```

#### Methods

##### `start(actions, options)`
Starts a new playback job.

```javascript
const jobId = await handler.start(actions, options);
```

##### `stop(jobId)`
Stops a specific playback job.

```javascript
const result = await handler.stop(jobId);
```

##### `pause(jobId)`
Pauses a specific playback job.

```javascript
const result = await handler.pause(jobId);
```

##### `resume(jobId)`
Resumes a paused playback job.

```javascript
const result = await handler.resume(jobId);
```

##### `getStatus(jobId)`
Gets status of a specific job.

```javascript
const status = await handler.getStatus(jobId);
```

## Visual Feedback

### Element Highlighting
Elements are highlighted before action execution:

```javascript
// Highlight configuration
const highlightConfig = {
  color: '#ff0000',
  duration: 500,
  borderWidth: '3px',
  borderRadius: '4px',
  animation: 'pulse'
};
```

### Progress Indicators
Visual progress bars and status indicators:

```javascript
// Progress update
{
  type: 'UPDATE_PROGRESS',
  current: 3,
  total: 10,
  percentage: 30,
  currentAction: 'Click submit button'
}
```

### Action Animations
Smooth animations for different action types:

- **Click**: Ripple effect
- **Input**: Typing animation
- **Scroll**: Smooth scroll visualization
- **Wait**: Countdown timer

## Audio Feedback

### Success Sounds
Played when actions complete successfully:

```javascript
await engine.playSuccessSound('success.mp3');
```

### Error Sounds
Played when actions fail:

```javascript
await engine.playErrorSound('error.mp3');
```

### Custom Audio Files
Use custom audio files:

```javascript
engine.setAudioFiles({
  success: 'custom-success.mp3',
  error: 'custom-error.mp3',
  complete: 'custom-complete.mp3'
});
```

## Error Handling

### Retry Logic
Automatic retry with exponential backoff:

```javascript
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2
};
```

### Error Types

#### Element Not Found
```javascript
{
  success: false,
  error: 'Element not found: #non-existent',
  type: 'ELEMENT_NOT_FOUND',
  selector: '#non-existent'
}
```

#### Timeout Error
```javascript
{
  success: false,
  error: 'Action timeout after 5000ms',
  type: 'TIMEOUT',
  timeout: 5000
}
```

#### Permission Denied
```javascript
{
  success: false,
  error: 'Permission denied for element interaction',
  type: 'PERMISSION_DENIED'
}
```

### Recovery Strategies

#### Element Relocation
Attempts to find elements using alternative selectors:

```javascript
const fallbackStrategies = [
  (selector) => `[data-testid="${selector.replace('#', '')}"]`,
  (selector) => `[aria-label="${selector.replace(/[#\[]/g, '')}"]`,
  (selector) => `button:contains("${selector.replace(/[#\[\\]]/g, '')}")`
];
```

#### Wait Strategies
Waits for elements to become available:

```javascript
const waitConfig = {
  maxWaitTime: 10000,
  checkInterval: 100,
  strategies: ['waitForElement', 'waitForVisible', 'waitForClickable']
};
```

## Performance Optimization

### Batching
Groups similar actions for better performance:

```javascript
// Batch consecutive clicks
const batchedActions = [
  { type: 'batch', actions: [
    { type: 'click', selector: '#btn1' },
    { type: 'click', selector: '#btn2' },
    { type: 'click', selector: '#btn3' }
  ]}
];
```

### Caching
Caches element selectors and DOM queries:

```javascript
const cache = new Map();
function findElement(selector) {
  if (cache.has(selector)) {
    return cache.get(selector);
  }
  const element = document.querySelector(selector);
  cache.set(selector, element);
  return element;
}
```

### Lazy Loading
Loads resources only when needed:

```javascript
const lazyLoad = {
  audio: false,
  animations: false,
  styles: false
};
```

## Integration Examples

### Voice Control Integration
```javascript
// Voice command to playback
voiceHandler.on('command', async (command) => {
  const action = voiceToAction(command);
  const result = await playbackEngine.replay([action]);
  
  if (result.success) {
    voiceHandler.speak('Action completed successfully');
  } else {
    voiceHandler.speak('Action failed, please try again');
  }
});
```

### Recording Integration
```javascript
// Recording to playback
recorder.on('stop', async (actions) => {
  const result = await playbackEngine.replay(actions);
  
  if (result.success) {
    showNotification('Recording replayed successfully');
  }
});
```

### Settings Integration
```javascript
// Settings-based configuration
settings.on('change', (newSettings) => {
  playbackEngine.setSpeed(newSettings.playbackSpeed);
  playbackEngine.setAudioEnabled(newSettings.audioEnabled);
  playbackEngine.setRetryCount(newSettings.retryCount);
});
```

## Testing

### Unit Tests
```javascript
describe('PlaybackEngine', () => {
  test('should execute click action', async () => {
    const actions = [{ type: 'click', selector: '#button' }];
    const result = await engine.replay(actions);
    
    expect(result.success).toBe(true);
    expect(result.completed).toBe(1);
  });
});
```

### Integration Tests
```javascript
describe('Playback Integration', () => {
  test('should handle voice to playback flow', async () => {
    const voiceCommand = { text: 'click submit button' };
    const action = await voiceToAction(voiceCommand);
    const result = await engine.replay([action]);
    
    expect(result.success).toBe(true);
  });
});
```

### Performance Tests
```javascript
test('should handle large action sequences efficiently', async () => {
  const actions = Array(1000).fill().map((_, i) => ({
    type: 'click',
    selector: `#button${i}`,
    delay: 1
  }));
  
  const startTime = Date.now();
  const result = await engine.replay(actions);
  const endTime = Date.now();
  
  expect(result.success).toBe(true);
  expect(endTime - startTime).toBeLessThan(5000);
});
```

## Troubleshooting

### Common Issues

#### Actions Not Executing
1. Check element selectors are valid
2. Verify page is fully loaded
3. Check permissions for content scripts
4. Ensure elements are visible and enabled

#### Timing Issues
1. Adjust delay values
2. Use wait actions for dynamic content
3. Enable retry logic
4. Check network latency

#### Memory Leaks
1. Clear event listeners
2. Dispose of audio objects
3. Clean up DOM references
4. Monitor memory usage

### Debug Tools

#### Console Logging
```javascript
engine.setDebugMode(true);
// Enables detailed logging
```

#### Performance Monitoring
```javascript
engine.on('performance', (metrics) => {
  console.log('Performance:', {
    actionTime: metrics.actionTime,
    totalTime: metrics.totalTime,
    memoryUsage: metrics.memoryUsage
  });
});
```

#### Error Tracking
```javascript
engine.on('error', (error) => {
  // Send to error tracking service
  errorTracker.track(error);
});
```

## Best Practices

### Action Design
1. Use specific, reliable selectors
2. Add appropriate delays between actions
3. Include descriptive text for debugging
4. Handle dynamic content with wait actions
5. Test on different page states

### Error Handling
1. Implement retry logic
2. Provide fallback selectors
3. Handle timeouts gracefully
4. Log errors for debugging
5. User-friendly error messages

### Performance
1. Batch related actions
2. Use efficient selectors
3. Cache frequently used elements
4. Minimize DOM queries
5. Optimize for large sequences

## Configuration

### Default Settings
```javascript
const defaultConfig = {
  speed: 1.0,
  retryCount: 3,
  timeout: 5000,
  stopOnError: false,
  audioEnabled: true,
  visualFeedback: true,
  debugMode: false
};
```

### Custom Configuration
```javascript
engine.configure({
  speed: 1.5,
  retryCount: 5,
  timeout: 10000,
  audioFiles: {
    success: 'custom-success.mp3',
    error: 'custom-error.mp3'
  },
  visualEffects: {
    highlightColor: '#00ff00',
    animationDuration: 300
  }
});
```

## Future Enhancements

### Planned Features
- Machine learning for element detection
- Adaptive timing based on page load
- Cross-browser synchronization
- Advanced error recovery
- Visual recording and playback

### Technical Improvements
- WebSocket support for real-time updates
- Service worker integration
- IndexedDB for action storage
- WebAssembly for performance
- Progressive Web App support

---

**Playback Engine v3.0.0** - Reliable, precise automation playback! 🎬