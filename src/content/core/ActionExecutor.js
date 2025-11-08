/**
 * ActionExecutor - Execute recorded actions on webpage
 */
class ActionExecutor extends EventEmitter {
  constructor(elementFinder, settings = {}) {
    super();
    this.elementFinder = elementFinder;
    this.settings = {
      speed: 1,
      retries: 3,
      timeout: 30000,
      ...settings,
    };
    this.isRunning = false;
    this.isPaused = false;
  }

  /**
   * Execute sequence of actions
   * @param {Array} actions - Actions to execute
   * @returns {Promise<Object>} Execution result
   * @throws {Error} If already running
   */
  async execute(actions) {
    if (this.isRunning) {
      throw new Error('Executor is already running');
    }

    Validator.validateActionArray(actions);

    this.isRunning = true;
    this.isPaused = false;
    this.emit('started', actions);

    const results = {
      total: actions.length,
      completed: 0,
      failed: 0,
      errors: [],
    };

    try {
      for (let i = 0; i < actions.length; i++) {
        if (!this.isRunning) break;

        while (this.isPaused && this.isRunning) {
          await Helpers.delay(100);
        }

        const action = actions[i];
        const progress = ((i + 1) / actions.length) * 100;

        try {
          await this.executeAction(action);
          results.completed++;
          this.emit('action-completed', { action, index: i, progress });
        } catch (error) {
          results.failed++;
          results.errors.push({ index: i, action, error: error.message });
          this.emit('action-failed', { action, index: i, error });
          Logger.warn('ActionExecutor', `Action failed: ${error.message}`, action);
        }
      }

      this.emit('completed', results);
      Logger.info('ActionExecutor', 'Execution completed', results);
    } catch (error) {
      this.emit('error', error);
      Logger.error('ActionExecutor', 'Execution error', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.isPaused = false;
    }

    return results;
  }

  /**
   * Execute single action
   * @param {Object} action - Action to execute
   * @returns {Promise<void>}
   * @throws {Error} If action fails
   */
  async executeAction(action) {
    const delay = 500 / this.settings.speed;
    await Helpers.delay(delay);

    switch (action.type) {
      case 'click':
        return this.executeClick(action);
      case 'double_click':
        return this.executeDoubleClick(action);
      case 'right_click':
        return this.executeRightClick(action);
      case 'input':
        return this.executeInput(action);
      case 'select':
        return this.executeSelect(action);
      case 'scroll':
        return this.executeScroll(action);
      case 'wait':
        return Helpers.delay(action.duration || 1000);
      case 'hover':
        return this.executeHover(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute click action
   * @param {Object} action - Click action
   * @throws {Error} If element not found
   */
  async executeClick(action) {
    const element = this.elementFinder.find(action.selector);
    if (!element) {
      throw new Error(`Element not found: ${action.selector}`);
    }

    Helpers.scrollIntoView(element);
    element.click();
  }

  /**
   * Execute double click action
   * @param {Object} action - Double click action
   * @throws {Error} If element not found
   */
  async executeDoubleClick(action) {
    const element = this.elementFinder.find(action.selector);
    if (!element) {
      throw new Error(`Element not found: ${action.selector}`);
    }

    Helpers.scrollIntoView(element);
    element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  }

  /**
   * Execute right click action
   * @param {Object} action - Right click action
   * @throws {Error} If element not found
   */
  async executeRightClick(action) {
    const element = this.elementFinder.find(action.selector);
    if (!element) {
      throw new Error(`Element not found: ${action.selector}`);
    }

    Helpers.scrollIntoView(element);
    element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
  }

  /**
   * Execute input action
   * @param {Object} action - Input action
   * @throws {Error} If element not found
   */
  async executeInput(action) {
    const element =
      this.elementFinder.find(action.selector) ||
      document.querySelector('input:focus');

    if (!element) {
      throw new Error(`Input element not found: ${action.selector}`);
    }

    Helpers.scrollIntoView(element);
    element.focus();
    element.value = action.value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Execute select action
   * @param {Object} action - Select action
   * @throws {Error} If element not found or not a select
   */
  async executeSelect(action) {
    const element = this.elementFinder.find(action.selector);
    if (!element || element.tagName !== 'SELECT') {
      throw new Error(`Select element not found: ${action.selector}`);
    }

    Helpers.scrollIntoView(element);
    element.value = action.value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Execute scroll action
   * @param {Object} action - Scroll action
   */
  async executeScroll(action) {
    window.scrollBy(0, action.pixels || 300);
  }

  /**
   * Execute hover action
   * @param {Object} action - Hover action
   * @throws {Error} If element not found
   */
  async executeHover(action) {
    const element = this.elementFinder.find(action.selector);
    if (!element) {
      throw new Error(`Element not found: ${action.selector}`);
    }

    Helpers.scrollIntoView(element);
    element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  }

  /**
   * Stop execution
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.emit('stopped');
    Logger.info('ActionExecutor', 'Execution stopped by user');
  }

  /**
   * Pause execution
   */
  pause() {
    if (this.isRunning) {
      this.isPaused = true;
      this.emit('paused');
      Logger.info('ActionExecutor', 'Execution paused');
    }
  }

  /**
   * Resume execution
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.emit('resumed');
      Logger.info('ActionExecutor', 'Execution resumed');
    }
  }

  /**
   * Get execution status
   * @returns {Object}
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      speed: this.settings.speed,
      timeout: this.settings.timeout,
    };
  }

  /**
   * Set execution speed
   * @param {number} speed - Speed multiplier (0.5 - 2.0)
   */
  setSpeed(speed) {
    this.settings.speed = Math.max(0.5, Math.min(2.0, speed));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ActionExecutor;
}
