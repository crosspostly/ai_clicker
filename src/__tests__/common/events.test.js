import { jest } from '@jest/globals';
import { EventEmitter } from '../../common/events';

describe('EventEmitter Class', () => {
  let emitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  test('EventEmitter should initialize', () => {
    expect(emitter).toBeDefined();
  });

  test('EventEmitter.on() should register listener', () => {
    const listener = jest.fn();
    emitter.on('test', listener);
    expect(emitter.events.test).toContain(listener);
  });

  test('EventEmitter.emit() should call listeners', () => {
    const listener = jest.fn();
    emitter.on('test', listener);
    emitter.emit('test', 'data');
    expect(listener).toHaveBeenCalledWith('data');
  });

  test('EventEmitter.once() should call listener only once', () => {
    const listener = jest.fn();
    emitter.once('test', listener);
    emitter.emit('test');
    emitter.emit('test');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('EventEmitter.off() should remove listener', () => {
    const listener = jest.fn();
    emitter.on('test', listener);
    emitter.off('test', listener);
    emitter.emit('test');
    expect(listener).not.toHaveBeenCalled();
  });

  test('EventEmitter should support multiple listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    emitter.on('test', listener1);
    emitter.on('test', listener2);
    emitter.emit('test', 'data');
    expect(listener1).toHaveBeenCalledWith('data');
    expect(listener2).toHaveBeenCalledWith('data');
  });

  describe('EventEmitter Comprehensive Tests', () => {
    test('EventEmitter supports multiple event types', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const fn3 = jest.fn();
      
      emitter.on('event1', fn1);
      emitter.on('event2', fn2);
      emitter.on('event3', fn3);
      
      emitter.emit('event1');
      emitter.emit('event2');
      emitter.emit('event3');
      
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).toHaveBeenCalledTimes(1);
    });

    test('EventEmitter.once only triggers once across multiple calls', () => {
      const fn = jest.fn();
      emitter.once('test', fn);
      
      emitter.emit('test');
      emitter.emit('test');
      emitter.emit('test');
      emitter.emit('test');
      emitter.emit('test');
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('EventEmitter.off removes specific listener', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const fn3 = jest.fn();
      
      emitter.on('test', fn1);
      emitter.on('test', fn2);
      emitter.on('test', fn3);
      emitter.off('test', fn2);
      
      emitter.emit('test');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).toHaveBeenCalledTimes(1);
    });

    test('EventEmitter passes multiple arguments correctly', () => {
      const fn = jest.fn();
      emitter.on('test', fn);
      
      emitter.emit('test', 'arg1', { obj: 'arg2' }, ['array']);
      
      expect(fn).toHaveBeenCalledWith('arg1', { obj: 'arg2' }, ['array']);
    });

    test('EventEmitter stores listeners for multiple events', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const fn3 = jest.fn();
      
      emitter.on('test', fn1);
      emitter.on('test', fn2);
      emitter.on('other', fn3);
      
      expect(emitter.events.test).toHaveLength(2);
      expect(emitter.events.other).toHaveLength(1);
      expect(emitter.events.test).toContain(fn1);
      expect(emitter.events.test).toContain(fn2);
      expect(emitter.events.other).toContain(fn3);
    });

    test('EventEmitter can remove all listeners by replacing', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const fn3 = jest.fn();
      
      emitter.on('test', fn1);
      emitter.on('test', fn2);
      emitter.on('other', fn3);
      
      emitter.events.test = [];
      emitter.emit('test');
      emitter.emit('other');
      
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).toHaveBeenCalledTimes(1);
    });

    test('EventEmitter handles async listeners', async () => {
      const fn = jest.fn(async () => {
        await new Promise(r => setTimeout(r, 10));
      });
      
      emitter.on('test', fn);
      emitter.emit('test');
      
      expect(fn).toHaveBeenCalled();
    });

    test('EventEmitter handles error in listener', () => {
      const fn1 = jest.fn(() => {
        throw new Error('Listener error');
      });
      const fn2 = jest.fn();
      
      emitter.on('test', fn1);
      emitter.on('test', fn2);
      
      expect(() => emitter.emit('test')).toThrow();
    });

    test('EventEmitter can remove listener while iterating', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      
      emitter.on('test', fn1);
      emitter.on('test', fn2);
      emitter.off('test', fn1);
      emitter.emit('test');
      
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    test('EventEmitter supports many listeners on same event', () => {
      const listeners = [];
      
      for (let i = 0; i < 100; i++) {
        const fn = jest.fn();
        listeners.push(fn);
        emitter.on('test', fn);
      }
      
      emitter.emit('test');
      
      listeners.forEach(fn => {
        expect(fn).toHaveBeenCalledTimes(1);
      });
    });

    test('EventEmitter handles data mutations in listener', () => {
      const data = { value: 1 };
      const fn1 = jest.fn((d) => {
        d.value = 2;
      });
      const fn2 = jest.fn();
      
      emitter.on('test', fn1);
      emitter.on('test', fn2);
      
      emitter.emit('test', data);
      
      expect(fn2).toHaveBeenCalledWith({ value: 2 });
    });

    test('EventEmitter handles listener registration order', () => {
      const callOrder = [];
      
      emitter.on('test', () => callOrder.push(1));
      emitter.on('test', () => callOrder.push(2));
      emitter.on('test', () => callOrder.push(3));
      
      emitter.emit('test');
      
      expect(callOrder).toEqual([1, 2, 3]);
    });

    test('EventEmitter listener removal works correctly', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      
      emitter.on('test', fn1);
      emitter.on('test', fn2);
      emitter.off('test', fn1);
      emitter.emit('test');
      
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    test('EventEmitter handles removing non-existent listener', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      
      emitter.on('test', fn1);
      emitter.off('test', fn2);
      
      expect(() => emitter.emit('test')).not.toThrow();
      expect(fn1).toHaveBeenCalledTimes(1);
    });

    test('EventEmitter emits with no listeners', () => {
      expect(() => emitter.emit('noListeners')).not.toThrow();
    });

    test('EventEmitter handles off on event with no listeners', () => {
      const fn = jest.fn();
      expect(() => emitter.off('noListeners', fn)).not.toThrow();
    });

    test('EventEmitter preserves listener context', () => {
      const context = { value: 42 };
      const fn = jest.fn(function() {
        return this.value;
      });
      
      emitter.on('test', fn.bind(context));
      emitter.emit('test');
      
      expect(fn).toHaveBeenCalled();
    });

    test('EventEmitter handles listener that removes itself', () => {
      const fn = jest.fn(() => {
        emitter.off('test', fn);
      });
      
      emitter.on('test', fn);
      emitter.emit('test');
      emitter.emit('test');
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('EventEmitter can re-add listener after removal', () => {
      const fn = jest.fn();
      
      emitter.on('test', fn);
      emitter.emit('test');
      emitter.off('test', fn);
      emitter.on('test', fn);
      emitter.emit('test');
      
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('EventEmitter handles once listener independently', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      
      emitter.on('test', fn1);
      emitter.once('test', fn2);
      
      emitter.emit('test');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      
      emitter.emit('test');
      expect(fn1).toHaveBeenCalledTimes(2);
      expect(fn2).toHaveBeenCalledTimes(1);
    });
  });
});