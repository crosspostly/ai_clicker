/**
 * Tests for popup UI interactions and message handling
 * Tests 20+ scenarios covering UI events, state management, Chrome messaging
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Popup UI Interactions', () => {
  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <button id="start-recording">Start Recording</button>
      <button id="stop-recording">Stop Recording</button>
      <button id="play-actions">Play Actions</button>
      <button id="clear-actions">Clear Actions</button>
      <div id="status-message"></div>
      <div id="actions-list"></div>
      <input id="instruction-input" />
      <button id="execute-instruction">Execute</button>
    `;

    // Mock Chrome APIs
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
        },
      },
      tabs: {
        query: jest.fn(),
      },
    };

    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('DOM Elements and Initialization', () => {
    test('should find all required DOM elements', async () => {
      const popup = await import('../../src/popup/index.js');
      
      expect(popup.elements.startRecording).toBeDefined();
      expect(popup.elements.stopRecording).toBeDefined();
      expect(popup.elements.playActions).toBeDefined();
      expect(popup.elements.clearActions).toBeDefined();
      expect(popup.elements.statusMessage).toBeDefined();
      expect(popup.elements.actionsList).toBeDefined();
    });

    test('should initialize with default state', async () => {
      const popup = await import('../../src/popup/index.js');
      
      expect(popup.state.isRecording).toBe(false);
      expect(popup.state.actions).toEqual([]);
      expect(popup.state.currentTabId).toBeNull();
    });

    test('should load saved state from storage', async () => {
      const mockState = {
        isRecording: true,
        actions: [{ type: 'click', target: 'button' }],
        currentTabId: 123
      };
      
      chrome.storage.local.get.mockResolvedValue({ 'popup-state': mockState });
      
      const popup = await import('../../src/popup/index.js');
      
      expect(popup.state).toEqual(mockState);
      expect(chrome.storage.local.get).toHaveBeenCalledWith('popup-state');
    });

    test('should handle missing storage state', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      
      const popup = await import('../../src/popup/index.js');
      
      expect(popup.state.isRecording).toBe(false);
      expect(popup.state.actions).toEqual([]);
      expect(popup.state.currentTabId).toBeNull();
    });
  });

  describe('Button Click Handlers', () => {
    test('should handle start recording click', async () => {
      const popup = await import('../../src/popup/index.js');
      
      // Simulate button click
      popup.elements.startRecording.click();
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'START_RECORDING'
      });
      expect(popup.state.isRecording).toBe(true);
      expect(popup.elements.startRecording.disabled).toBe(true);
      expect(popup.elements.stopRecording.disabled).toBe(false);
    });

    test('should handle stop recording click', async () => {
      const popup = await import('../../src/popup/index.js');
      popup.state.isRecording = true;
      
      // Simulate button click
      popup.elements.stopRecording.click();
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'STOP_RECORDING'
      });
      expect(popup.state.isRecording).toBe(false);
      expect(popup.elements.startRecording.disabled).toBe(false);
      expect(popup.elements.stopRecording.disabled).toBe(true);
    });

    test('should handle play actions click', async () => {
      const popup = await import('../../src/popup/index.js');
      popup.state.actions = [
        { type: 'click', target: 'button1' },
        { type: 'input', target: 'input1', value: 'test' }
      ];
      
      // Simulate button click
      popup.elements.playActions.click();
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'EXECUTE_ACTIONS',
        actions: popup.state.actions
      });
    });

    test('should handle clear actions click', async () => {
      const popup = await import('../../src/popup/index.js');
      popup.state.actions = [
        { type: 'click', target: 'button1' },
        { type: 'input', target: 'input1', value: 'test' }
      ];
      
      // Simulate button click
      popup.elements.clearActions.click();
      
      expect(popup.state.actions).toEqual([]);
      expect(popup.elements.actionsList.innerHTML).toBe('');
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        'popup-state': popup.state
      });
    });

    test('should disable play button when no actions', async () => {
      const popup = await import('../../src/popup/index.js');
      popup.state.actions = [];
      
      popup.updateUI();
      
      expect(popup.elements.playActions.disabled).toBe(true);
    });

    test('should enable play button when actions exist', async () => {
      const popup = await import('../../src/popup/index.js');
      popup.state.actions = [{ type: 'click', target: 'button' }];
      
      popup.updateUI();
      
      expect(popup.elements.playActions.disabled).toBe(false);
    });
  });

  describe('Message Handling', () => {
    test('should handle actions recorded message', async () => {
      const popup = await import('../../src/popup/index.js');
      
      const message = {
        type: 'ACTIONS_RECORDED',
        actions: [
          { type: 'click', target: 'button1' },
          { type: 'input', target: 'input1', value: 'test' }
        ]
      };
      
      popup.handleMessage(message);
      
      expect(popup.state.actions).toEqual(message.actions);
      expect(popup.elements.actionsList.children.length).toBe(2);
    });

    test('should handle recording started message', async () => {
      const popup = await import('../../src/popup/index.js');
      
      const message = { type: 'RECORDING_STARTED' };
      
      popup.handleMessage(message);
      
      expect(popup.state.isRecording).toBe(true);
      expect(popup.elements.statusMessage.textContent).toBe('Recording...');
      expect(popup.elements.startRecording.disabled).toBe(true);
      expect(popup.elements.stopRecording.disabled).toBe(false);
    });

    test('should handle recording stopped message', async () => {
      const popup = await import('../../src/popup/index.js');
      
      const message = { type: 'RECORDING_STOPPED' };
      
      popup.handleMessage(message);
      
      expect(popup.state.isRecording).toBe(false);
      expect(popup.elements.statusMessage.textContent).toBe('Recording stopped');
      expect(popup.elements.startRecording.disabled).toBe(false);
      expect(popup.elements.stopRecording.disabled).toBe(true);
    });

    test('should handle execution started message', async () => {
      const popup = await import('../../src/popup/index.js');
      
      const message = { type: 'EXECUTION_STARTED' };
      
      popup.handleMessage(message);
      
      expect(popup.elements.statusMessage.textContent).toBe('Executing actions...');
      expect(popup.elements.playActions.disabled).toBe(true);
    });

    test('should handle execution completed message', async () => {
      const popup = await import('../../src/popup/index.js');
      
      const message = { type: 'EXECUTION_COMPLETED' };
      
      popup.handleMessage(message);
      
      expect(popup.elements.statusMessage.textContent).toBe('Execution completed');
      expect(popup.elements.playActions.disabled).toBe(false);
    });

    test('should handle error message', async () => {
      const popup = await import('../../src/popup/index.js');
      
      const message = {
        type: 'ERROR',
        error: 'Element not found'
      };
      
      popup.handleMessage(message);
      
      expect(popup.elements.statusMessage.textContent).toBe('Error: Element not found');
      expect(popup.elements.statusMessage.className).toContain('error');
    });
  });

  describe('Instruction Input and Execution', () => {
    test('should handle instruction input', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.elements.instructionInput.value = 'Click the submit button';
      
      // Simulate form submission
      popup.handleInstructionSubmit();
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'EXECUTE_INSTRUCTION',
        instruction: 'Click the submit button'
      });
    });

    test('should validate instruction input', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.elements.instructionInput.value = '';
      
      popup.handleInstructionSubmit();
      
      expect(popup.elements.statusMessage.textContent).toBe('Please enter an instruction');
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('should clear instruction after submission', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.elements.instructionInput.value = 'Click button';
      popup.handleInstructionSubmit();
      
      expect(popup.elements.instructionInput.value).toBe('');
    });

    test('should handle enter key in instruction input', async () => {
      const popup = await import('../../src/popup/index.js');
      const submitSpy = jest.spyOn(popup, 'handleInstructionSubmit');
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      popup.elements.instructionInput.dispatchEvent(enterEvent);
      
      expect(submitSpy).toHaveBeenCalled();
    });

    test('should ignore non-enter keys', async () => {
      const popup = await import('../../src/popup/index.js');
      const submitSpy = jest.spyOn(popup, 'handleInstructionSubmit');
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      popup.elements.instructionInput.dispatchEvent(escapeEvent);
      
      expect(submitSpy).not.toHaveBeenCalled();
    });
  });

  describe('State Persistence', () => {
    test('should save state to storage', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.state.isRecording = true;
      popup.state.actions = [{ type: 'click', target: 'button' }];
      
      popup.saveState();
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        'popup-state': popup.state
      });
    });

    test('should debounce state saving', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.state.isRecording = true;
      
      // Call saveState multiple times quickly
      popup.saveState();
      popup.saveState();
      popup.saveState();
      
      // Should only call once due to debouncing
      setTimeout(() => {
        expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
      }, 200);
    });

    test('should load current tab ID', async () => {
      const popup = await import('../../src/popup/index.js');
      
      chrome.tabs.query.mockResolvedValue([{ id: 456 }]);
      
      await popup.loadCurrentTab();
      
      expect(popup.state.currentTabId).toBe(456);
      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    });

    test('should handle tab query error', async () => {
      const popup = await import('../../src/popup/index.js');
      
      chrome.tabs.query.mockRejectedValue(new Error('Tab access denied'));
      
      await popup.loadCurrentTab();
      
      expect(popup.state.currentTabId).toBeNull();
      expect(popup.elements.statusMessage.textContent).toContain('Error');
    });
  });

  describe('UI Updates and Rendering', () => {
    test('should render actions list', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.state.actions = [
        { type: 'click', target: 'button1', description: 'Click button1' },
        { type: 'input', target: 'input1', value: 'test', description: 'Type "test" in input1' }
      ];
      
      popup.renderActions();
      
      expect(popup.elements.actionsList.children.length).toBe(2);
      expect(popup.elements.actionsList.children[0].textContent).toContain('Click button1');
      expect(popup.elements.actionsList.children[1].textContent).toContain('Type "test" in input1');
    });

    test('should update status message styling', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.updateStatus('Success!', 'success');
      
      expect(popup.elements.statusMessage.textContent).toBe('Success!');
      expect(popup.elements.statusMessage.className).toContain('success');
      
      popup.updateStatus('Error!', 'error');
      
      expect(popup.elements.statusMessage.textContent).toBe('Error!');
      expect(popup.elements.statusMessage.className).toContain('error');
    });

    test('should show action count', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.state.actions = [
        { type: 'click' },
        { type: 'input' },
        { type: 'scroll' }
      ];
      
      popup.updateActionCount();
      
      expect(popup.elements.statusMessage.textContent).toContain('3 actions');
    });

    test('should handle empty actions list', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.state.actions = [];
      
      popup.renderActions();
      
      expect(popup.elements.actionsList.innerHTML).toBe('');
      expect(popup.elements.actionsList.textContent).toContain('No actions recorded');
    });

    test('should format action descriptions', async () => {
      const popup = await import('../../src/popup/index.js');
      
      const action = {
        type: 'input',
        target: 'search-box',
        value: 'hello world',
        description: 'Type "hello world" in search-box'
      };
      
      const formatted = popup.formatAction(action);
      
      expect(formatted).toContain('input');
      expect(formatted).toContain('search-box');
      expect(formatted).toContain('hello world');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle chrome runtime errors', async () => {
      const popup = await import('../../src/popup/index.js');
      
      chrome.runtime.sendMessage.mockImplementation(() => {
        throw new Error('Extension context invalidated');
      });
      
      popup.elements.startRecording.click();
      
      expect(popup.elements.statusMessage.textContent).toContain('Error');
    });

    test('should handle storage errors', async () => {
      const popup = await import('../../src/popup/index.js');
      
      chrome.storage.local.set.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      popup.saveState();
      
      expect(popup.elements.statusMessage.textContent).toContain('Storage error');
    });

    test('should handle malformed message data', async () => {
      const popup = await import('../../src/popup/index.js');
      
      const malformedMessage = {
        type: 'ACTIONS_RECORDED',
        actions: 'not an array'
      };
      
      popup.handleMessage(malformedMessage);
      
      expect(popup.state.actions).toEqual([]);
      expect(popup.elements.statusMessage.textContent).toContain('Invalid data');
    });

    test('should handle missing DOM elements', async () => {
      // Remove a required element
      document.getElementById('start-recording').remove();
      
      const popup = await import('../../src/popup/index.js');
      
      expect(popup.elements.startRecording).toBeUndefined();
      // Should not crash
      expect(() => popup.updateUI()).not.toThrow();
    });

    test('should handle rapid state changes', async () => {
      const popup = await import('../../src/popup/index.js');
      
      // Rapidly change recording state
      popup.setRecordingState(true);
      popup.setRecordingState(false);
      popup.setRecordingState(true);
      
      expect(popup.state.isRecording).toBe(true);
      expect(popup.elements.startRecording.disabled).toBe(true);
    });
  });

  describe('Integration with Background', () => {
    test('should register message listener', async () => {
      await import('../../src/popup/index.js');
      
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    test('should unregister message listener on cleanup', async () => {
      const popup = await import('../../src/popup/index.js');
      
      popup.cleanup();
      
      expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalled();
    });

    test('should handle background connection errors', async () => {
      const popup = await import('../../src/popup/index.js');
      
      chrome.runtime.sendMessage.mockImplementation(() => {
        const error = new Error('Receiving end does not exist');
        error.code = 'RECEIVING_END_DOES_NOT_EXIST';
        throw error;
      });
      
      await popup.sendMessage({ type: 'TEST' });
      
      expect(popup.elements.statusMessage.textContent).toContain('Connection error');
    });

    test('should retry failed messages', async () => {
      const popup = await import('../../src/popup/index.js');
      
      let callCount = 0;
      chrome.runtime.sendMessage.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Connection lost');
        }
        return { success: true };
      });
      
      await popup.sendMessageWithRetry({ type: 'TEST' }, 3);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(3);
    });
  });
});