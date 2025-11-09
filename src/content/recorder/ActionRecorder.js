/**
 * Records user interactions on the page
 */

export class ActionRecorder {
  constructor(elementFinder) {
    this.elementFinder = elementFinder;
    this.isRecording = false;
    this.recordedActions = [];
    this.lastAction = null;
    this.listeners = [];
    this.startTime = null;
    this.scrollTimeout = null;
    this.lastScrollX = 0;
    this.lastScrollY = 0;
    this.lastScrollTime = 0;
    
    this.handleClick = this.handleClick.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  /**
   * Start recording
   */
  start() {
    if (this.isRecording) return;

    this.isRecording = true;
    this.startTime = Date.now();
    this.recordedActions = [];
    this.lastAction = null;
    this.lastScrollX = window.scrollX || window.pageXOffset || 0;
    this.lastScrollY = window.scrollY || window.pageYOffset || 0;
    this.lastScrollTime = 0;

    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('input', this.handleInput, true);
    document.addEventListener('change', this.handleChange, true);
    window.addEventListener('scroll', this.handleScroll, false);

    this.emit('recording-started');
  }

  /**
   * Stop recording
   */
  stop() {
    if (!this.isRecording) return;

    this.isRecording = false;

    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('input', this.handleInput, true);
    document.removeEventListener('change', this.handleChange, true);
    window.removeEventListener('scroll', this.handleScroll, false);

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    this.emit('recording-stopped', { actions: this.recordedActions });
  }

  /**
   * Handle click event
   */
  handleClick(event) {
    if (!this.isRecording) return;

    const target = event.target;
    if (this.shouldIgnoreElement(target)) return;

    // Ignore right-clicks
    if (event.button === 2) return;

    const selector = this.elementFinder.generateSelector(target);
    
    let targetText = '';
    if (target.textContent?.trim()) {
      targetText = target.textContent.trim();
    } else if (target.value) {
      targetText = target.value;
    } else if (target.placeholder) {
      targetText = target.placeholder;
    } else if (target.id) {
      targetText = target.id;
    } else {
      targetText = selector;
    }

    const action = {
      type: 'click',
      target: targetText,
      selector: selector,
      timestamp: event.timeStamp || Date.now(),
    };

    this.addAction(action);
  }

  /**
   * Handle input event
   */
  handleInput(event) {
    if (!this.isRecording) return;

    const target = event.target;
    if (
      target.tagName.toLowerCase() !== 'input' &&
      target.tagName.toLowerCase() !== 'textarea'
    ) {
      return;
    }

    const value = target.value;
    if (!value || value.length === 0) return;

    // Only record if value changed significantly
    if (
      this.lastAction?.type === 'input' &&
      this.lastAction.target === target
    ) {
      return;
    }

    const selector = this.elementFinder.generateSelector(target);
    const placeholder =
      target.placeholder || target.getAttribute('aria-label') || '';

    const action = {
      type: 'input',
      value: value,
      target: placeholder || selector,
      selector: selector,
      timestamp: event.timeStamp || Date.now(),
    };

    this.addAction(action);
  }

  /**
   * Handle change event
   */
  handleChange(event) {
    if (!this.isRecording) return;
    if (!event || !event.target) return;

    const target = event.target;
    const selector = this.elementFinder.generateSelector(target);
    
    let action = null;

    if (target.tagName.toLowerCase() === 'select') {
      const value = target.value;
      action = {
        type: 'change',
        element: selector,
        value: value,
        target: selector,
        selector: selector,
        timestamp: Date.now(),
      };
    } else if (target.tagName.toLowerCase() === 'input') {
      const inputType = target.getAttribute ? target.getAttribute('type') : target.type;
      
      if (inputType === 'checkbox') {
        action = {
          type: 'change',
          element: selector,
          value: target.checked,
          target: selector,
          selector: selector,
          timestamp: Date.now(),
        };
      } else if (inputType === 'radio') {
        if (target.checked) {
          action = {
            type: 'change',
            element: selector,
            value: target.value,
            target: selector,
            selector: selector,
            timestamp: Date.now(),
          };
        }
      }
    }

    if (action) {
      action.timestamp = event.timeStamp || Date.now();
      this.addAction(action);
    }
  }

  /**
   * Handle scroll event
   */
  handleScroll() {
    if (!this.isRecording) return;

    const currentScrollX = window.scrollX || window.pageXOffset || 0;
    const currentScrollY = window.scrollY || window.pageYOffset || 0;
    const currentTime = Date.now();

    // Calculate deltas
    const deltaX = currentScrollX - this.lastScrollX;
    const deltaY = currentScrollY - this.lastScrollY;

    // Determine direction
    let direction = 'none';
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      direction = deltaY > 0 ? 'down' : 'up';
    } else if (Math.abs(deltaX) > 0) {
      direction = deltaX > 0 ? 'right' : 'left';
    }

    // Skip tiny movements (throttling)
    const minDelta = 10;
    if (Math.abs(deltaX) < minDelta && Math.abs(deltaY) < minDelta) {
      return;
    }

    // Skip if too frequent (throttling)
    const minTimeBetweenScrolls = 100; // ms
    if (currentTime - this.lastScrollTime < minTimeBetweenScrolls) {
      return;
    }

    const action = {
      type: 'scroll',
      x: currentScrollX,
      y: currentScrollY,
      deltaX: deltaX,
      deltaY: deltaY,
      direction: direction,
      timestamp: currentTime,
    };

    this.addAction(action);

    // Update tracking state
    this.lastScrollX = currentScrollX;
    this.lastScrollY = currentScrollY;
    this.lastScrollTime = currentTime;
  }

  /**
   * Add action to recording
   */
  addAction(action) {
    // Deduplicate consecutive identical actions
    if (this.lastAction && this.isDuplicate(this.lastAction, action)) {
      return;
    }

    this.recordedActions.push(action);
    this.lastAction = action;
    this.emit('action-recorded', {
      action,
      count: this.recordedActions.length,
    });
  }

  /**
   * Check if two actions are duplicates
   */
  isDuplicate(action1, action2) {
    if (action1.type !== action2.type) return false;
    if (action2.timestamp - action1.timestamp > 1000) return false;

    switch (action1.type) {
      case 'click':
        return action1.selector === action2.selector;
      case 'input':
        return (
          action1.selector === action2.selector &&
          action1.value === action2.value
        );
      case 'change':
        return (
          action1.selector === action2.selector &&
          action1.value === action2.value
        );
      case 'scroll':
        return Math.abs(action1.y - action2.y) < 50;
      default:
        return false;
    }
  }

  /**
   * Check if element should be ignored
   */
  shouldIgnoreElement(element) {
    // Ignore extension UI elements
    if (element.closest('[data-ai-recorder-ignore]')) {
      return true;
    }

    // Ignore certain elements
    const ignoredTags = ['script', 'style', 'meta', 'link'];
    if (ignoredTags.includes(element.tagName.toLowerCase())) {
      return true;
    }

    return false;
  }

  /**
   * Get recorded actions
   */
  getActions() {
    return [...this.recordedActions];
  }

  /**
   * Clear recorded actions
   */
  clear() {
    this.recordedActions = [];
    this.lastAction = null;
  }

  /**
   * Export actions as JSON
   */
  export() {
    return JSON.stringify(this.recordedActions, null, 2);
  }

  /**
   * Import actions from JSON
   */
  import(jsonString) {
    try {
      const actions = JSON.parse(jsonString);
      if (!Array.isArray(actions)) {
        throw new Error('Invalid format: must be an array');
      }
      this.recordedActions = actions;
      return true;
    } catch (error) {
      console.error('Error importing actions:', error);
      return false;
    }
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  /**
   * Unregister event listener
   */
  off(event, callback) {
    this.listeners = this.listeners.filter(
      (l) => !(l.event === event && l.callback === callback),
    );
  }

  /**
   * Emit event
   */
  emit(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        listener.callback(data);
      }
    }
  }

  /**
   * Clear all recorded actions
   */
  clearActions() {
    this.recordedActions = [];
    this.lastAction = null;
  }

  /**
   * Get recording status
   */
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      actionCount: this.recordedActions.length,
      duration: this.isRecording && this.startTime ? Date.now() - this.startTime : 0,
      actions: [...this.recordedActions],
    };
  }
}
