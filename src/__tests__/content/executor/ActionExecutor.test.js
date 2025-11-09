/**
 * Tests for ActionExecutor utility
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ActionExecutor, ExecutionError } from '../../../content/executor/ActionExecutor';
import { ElementFinder } from '../../../content/finder/ElementFinder';

describe('ActionExecutor', () => {
  let executor;
  let mockElementFinder;
  let mockDocument;
  let mockWindow;

  beforeEach(() => {
    mockElementFinder = new ElementFinder();
    executor = new ActionExecutor(mockElementFinder);
    
    // Mock DOM APIs
    mockDocument = {
      createElement: jest.fn(),
      getElementById: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      activeElement: null,
      body: { scrollTop: 0, scrollLeft: 0 },
    };
    
    mockWindow = {
      scroll: jest.fn(),
      scrollTo: jest.fn(),
    };
    
    global.document = mockDocument;
    global.window = mockWindow;
    
    // Mock element finder methods
    mockElementFinder.find = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  describe('constructor()', () => {
    it('should initialize with default values', () => {
      expect(executor.elementFinder).toBe(mockElementFinder);
      expect(executor.isRunning).toBe(false);
      expect(executor.listeners).toEqual([]);
    });
  });

  describe('executeAction()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should throw ExecutionError for invalid action', async () => {
      await expect(executor.executeAction(null))
        .rejects.toThrow(ExecutionError, 'Invalid action: missing type');
      
      await expect(executor.executeAction({}))
        .rejects.toThrow(ExecutionError, 'Invalid action: missing type');
    });

    it('should execute click action', async () => {
      const mockElement = {
        click: jest.fn(),
        scrollIntoView: jest.fn(),
        getBoundingClientRect: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'click', target: 'button' };
      
      const executePromise = executor.executeAction(action);
      jest.advanceTimersByTime(100);
      await executePromise;

      expect(mockElementFinder.find).toHaveBeenCalledWith('button');
      expect(mockElement.scrollIntoView).toHaveBeenCalled();
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should execute double click action', async () => {
      const mockElement = {
        click: jest.fn(),
        scrollIntoView: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'double_click', target: 'button' };
      
      const executePromise = executor.executeAction(action);
      jest.advanceTimersByTime(200); // Double click delay
      await executePromise;

      expect(mockElement.click).toHaveBeenCalledTimes(2);
    });

    it('should execute right click action', async () => {
      const mockElement = {
        dispatchEvent: jest.fn(),
        scrollIntoView: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'right_click', target: 'element' };
      
      const executePromise = executor.executeAction(action);
      jest.advanceTimersByTime(100);
      await executePromise;

      expect(mockElement.dispatchEvent).toHaveBeenCalled();
      const event = mockElement.dispatchEvent.mock.calls[0][0];
      expect(event.type).toBe('contextmenu');
      expect(event.button).toBe(2);
    });

    it('should execute input action', async () => {
      const mockElement = {
        focus: jest.fn(),
        value: '',
        dispatchEvent: jest.fn(),
        scrollIntoView: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'input', target: 'email', value: 'test@example.com' };
      
      const executePromise = executor.executeAction(action);
      jest.advanceTimersByTime(150);
      await executePromise;

      expect(mockElement.focus).toHaveBeenCalled();
      expect(mockElement.value).toBe('test@example.com');
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });

    it('should execute select action', async () => {
      const mockElement = {
        focus: jest.fn(),
        value: 'option1',
        dispatchEvent: jest.fn(),
        scrollIntoView: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'select', target: 'country', value: 'US' };
      
      const executePromise = executor.executeAction(action);
      jest.advanceTimersByTime(150);
      await executePromise;

      expect(mockElement.focus).toHaveBeenCalled();
      expect(mockElement.value).toBe('US');
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });

    it('should execute scroll action', async () => {
      const action = { type: 'scroll', pixels: 400 };

      const executePromise = executor.executeAction(action);
      jest.advanceTimersByTime(100);
      await executePromise;

      expect(mockWindow.scrollTo).toHaveBeenCalledWith(0, 400);
    });

    it('should execute wait action', async () => {
      const action = { type: 'wait', duration: 1000 };

      const startTime = Date.now();
      const executePromise = executor.executeAction(action);
      jest.advanceTimersByTime(1000);
      await executePromise;

      expect(Date.now() - startTime).toBeGreaterThanOrEqual(1000);
    });

    it('should execute hover action', async () => {
      const mockElement = {
        dispatchEvent: jest.fn(),
        scrollIntoView: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'hover', target: 'menu' };
      
      const executePromise = executor.executeAction(action);
      jest.advanceTimersByTime(100);
      await executePromise;

      expect(mockElement.dispatchEvent).toHaveBeenCalled();
      const event = mockElement.dispatchEvent.mock.calls[0][0];
      expect(event.type).toBe('mouseover');
    });

    it('should respect speed parameter', async () => {
      const mockElement = {
        click: jest.fn(),
        scrollIntoView: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'click', target: 'button' };
      const speed = 2.0; // 2x speed
      
      const executePromise = executor.executeAction(action, speed);
      jest.advanceTimersByTime(50); // 100ms / 2 = 50ms
      await executePromise;

      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should throw error when element not found', async () => {
      mockElementFinder.find.mockReturnValue(null);
      const action = { type: 'click', target: 'nonexistent' };

      await expect(executor.executeAction(action))
        .rejects.toThrow(ExecutionError, 'Element not found: nonexistent');
    });

    it('should emit action-executed event', async () => {
      const mockElement = {
        click: jest.fn(),
        scrollIntoView: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'click', target: 'button' };
      
      const executePromise = executor.executeAction(action);
      jest.advanceTimersByTime(100);
      await executePromise;

      expect(executor.emit).toHaveBeenCalledWith('action-executed', {
        action,
        element: mockElement,
        success: true,
      });
    });

    it('should emit action-failed event on error', async () => {
      mockElementFinder.find.mockReturnValue(null);
      const action = { type: 'click', target: 'nonexistent' };

      await expect(executor.executeAction(action))
        .rejects.toThrow(ExecutionError);

      expect(executor.emit).toHaveBeenCalledWith('action-failed', {
        action,
        error: expect.any(ExecutionError),
      });
    });
  });

  describe('executeClick()', () => {
    it('should scroll element into view before clicking', async () => {
      const mockElement = {
        scrollIntoView: jest.fn(),
        click: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'click', target: 'button' };
      
      await executor.executeClick(action, () => Promise.resolve());

      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should handle elements without click method', async () => {
      const mockElement = {
        scrollIntoView: jest.fn(),
        dispatchEvent: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'click', target: 'div' };
      
      await executor.executeClick(action, () => Promise.resolve());

      expect(mockElement.dispatchEvent).toHaveBeenCalled();
      const event = mockElement.dispatchEvent.mock.calls[0][0];
      expect(event.type).toBe('click');
    });
  });

  describe('executeInput()', () => {
    it('should clear existing value before inputting', async () => {
      const mockElement = {
        focus: jest.fn(),
        value: 'existing text',
        dispatchEvent: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'input', target: 'field', value: 'new text' };
      
      await executor.executeInput(action, () => Promise.resolve());

      expect(mockElement.value).toBe('');
      expect(mockElement.value).toBe('new text');
    });

    it('should handle textarea elements', async () => {
      const mockElement = {
        nodeName: 'TEXTAREA',
        focus: jest.fn(),
        value: '',
        dispatchEvent: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const action = { type: 'input', target: 'message', value: 'Hello' };
      
      await executor.executeInput(action, () => Promise.resolve());

      expect(mockElement.value).toBe('Hello');
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('executeScroll()', () => {
    it('should scroll vertically', async () => {
      mockWindow.pageYOffset = 100;
      const action = { type: 'scroll', pixels: 200 };

      await executor.executeScroll(action, () => Promise.resolve());

      expect(mockWindow.scrollTo).toHaveBeenCalledWith(0, 300);
    });

    it('should scroll horizontally', async () => {
      mockWindow.pageXOffset = 50;
      const action = { type: 'scroll', pixels: 100, direction: 'horizontal' };

      await executor.executeScroll(action, () => Promise.resolve());

      expect(mockWindow.scrollTo).toHaveBeenCalledWith(150, mockWindow.pageYOffset);
    });

    it('should scroll from current position', async () => {
      mockWindow.pageYOffset = 500;
      mockWindow.pageXOffset = 200;
      const action = { type: 'scroll', pixels: -100 };

      await executor.executeScroll(action, () => Promise.resolve());

      expect(mockWindow.scrollTo).toHaveBeenCalledWith(200, 400);
    });
  });

  describe('executeSequence()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should execute multiple actions in sequence', async () => {
      const mockElement = {
        click: jest.fn(),
        scrollIntoView: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);

      const actions = [
        { type: 'click', target: 'button1' },
        { type: 'wait', duration: 500 },
        { type: 'click', target: 'button2' },
      ];

      const executePromise = executor.executeSequence(actions);
      
      // First action
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      expect(mockElement.click).toHaveBeenCalledTimes(1);
      
      // Wait action
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      
      // Second action
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      
      await executePromise;
      expect(mockElement.click).toHaveBeenCalledTimes(2);
    });

    it('should stop on first error', async () => {
      mockElementFinder.find.mockReturnValue(null);

      const actions = [
        { type: 'click', target: 'button1' },
        { type: 'click', target: 'button2' },
      ];

      await expect(executor.executeSequence(actions))
        .rejects.toThrow(ExecutionError);

      expect(mockElementFinder.find).toHaveBeenCalledTimes(1);
    });

    it('should emit sequence-started event', async () => {
      const actions = [{ type: 'click', target: 'button' }];
      const mockListener = jest.fn();
      executor.on('sequence-started', mockListener);

      executor.executeSequence(actions);
      
      expect(mockListener).toHaveBeenCalledWith({ 
        actionCount: 1
      });
    });

    it('should emit sequence-completed event', async () => {
      const mockElement = {
        click: jest.fn(),
        scrollIntoView: jest.fn(),
      };
      mockElementFinder.find.mockReturnValue(mockElement);
      const mockListener = jest.fn();
      executor.on('sequence-completed', mockListener);

      const actions = [{ type: 'click', target: 'button' }];

      const executePromise = executor.executeSequence(actions);
      jest.advanceTimersByTime(100);
      await executePromise;

      expect(mockListener).toHaveBeenCalledWith({ actionCount: actions.length });
    });
  });

  describe('stop()', () => {
    it('should stop execution', () => {
      executor.isRunning = true;
      const mockListener = jest.fn();
      executor.on('sequence-stopped', mockListener);

      executor.stop();

      expect(executor.isRunning).toBe(false);
      expect(mockListener).toHaveBeenCalled();
    });

    it('should not stop if not running', () => {
      executor.isRunning = false;
      const mockListener = jest.fn();
      executor.on('sequence-stopped', mockListener);

      executor.stop();

      expect(mockListener).toHaveBeenCalled();
    });
  });

  describe('isRunning', () => {
    it('should return running status', () => {
      executor.isRunning = true;
      expect(executor.isRunning).toBe(true);

      executor.isRunning = false;
      expect(executor.isRunning).toBe(false);
    });
  });

  describe('ExecutionError', () => {
    it('should create proper error instance', () => {
      const error = new ExecutionError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ExecutionError');
      expect(error.message).toBe('Test error');
    });
  });
});