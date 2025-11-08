import { EventEmitter } from '../../common/events.js';

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
});