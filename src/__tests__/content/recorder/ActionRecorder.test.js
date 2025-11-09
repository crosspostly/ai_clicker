/**
 * Tests for ActionRecorder utility
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ActionRecorder } from '../../../content/recorder/ActionRecorder.js';
import { ElementFinder } from '../../../content/finder/ElementFinder.js';

describe('ActionRecorder', () => {
  let recorder;
  let mockElementFinder;
  let mockDocument;
  let mockWindow;

  beforeEach(() => {
    mockElementFinder = new ElementFinder();
    recorder = new ActionRecorder(mockElementFinder);
    
    // Mock DOM APIs
    mockDocument = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      activeElement: null,
      body: { scrollTop: 0, scrollLeft: 0 },
    };
    
    mockWindow = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      pageYOffset: 0,
      pageXOffset: 0,
      innerHeight: 800,
      innerWidth: 1200,
    };
    
    global.document = mockDocument;
    global.window = mockWindow;
    
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
    });

    it('should bind event handlers', () => {
      expect(recorder.handleClick).toBeInstanceOf(Function);
      expect(recorder.handleInput).toBeInstanceOf(Function);
      expect(recorder.handleChange).toBeInstanceOf(Function);
      expect(recorder.handleScroll).toBeInstanceOf(Function);
    });
  });

  describe('start()', () => {
    it('should start recording and add event listeners', () => {
      recorder.start();
      
      expect(recorder.isRecording).toBe(true);
      expect(recorder.recordedActions).toEqual([]);
      expect(recorder.lastAction).toBeNull();
      
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('click', recorder.handleClick, true);
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('input', recorder.handleInput, true);
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('change', recorder.handleChange, true);
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('scroll', recorder.handleScroll);
      
      expect(recorder.emit).toHaveBeenCalledWith('recording-started');
    });

    it('should not start if already recording', () => {
      recorder.isRecording = true;
      recorder.start();
      
      expect(mockDocument.addEventListener).toHaveBeenCalledTimes(0);
      expect(recorder.emit).not.toHaveBeenCalledWith('recording-started');
    });
  });

  describe('stop()', () => {
    beforeEach(() => {
      recorder.isRecording = true;
      recorder.recordedActions = [{ type: 'click' }];
    });

    it('should stop recording and remove event listeners', () => {
      recorder.stop();
      
      expect(recorder.isRecording).toBe(false);
      
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('click', recorder.handleClick, true);
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('input', recorder.handleInput, true);
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('change', recorder.handleChange, true);
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('scroll', recorder.handleScroll);
      
      expect(recorder.emit).toHaveBeenCalledWith('recording-stopped', { 
        actions: [{ type: 'click' }], 
      });
    });

    it('should not stop if not recording', () => {
      recorder.isRecording = false;
      recorder.stop();
      
      expect(mockDocument.removeEventListener).toHaveBeenCalledTimes(0);
      expect(recorder.emit).not.toHaveBeenCalledWith('recording-stopped');
    });
  });

  describe('handleClick()', () => {
    beforeEach(() => {
      recorder.start();
    });

    it('should record click action', () => {
      const mockElement = { 
        tagName: 'BUTTON',
        textContent: 'Submit',
        getBoundingClientRect: jest.fn().mockReturnValue({
          left: 100, top: 200, width: 80, height: 30,
        }),
      };
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
      expect(action.element).toBe(mockElement);
      expect(action.coordinates).toEqual({ x: 140, y: 215 });
      expect(action.timeStamp).toBe(1234567890);
    });

    it('should use element text for target', () => {
      const mockElement = { 
        tagName: 'BUTTON',
        textContent: 'Click Me',
        getBoundingClientRect: jest.fn(),
      };
      const mockEvent = { target: mockElement };

      recorder.handleClick(mockEvent);
      
      expect(recorder.recordedActions[0].target).toBe('Click Me');
    });

    it('should use placeholder for input elements', () => {
      const mockElement = { 
        tagName: 'INPUT',
        type: 'text',
        placeholder: 'Enter email',
        getBoundingClientRect: jest.fn(),
      };
      const mockEvent = { target: mockElement };

      recorder.handleClick(mockEvent);
      
      expect(recorder.recordedActions[0].target).toBe('Enter email');
    });

    it('should use id for elements without text', () => {
      const mockElement = { 
        tagName: 'DIV',
        id: 'submit-btn',
        textContent: '',
        getBoundingClientRect: jest.fn(),
      };
      const mockEvent = { target: mockElement };

      recorder.handleClick(mockEvent);
      
      expect(recorder.recordedActions[0].target).toBe('submit-btn');
    });

    it('should ignore right-clicks', () => {
      const mockEvent = {
        target: { tagName: 'BUTTON' },
        button: 2, // Right click
      };

      recorder.handleClick(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(0);
    });

    it('should deduplicate rapid clicks', () => {
      const mockElement = { 
        tagName: 'BUTTON',
        textContent: 'Submit',
        getBoundingClientRect: jest.fn(),
      };
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
      const mockElement = { 
        tagName: 'BUTTON',
        textContent: 'Submit',
        getBoundingClientRect: jest.fn(),
      };
      const mockEvent1 = { 
        target: mockElement, 
        timeStamp: 1000, 
      };
      const mockEvent2 = { 
        target: mockElement, 
        timeStamp: 1600, // After dedup window
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
      const mockElement = { 
        tagName: 'INPUT',
        type: 'text',
        name: 'email',
        value: 'test@example.com',
      };
      const mockEvent = {
        target: mockElement,
        timeStamp: 1234567890,
      };

      recorder.handleInput(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(1);
      const action = recorder.recordedActions[0];
      expect(action.type).toBe('input');
      expect(action.target).toBe('email');
      expect(action.value).toBe('test@example.com');
      expect(action.element).toBe(mockElement);
    });

    it('should handle textarea input', () => {
      const mockElement = { 
        tagName: 'TEXTAREA',
        name: 'message',
        value: 'Hello world',
      };
      const mockEvent = { target: mockElement };

      recorder.handleInput(mockEvent);
      
      expect(recorder.recordedActions[0].target).toBe('message');
      expect(recorder.recordedActions[0].value).toBe('Hello world');
    });

    it('should ignore empty input', () => {
      const mockElement = { 
        tagName: 'INPUT',
        value: '',
      };
      const mockEvent = { target: mockElement };

      recorder.handleInput(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(0);
    });

    it('should deduplicate consecutive inputs', () => {
      const mockElement = { 
        tagName: 'INPUT',
        value: 'test',
      };
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
      const mockElement = { 
        tagName: 'SELECT',
        name: 'country',
        value: 'US',
      };
      const mockEvent = {
        target: mockElement,
        timeStamp: 1234567890,
      };

      recorder.handleChange(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(1);
      const action = recorder.recordedActions[0];
      expect(action.type).toBe('select');
      expect(action.target).toBe('country');
      expect(action.value).toBe('US');
    });

    it('should record change action for checkbox', () => {
      const mockElement = { 
        tagName: 'INPUT',
        type: 'checkbox',
        name: 'agree',
        checked: true,
      };
      const mockEvent = { target: mockElement };

      recorder.handleChange(mockEvent);
      
      expect(recorder.recordedActions[0].type).toBe('select');
      expect(recorder.recordedActions[0].value).toBe(true);
    });

    it('should record change action for radio', () => {
      const mockElement = { 
        tagName: 'INPUT',
        type: 'radio',
        name: 'gender',
        value: 'male',
        checked: true,
      };
      const mockEvent = { target: mockElement };

      recorder.handleChange(mockEvent);
      
      expect(recorder.recordedActions[0].type).toBe('select');
      expect(recorder.recordedActions[0].value).toBe('male');
    });
  });

  describe('handleScroll()', () => {
    beforeEach(() => {
      recorder.start();
      mockWindow.pageYOffset = 100;
      mockWindow.pageXOffset = 50;
      mockDocument.body.scrollTop = 100;
      mockDocument.body.scrollLeft = 50;
    });

    it('should record scroll action', () => {
      const mockEvent = {
        timeStamp: 1234567890,
      };

      recorder.handleScroll(mockEvent);
      
      expect(recorder.recordedActions).toHaveLength(1);
      const action = recorder.recordedActions[0];
      expect(action.type).toBe('scroll');
      expect(action.scrollY).toBe(100);
      expect(action.scrollX).toBe(50);
    });

    it('should deduplicate scroll events', () => {
      const mockEvent1 = { timeStamp: 1000 };
      const mockEvent2 = { timeStamp: 1100 };

      recorder.handleScroll(mockEvent1);
      recorder.handleScroll(mockEvent2);
      
      expect(recorder.recordedActions).toHaveLength(1);
    });

    it('should record scroll after dedup window', () => {
      const mockEvent1 = { timeStamp: 1000 };
      const mockEvent2 = { timeStamp: 2100 }; // After dedup window

      recorder.handleScroll(mockEvent1);
      recorder.handleScroll(mockEvent2);
      
      expect(recorder.recordedActions).toHaveLength(2);
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
    it('should return recording status', () => {
      recorder.isRecording = true;

      const status = recorder.getRecordingStatus();
      
      expect(status.isRecording).toBe(true);
      expect(status.actionCount).toBe(0);
      expect(status.duration).toBeGreaterThanOrEqual(0);
    });

    it('should calculate duration correctly', () => {
      recorder.startTime = Date.now() - 5000; // 5 seconds ago
      recorder.isRecording = true;

      const status = recorder.getRecordingStatus();
      
      expect(status.duration).toBeGreaterThanOrEqual(5000);
    });
  });
});