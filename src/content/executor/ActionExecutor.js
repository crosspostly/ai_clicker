/**
 * Executes recorded or AI-generated actions with comprehensive error handling
 */

export class ExecutionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExecutionError';
  }
}

export class ActionExecutor {
  constructor(elementFinder) {
    this.elementFinder = elementFinder;
    this.isRunning = false;
    this.listeners = [];
  }

  /**
   * Execute single action
   */
  async executeAction(action, speed = 1) {
    if (!action || !action.type) {
      throw new ExecutionError('Invalid action: missing type');
    }

    const delay = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms / speed));

    try {
      switch (action.type) {
        case 'click':
          await this.executeClick(action, delay);
          break;

        case 'double_click':
          await this.executeDoubleClick(action, delay);
          break;

        case 'right_click':
          await this.executeRightClick(action, delay);
          break;

        case 'input':
          await this.executeInput(action, delay);
          break;

        case 'select':
          await this.executeSelect(action, delay);
          break;

        case 'hover':
          await this.executeHover(action, delay);
          break;

        case 'scroll':
          await this.executeScroll(action, delay);
          break;

        case 'wait':
          await this.executeWait(action, delay);
          break;

        default:
          throw new ExecutionError(`Unknown action type: ${action.type}`);
      }

      this.emit('action-completed', { action, status: 'success' });
    } catch (error) {
      this.emit('action-failed', { action, error: error.message });
      throw error;
    }
  }

  /**
   * Execute click action
   */
  async executeClick(action, delay) {
    const element = this.elementFinder.find(action.target || action.selector);
    if (!element) {
      throw new ExecutionError(
        `Element not found: ${action.target || action.selector}`,
      );
    }

    if (!this.elementFinder.isVisible(element)) {
      this.elementFinder.elementFinder?.scrollToElement?.(element);
      await delay(500);
    }

    await delay(100);
    element.click();
    await delay(200);
  }

  /**
   * Execute double click action
   */
  async executeDoubleClick(action, delay) {
    const element = this.elementFinder.find(action.target || action.selector);
    if (!element) {
      throw new ExecutionError(
        `Element not found: ${action.target || action.selector}`,
      );
    }

    if (!this.elementFinder.isVisible(element)) {
      this.elementFinder.elementFinder?.scrollToElement?.(element);
      await delay(500);
    }

    await delay(100);
    const event = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(event);
    await delay(200);
  }

  /**
   * Execute right click action
   */
  async executeRightClick(action, delay) {
    const element = this.elementFinder.find(action.target || action.selector);
    if (!element) {
      throw new ExecutionError(
        `Element not found: ${action.target || action.selector}`,
      );
    }

    if (!this.elementFinder.isVisible(element)) {
      this.elementFinder.elementFinder?.scrollToElement?.(element);
      await delay(500);
    }

    await delay(100);
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(event);
    await delay(200);
  }

  /**
   * Execute input action
   */
  async executeInput(action, delay) {
    if (!action.value && !action.text) {
      throw new ExecutionError('Input action missing value');
    }

    const target = action.target || action.selector;
    let element = this.elementFinder.find(target);

    if (!element) {
      // Try finding by placeholder
      element = this.elementFinder.findByPlaceholder(target);
    }

    if (!element) {
      // Try finding by label
      element = this.elementFinder.findByLabelText(target);
    }

    if (!element) {
      throw new ExecutionError(`Input element not found: ${target}`);
    }

    if (!this.elementFinder.isVisible(element)) {
      this.elementFinder.elementFinder?.scrollToElement?.(element);
      await delay(500);
    }

    await delay(100);
    element.focus();
    await delay(50);

    // Clear existing value
    if (
      element.tagName.toLowerCase() === 'input' ||
      element.tagName.toLowerCase() === 'textarea'
    ) {
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Type text character by character
    const text = action.value || action.text;
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      await delay(50);
    }

    await delay(200);
  }

  /**
   * Execute select action
   */
  async executeSelect(action, delay) {
    const value = action.value;
    if (!value) {
      throw new ExecutionError('Select action missing value');
    }

    const target = action.target || action.selector;
    const selectElement = this.elementFinder.find(target);

    if (!selectElement || selectElement.tagName.toLowerCase() !== 'select') {
      throw new ExecutionError(`Select element not found: ${target}`);
    }

    if (!this.elementFinder.isVisible(selectElement)) {
      this.elementFinder.elementFinder?.scrollToElement?.(selectElement);
      await delay(500);
    }

    await delay(100);
    selectElement.value = value;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(200);
  }

  /**
   * Execute hover action
   */
  async executeHover(action, delay) {
    const element = this.elementFinder.find(action.target || action.selector);
    if (!element) {
      throw new ExecutionError(
        `Element not found: ${action.target || action.selector}`,
      );
    }

    if (!this.elementFinder.isVisible(element)) {
      this.elementFinder.elementFinder?.scrollToElement?.(element);
      await delay(500);
    }

    await delay(100);
    const event = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(event);
    await delay(300);
  }

  /**
   * Execute scroll action
   */
  async executeScroll(action, delay) {
    const pixels = action.pixels || action.value || 400;
    if (typeof pixels !== 'number' || pixels < -10000 || pixels > 10000) {
      throw new ExecutionError('Invalid scroll distance');
    }

    await delay(50);
    window.scrollBy({ top: pixels, behavior: 'smooth' });
    await delay(Math.abs(pixels) / 2); // Adjust delay based on distance
  }

  /**
   * Execute wait action
   */
  async executeWait(action, delay) {
    const duration = action.duration || action.value || 1000;
    if (typeof duration !== 'number' || duration < 0 || duration > 300000) {
      throw new ExecutionError('Invalid wait duration');
    }

    await delay(duration);
  }

  /**
   * Execute sequence of actions
   */
  async executeSequence(actions, speed = 1) {
    if (!Array.isArray(actions)) {
      throw new ExecutionError('Actions must be an array');
    }

    this.isRunning = true;
    this.emit('sequence-started', { actionCount: actions.length });

    try {
      for (let i = 0; i < actions.length; i++) {
        if (!this.isRunning) {
          break;
        }

        const action = actions[i];
        this.emit('action-started', {
          action,
          index: i,
          total: actions.length,
        });

        try {
          await this.executeAction(action, speed);
        } catch (error) {
          this.emit('sequence-error', {
            action,
            index: i,
            error: error.message,
          });

          // Continue with next action on error
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.emit('sequence-completed', { actionCount: actions.length });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Stop execution
   */
  stop() {
    this.isRunning = false;
    this.emit('sequence-stopped');
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
}
