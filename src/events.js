/**
 * EventEmitter - Event system for extension communication
 * Provides pub/sub pattern for custom events
 */

class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Register listener for an event
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  /**
   * Unregister listener from event
   * @param {string} event - Event name
   * @param {Function} listener - Callback function to remove
   */
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  /**
   * Register listener for one-time event
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   */
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {...*} args - Arguments to pass to listeners
   */
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventEmitter };
}
