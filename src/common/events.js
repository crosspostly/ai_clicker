/**
 * EventEmitter - Event system for internal communication
 */
class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to event
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   * @returns {Function} Unsubscribe function
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);

    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe from event
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   */
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  /**
   * Subscribe to event once
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   * @returns {Function} Unsubscribe function
   */
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {...*} args - Event arguments
   */
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        Logger.error('EventEmitter', `Error in listener for ${event}`, error);
      }
    });
  }

  /**
   * Get number of listeners for event
   * @param {string} event - Event name
   * @returns {number}
   */
  listenerCount(event) {
    return this.events[event]?.length || 0;
  }

  /**
   * Clear all listeners for event
   * @param {string} event - Event name or undefined for all events
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Get all event names
   * @returns {Array<string>}
   */
  eventNames() {
    return Object.keys(this.events);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventEmitter;
}
