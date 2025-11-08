/**
 * ActionRecorder - Record user actions on webpage
 */
class ActionRecorder extends EventEmitter {
  constructor(elementFinder) {
    super();
    this.elementFinder = elementFinder;
    this.isRecording = false;
    this.actions = [];
    this.lastTimestamp = 0;
    this.handlers = {
      click: null,
      input: null,
      change: null,
      dblclick: null,
      contextmenu: null,
    };
  }

  /**
   * Start recording actions
   */
  start() {
    if (this.isRecording) {
      Logger.warn('ActionRecorder', 'Already recording');
      return;
    }

    this.isRecording = true;
    this.actions = [];
    this.lastTimestamp = Date.now();

    this.attachListeners();
    this.emit('started');
    Logger.info('ActionRecorder', 'Recording started');
  }

  /**
   * Stop recording actions
   * @returns {Array} Recorded actions
   */
  stop() {
    if (!this.isRecording) {
      Logger.warn('ActionRecorder', 'Not recording');
      return this.actions;
    }

    this.isRecording = false;
    this.detachListeners();
    this.emit('stopped', this.actions);
    Logger.info('ActionRecorder', 'Recording stopped', {
      count: this.actions.length,
    });

    return this.actions;
  }

  /**
   * Add action to recording
   * @param {Object} action - Action to add
   * @throws {Error} If action is invalid
   */
  addAction(action) {
    Validator.validateAction(action);
    this.actions.push(action);
    this.emit('action-recorded', action);
  }

  /**
   * Clear recorded actions
   */
  clear() {
    this.actions = [];
    this.emit('cleared');
  }

  /**
   * Get recorded actions
   * @returns {Array}
   */
  getActions() {
    return [...this.actions];
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    this.handlers.click = this.recordClick.bind(this);
    this.handlers.input = this.recordInput.bind(this);
    this.handlers.change = this.recordChange.bind(this);
    this.handlers.dblclick = this.recordDoubleClick.bind(this);
    this.handlers.contextmenu = this.recordContextMenu.bind(this);

    document.addEventListener('click', this.handlers.click, true);
    document.addEventListener('input', this.handlers.input, true);
    document.addEventListener('change', this.handlers.change, true);
    document.addEventListener('dblclick', this.handlers.dblclick, true);
    document.addEventListener('contextmenu', this.handlers.contextmenu, true);
  }

  /**
   * Detach event listeners
   */
  detachListeners() {
    document.removeEventListener('click', this.handlers.click, true);
    document.removeEventListener('input', this.handlers.input, true);
    document.removeEventListener('change', this.handlers.change, true);
    document.removeEventListener('dblclick', this.handlers.dblclick, true);
    document.removeEventListener('contextmenu', this.handlers.contextmenu, true);

    this.handlers = {
      click: null,
      input: null,
      change: null,
      dblclick: null,
      contextmenu: null,
    };
  }

  /**
   * Record click action
   * @param {MouseEvent} event - Click event
   */
  recordClick(event) {
    if (!this.isRecording) return;

    const action = {
      type: 'click',
      selector: this.elementFinder.generateSelector(event.target),
      text: event.target.innerText?.substring(0, 100) || '',
      timestamp: Date.now(),
    };

    this.addAction(action);
  }

  /**
   * Record double click action
   * @param {MouseEvent} event - Double click event
   */
  recordDoubleClick(event) {
    if (!this.isRecording) return;

    const action = {
      type: 'double_click',
      selector: this.elementFinder.generateSelector(event.target),
      text: event.target.innerText?.substring(0, 100) || '',
      timestamp: Date.now(),
    };

    this.addAction(action);
  }

  /**
   * Record context menu (right click) action
   * @param {MouseEvent} event - Context menu event
   */
  recordContextMenu(event) {
    if (!this.isRecording) return;

    const action = {
      type: 'right_click',
      selector: this.elementFinder.generateSelector(event.target),
      text: event.target.innerText?.substring(0, 100) || '',
      timestamp: Date.now(),
    };

    this.addAction(action);
  }

  /**
   * Record input action
   * @param {Event} event - Input event
   */
  recordInput(event) {
    if (!this.isRecording) return;

    if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
      return;
    }

    const action = {
      type: 'input',
      selector: this.elementFinder.generateSelector(event.target),
      value: event.target.value,
      timestamp: Date.now(),
    };

    this.addAction(action);
  }

  /**
   * Record change action (select, checkbox, radio)
   * @param {Event} event - Change event
   */
  recordChange(event) {
    if (!this.isRecording) return;

    if (event.target.tagName === 'SELECT') {
      const action = {
        type: 'select',
        selector: this.elementFinder.generateSelector(event.target),
        value: event.target.value,
        text: event.target.options[event.target.selectedIndex]?.text || '',
        timestamp: Date.now(),
      };
      this.addAction(action);
    }
  }

  /**
   * Get recording status
   * @returns {Object}
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      actionCount: this.actions.length,
      lastTimestamp: this.lastTimestamp,
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ActionRecorder;
}
