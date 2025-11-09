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
    this.recordedActions = [];
    this.lastAction = null;

    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('input', this.handleInput, true);
    document.addEventListener('change', this.handleChange, true);
    window.addEventListener('scroll', this.handleScroll);

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
    window.removeEventListener('scroll', this.handleScroll);

    this.emit('recording-stopped', { actions: this.recordedActions });
  }

  /**
   * Handle click event
   */
  handleClick(event) {
    if (!this.isRecording) return;

    const target = event.target;
    if (this.shouldIgnoreElement(target)) return;

    const selector = this.elementFinder.generateSelector(target);
    const text = target.textContent?.trim() || target.value || '';

    const action = {
      type: 'click',
      target: text || selector,
      selector: selector,
      timestamp: Date.now(),
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
      timestamp: Date.now(),
    };

    this.addAction(action);
  }

  /**
   * Handle change event
   */
  handleChange(event) {
    if (!this.isRecording) return;

    const target = event.target;

    if (target.tagName.toLowerCase() === 'select') {
      const value = target.value;
      const selector = this.elementFinder.generateSelector(target);

      const action = {
        type: 'select',
        value: value,
        target: selector,
        selector: selector,
        timestamp: Date.now(),
      };

      this.addAction(action);
    }
  }

  /**
   * Handle scroll event
   */
  handleScroll() {
    if (!this.isRecording) return;

    // Debounce scroll events
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      const scrollY = window.scrollY || window.pageYOffset;

      // Only record if scroll changed significantly
      if (
        this.lastAction?.type === 'scroll' &&
        Math.abs(this.lastAction.pixels - scrollY) < 50
      ) {
        return;
      }

      const action = {
        type: 'scroll',
        pixels: Math.round(scrollY),
        timestamp: Date.now(),
      };

      this.addAction(action);
    }, 250);
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
      case 'select':
        return (
          action1.selector === action2.selector &&
          action1.value === action2.value
        );
      case 'scroll':
        return Math.abs(action1.pixels - action2.pixels) < 50;
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
      actions: [...this.recordedActions]
    };
  }
}
