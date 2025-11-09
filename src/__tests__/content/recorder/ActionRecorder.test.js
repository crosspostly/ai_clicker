/**
 * Tests for ActionRecorder utility
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Set up globals before importing modules
global.document = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  activeElement: null,
  body: { scrollTop: 0, scrollLeft: 0 },
  contains: jest.fn().mockReturnValue(true),
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  pageYOffset: 0,
  pageXOffset: 0,
  scrollX: 0,
  scrollY: 0,
  innerHeight: 800,
  innerWidth: 1200,
  getComputedStyle: jest.fn().mockReturnValue({
    display: 'block',
    visibility: 'visible',
  }),
};

import { ActionRecorder } from '../../../content/recorder/ActionRecorder';
import { ElementFinder } from '../../../content/finder/ElementFinder';

describe('ActionRecorder', () => {
  let recorder;
  let mockElementFinder;
  let mockDocument;
  let mockWindow;

  // Mock element factory function
  const createMockElement = (overrides = {}) => {
    return {
      tagName: 'DIV',
      textContent: '',
      value: '',
      checked: false,
      id: '',
      className: '',
      name: '',
      type: '',
      placeholder: '',
      closest: jest.fn(),
      getAttribute: jest.fn(),
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0, top: 0, width: 100, height: 30,
      }),
      parentElement: null,
      previousElementSibling: null,
      ...overrides,
    };
  };

  beforeEach(() => {
    // Use the global mocks that were set up before module import
    mockElementFinder = new ElementFinder();
    mockElementFinder.generateSelector = jest.fn((element) => {
      if (element.id) return `#${element.id}`;
      if (element.className) return `.${element.className.split(' ')[0]}`;
      return element.tagName.toLowerCase();
    });
    
    recorder = new ActionRecorder(mockElementFinder);
    
    // Mock event emitter methods
    recorder.on = jest.fn();
    recorder.off = jest.fn();
    recorder.emit = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor()', () => {
    it('should initialize with default values', () => {
      expect(recorder.elementFinder).toBe(mockElementFinder);
      expect(recorder.isRecording).toBe(false);
      expect(recorder.recordedActions).toEqual([]);
      expect(recorder.lastAction).toBeNull();
      expect(recorder.listeners).toEqual([]);
      expect(recorder.startTime).toBeNull();
      expect(recorder.scrollTimeout).toBeNull();
      expect(recorder.lastScrollX).toBe(0);
      expect(recorder.lastScrollY).toBe(0);
      expect(recorder.lastScrollTime).toBe(0);
    });

    it('should bind event handlers', () => {
      expect(recorder.handleClick).toBeInstanceOf(Function);
      expect(recorder.handleInput).toBeInstanceOf(Function);
      expect(recorder.handleChange).toBeInstanceOf(Function);
      expect(recorder.handleScroll).toBeInstanceOf(Function);
    });
  });

  describe('start()', () => {
    it('should start recording and set state', () => {
      recorder.start();
      
      expect(recorder.isRecording).toBe(true);
      expect(recorder.startTime).toBeDefined();
      expect(recorder.recordedActions).toEqual([]);
      expect(recorder.lastAction).toBeNull();
      
      expect(recorder.emit).toHaveBeenCalledWith('recording-started');
    });

    it('should not start if already recording', () => {
      recorder.isRecording = true;
      recorder.start();
      
      expect(recorder.emit).not.toHaveBeenCalledWith('recording-started');
    });
  });

  describe('stop()', () => {
    beforeEach(() => {
      recorder.isRecording = true;
      recorder.recordedActions = [{ type: 'click' }];
    });

    it('should stop recording and emit event', () => {
      recorder.stop();
      
      expect(recorder.isRecording).toBe(false);
      
      expect(recorder.emit).toHaveBeenCalledWith('recording-stopped', { 
        actions: [{ type: 'click' }], 
      });
    });

    it('should not stop if not recording', () => {
      recorder.isRecording = false;
      recorder.stop();
      
      expect(recorder.emit).not.toHaveBeenCalledWith('recording-stopped');
    });
  });

  describe('handleClick()', () => {
    beforeEach(() => {
      recorder.start();
    });

    it('should record click action', () => {
      const mockElement = createMockElement({
        tagName: 'BUTTON',
        textContent: 'Submit',
      });
      const mockEvent = {
        target: mockElement,
        clientX: 140,
        clientY: 215,
        button: 0,
        timeStamp: 1234567890,
      };

      recorder.handleClick(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(1);
      const action = recorder.recordedActions[0];
      expect(action.type).toBe('click');
      expect(action.target).toBe('Submit');
      expect(action.selector).toBe('button');
      expect(action.timestamp).toBeDefined();
    });

    it('should use element text for target', () => {
      const mockElement = createMockElement({
        tagName: 'BUTTON',
        textContent: 'Click Me',
      });
      const mockEvent = { target: mockElement };

      recorder.handleClick(mockEvent);
      
      expect(recorder.recordedActions[0].target).toBe('Click Me');
    });

    it('should use placeholder for input elements', () => {
      const mockElement = createMockElement({
        tagName: 'INPUT',
        type: 'text',
        placeholder: 'Enter email',
        textContent: '',
      });
      const mockEvent = { target: mockElement };

      recorder.handleClick(mockEvent);
      
      expect(recorder.recordedActions[0].target).toBe('Enter email');
    });

    it('should use id for elements without text', () => {
      const mockElement = createMockElement({
        tagName: 'DIV',
        id: 'submit-btn',
        textContent: '',
      });
      mockElementFinder.generateSelector.mockReturnValue('#submit-btn');
      const mockEvent = { target: mockElement };

      recorder.handleClick(mockEvent);
      
      expect(recorder.recordedActions[0].target).toBe('submit-btn');
    });

    it('should ignore right-clicks', () => {
      const mockEvent = {
        target: createMockElement({ tagName: 'BUTTON' }),
        button: 2, // Right click
      };

      recorder.handleClick(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(0);
    });

    it('should deduplicate rapid clicks', () => {
      const mockElement = createMockElement({
        tagName: 'BUTTON',
        textContent: 'Submit',
      });
      const mockEvent1 = { 
        target: mockElement, 
        timeStamp: 1000, 
      };
      const mockEvent2 = { 
        target: mockElement, 
        timeStamp: 1100, // Within dedup window
      };

      recorder.handleClick(mockEvent1);
      recorder.handleClick(mockEvent2);
      
      expect(recorder.recordedActions).toHaveLength(1);
    });

    it('should record clicks after dedup window', () => {
      const mockElement = createMockElement({
        tagName: 'BUTTON',
        textContent: 'Submit',
      });
      const mockEvent1 = { 
        target: mockElement, 
        timeStamp: 1000, 
      };
      const mockEvent2 = { 
        target: mockElement, 
        timeStamp: 2100, // After dedup window (1000ms + 100ms buffer)
      };

      recorder.handleClick(mockEvent1);
      recorder.handleClick(mockEvent2);
      
      expect(recorder.recordedActions).toHaveLength(2);
    });
  });

  describe('handleInput()', () => {
    beforeEach(() => {
      recorder.start();
    });

    it('should record input action', () => {
      const mockElement = createMockElement({ 
        tagName: 'INPUT',
        type: 'text',
        name: 'email',
        value: 'test@example.com',
      });
      const mockEvent = {
        target: mockElement,
        timeStamp: 1234567890,
      };

      recorder.handleInput(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(1);
      const action = recorder.recordedActions[0];
      expect(action.type).toBe('input');
      expect(action.target).toBe('input');
      expect(action.value).toBe('test@example.com');
      expect(action.selector).toBe('input');
    });

    it('should handle textarea input', () => {
      const mockElement = createMockElement({ 
        tagName: 'TEXTAREA',
        name: 'message',
        value: 'Hello world',
      });
      const mockEvent = { target: mockElement };

      recorder.handleInput(mockEvent);
      
      expect(recorder.recordedActions[0].target).toBe('textarea');
      expect(recorder.recordedActions[0].value).toBe('Hello world');
    });

    it('should ignore empty input', () => {
      const mockElement = createMockElement({ 
        tagName: 'INPUT',
        value: '',
      });
      const mockEvent = { target: mockElement };

      recorder.handleInput(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(0);
    });

    it('should deduplicate consecutive inputs', () => {
      const mockElement = createMockElement({ 
        tagName: 'INPUT',
        value: 'test',
      });
      const mockEvent1 = { target: mockElement, timeStamp: 1000 };
      const mockEvent2 = { target: mockElement, timeStamp: 1100 };

      recorder.handleInput(mockEvent1);
      recorder.handleInput(mockEvent2);
      
      expect(recorder.recordedActions).toHaveLength(1);
    });
  });

  describe('handleChange()', () => {
    beforeEach(() => {
      recorder.start();
    });

    it('should record change action for select', () => {
      const mockElement = createMockElement({ 
        tagName: 'SELECT',
        name: 'country',
        value: 'US',
      });
      mockElementFinder.generateSelector.mockReturnValue('select');
      const mockEvent = {
        target: mockElement,
        timeStamp: 1234567890,
      };

      recorder.handleChange(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(1);
      const action = recorder.recordedActions[0];
      expect(action.type).toBe('change');
      expect(action.target).toBe('select');
      expect(action.value).toBe('US');
    });

    it('should record change action for checkbox', () => {
      const mockElement = createMockElement({ 
        tagName: 'INPUT',
        type: 'checkbox',
        name: 'agree',
        checked: true,
      });
      mockElement.getAttribute.mockReturnValue('checkbox');
      mockElementFinder.generateSelector.mockReturnValue('input[type="checkbox"]');
      const mockEvent = { target: mockElement };

      recorder.handleChange(mockEvent);
      
      expect(recorder.recordedActions[0].type).toBe('change');
      expect(recorder.recordedActions[0].value).toBe(true);
    });

    it('should record change action for radio', () => {
      const mockElement = createMockElement({ 
        tagName: 'INPUT',
        type: 'radio',
        name: 'gender',
        value: 'male',
        checked: true,
      });
      mockElement.getAttribute.mockReturnValue('radio');
      mockElementFinder.generateSelector.mockReturnValue('input[type="radio"]');
      const mockEvent = { target: mockElement };

      recorder.handleChange(mockEvent);
      
      expect(recorder.recordedActions[0].type).toBe('change');
      expect(recorder.recordedActions[0].value).toBe('male');
    });

    it('should not record change for unchecked radio', () => {
      const mockElement = createMockElement({ 
        tagName: 'INPUT',
        type: 'radio',
        name: 'gender',
        value: 'male',
        checked: false,
      });
      mockElement.getAttribute.mockReturnValue('radio');
      const mockEvent = { target: mockElement };

      recorder.handleChange(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(0);
    });
  });

  describe('handleScroll()', () => {
    beforeEach(() => {
      recorder.start();
      // Set initial scroll position - need to set on both mock and global window
      recorder.lastScrollX = 0;
      recorder.lastScrollY = 0;
      recorder.lastScrollTime = 0;
    });

    it('should record scroll action', () => {
      // Simulate significant scroll - set on global window object
      global.window.scrollY = 100;
      global.window.pageYOffset = 100;
      global.window.scrollX = 50;
      global.window.pageXOffset = 50;

      recorder.handleScroll();
      
      expect(recorder.recordedActions).toHaveLength(1);
      const action = recorder.recordedActions[0];
      expect(action.type).toBe('scroll');
      expect(action.y).toBe(100);
      expect(action.x).toBe(50);
      expect(action.deltaY).toBe(100);
      expect(action.deltaX).toBe(50);
      expect(action.direction).toBe('down');
    });

    it('should deduplicate scroll events', () => {
      // First scroll - should be recorded
      global.window.scrollY = 100;
      global.window.pageYOffset = 100;
      global.window.scrollX = 50;
      global.window.pageXOffset = 50;

      recorder.handleScroll();
      expect(recorder.recordedActions).toHaveLength(1);
      
      // Small movement should be ignored
      global.window.scrollY = 105;
      global.window.pageYOffset = 105;
      
      recorder.handleScroll();
      
      expect(recorder.recordedActions).toHaveLength(1);
    });

    it('should record scroll after significant movement', () => {
      // First scroll
      global.window.scrollY = 100;
      global.window.pageYOffset = 100;
      global.window.scrollX = 50;
      global.window.pageXOffset = 50;

      recorder.handleScroll();
      expect(recorder.recordedActions).toHaveLength(1);
      
      // Wait for throttling to pass
      recorder.lastScrollTime = Date.now() - 200;
      
      // Significant movement
      global.window.scrollY = 200;
      global.window.pageYOffset = 200;
      
      recorder.handleScroll();
      
      expect(recorder.recordedActions).toHaveLength(2);
    });

    it('should detect scroll direction correctly', () => {
      // Scrolling down
      global.window.scrollY = 100;
      global.window.pageYOffset = 100;
      
      recorder.handleScroll();
      
      expect(recorder.recordedActions).toHaveLength(1);
      expect(recorder.recordedActions[0].direction).toBe('down');

      // Reset time for next scroll
      recorder.lastScrollTime = Date.now() - 200;
      
      // Scrolling up
      global.window.scrollY = 50;
      global.window.pageYOffset = 50;
      
      recorder.handleScroll();
      
      expect(recorder.recordedActions).toHaveLength(2);
      expect(recorder.recordedActions[1].direction).toBe('up');
    });

    it('should ignore small movements', () => {
      // Set both X and Y to small values (less than minDelta of 10)
      global.window.scrollY = 5;
      global.window.pageYOffset = 5;
      global.window.scrollX = 5;
      global.window.pageXOffset = 5;
      
      recorder.handleScroll();
      
      expect(recorder.recordedActions).toHaveLength(0);
    });
  });

  describe('getActions()', () => {
    it('should return copy of recorded actions', () => {
      const actions = [{ type: 'click' }, { type: 'input' }];
      recorder.recordedActions = actions;

      const result = recorder.getActions();
      
      expect(result).toEqual(actions);
      expect(result).not.toBe(actions); // Should be a copy
    });

    it('should return empty array if no actions', () => {
      recorder.recordedActions = [];

      const result = recorder.getActions();
      
      expect(result).toEqual([]);
    });
  });

  describe('clearActions()', () => {
    it('should clear recorded actions', () => {
      recorder.recordedActions = [{ type: 'click' }];
      recorder.lastAction = { type: 'click' };

      recorder.clearActions();
      
      expect(recorder.recordedActions).toEqual([]);
      expect(recorder.lastAction).toBeNull();
    });
  });

  describe('getRecordingStatus()', () => {
    it('should return recording status when not recording', () => {
      recorder.isRecording = false;

      const status = recorder.getRecordingStatus();
      
      expect(status.isRecording).toBe(false);
      expect(status.actionCount).toBe(0);
      expect(status.duration).toBe(0);
      expect(status.actions).toEqual([]);
    });

    it('should return recording status when recording', () => {
      recorder.isRecording = true;
      recorder.startTime = Date.now() - 5000; // 5 seconds ago
      recorder.recordedActions = [{ type: 'click' }];

      const status = recorder.getRecordingStatus();
      
      expect(status.isRecording).toBe(true);
      expect(status.actionCount).toBe(1);
      expect(status.duration).toBeGreaterThanOrEqual(5000);
      expect(status.actions).toEqual([{ type: 'click' }]);
    });

    it('should calculate duration correctly', () => {
      recorder.startTime = Date.now() - 5000; // 5 seconds ago
      recorder.isRecording = true;

      const status = recorder.getRecordingStatus();
      
      expect(status.duration).toBeGreaterThanOrEqual(5000);
    });

    it('should return defensive copy of actions', () => {
      recorder.recordedActions = [{ type: 'click' }];
      
      const status = recorder.getRecordingStatus();
      status.actions.push({ type: 'input' });
      
      expect(recorder.recordedActions).toHaveLength(1);
    });
  });

  describe('End-to-End Recording Workflow', () => {
    it('should record complete workflow: click, input, change, scroll', () => {
      // Start recording
      recorder.start();
      expect(recorder.isRecording).toBe(true);

      // Record a click
      const buttonElement = createMockElement({
        tagName: 'BUTTON',
        textContent: 'Submit',
      });
      mockElementFinder.generateSelector.mockReturnValue('button');
      recorder.handleClick({ target: buttonElement, button: 0 });

      // Record an input
      const inputElement = createMockElement({
        tagName: 'INPUT',
        type: 'text',
        value: 'test@example.com',
      });
      mockElementFinder.generateSelector.mockReturnValue('input');
      recorder.handleInput({ target: inputElement });

      // Record a change (checkbox)
      const checkboxElement = createMockElement({
        tagName: 'INPUT',
        type: 'checkbox',
        checked: true,
      });
      checkboxElement.getAttribute.mockReturnValue('checkbox');
      mockElementFinder.generateSelector.mockReturnValue('input[type="checkbox"]');
      recorder.handleChange({ target: checkboxElement });

      // Record a scroll - make sure it's significant enough
      global.window.scrollY = 100;
      global.window.pageYOffset = 100;
      global.window.scrollX = 50;
      global.window.pageXOffset = 50;
      recorder.handleScroll();

      // Stop recording
      recorder.stop();
      expect(recorder.isRecording).toBe(false);

      // Verify all actions were recorded
      const actions = recorder.getActions();
      expect(actions).toHaveLength(4);
      expect(actions[0].type).toBe('click');
      expect(actions[1].type).toBe('input');
      expect(actions[2].type).toBe('change');
      expect(actions[3].type).toBe('scroll');

      // Verify status
      const status = recorder.getRecordingStatus();
      expect(status.isRecording).toBe(false);
      expect(status.actionCount).toBe(4);
      expect(status.duration).toBe(0); // Not recording anymore
      expect(status.actions).toHaveLength(4);
    });
  });
});