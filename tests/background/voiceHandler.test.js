/**
 * Tests for Voice Handler
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { VoiceHandler } from '../../src/background/voiceHandler.js';
import { VOICE_MESSAGE_TYPES, SETTINGS_MESSAGE_TYPES } from '../../src/common/constants.js';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      sendMessage: jest.fn(),
    },
    lastError: null,
  },
  tabs: {
    sendMessage: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
    },
  },
};

global.chrome = mockChrome;

// Mock services
const mockGeminiLiveService = {
  initialize: jest.fn(),
  stop: jest.fn(),
  streamAudio: jest.fn(),
  parseCommand: jest.fn(),
  testConnection: jest.fn(),
  onTranscription: null,
  onCommand: null,
  onError: null,
};

const mockStorageService = {
  getSync: jest.fn(),
};

// Mock services
const mockGeminiLiveService = {
  initialize: jest.fn(),
  stop: jest.fn(),
  streamAudio: jest.fn(),
  parseCommand: jest.fn(),
  testConnection: jest.fn(),
  onTranscription: null,
  onCommand: null,
  onError: null,
};

const mockStorageService = {
  getSync: jest.fn(),
};

// Mock imports
jest.mock('../../src/services/geminiLive.js', () => ({
  geminiLiveService: mockGeminiLiveService,
}));

jest.mock('../../src/services/storageService.js', () => ({
  storageService: mockStorageService,
}));

describe('VoiceHandler', () => {
  let handler;
  let mockSender;
  let mockSendResponse;

  beforeEach(() => {
    handler = new VoiceHandler();
    mockSender = {
      tab: { id: 123 },
      frameId: 0,
    };
    mockSendResponse = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockStorageService.getSync.mockResolvedValue({
      gemini: {
        apiKey: 'AIza123456789012345678901234567890123456',
        model: 'auto',
        timeout: 120000,
        language: 'auto',
      },
      ui: {
        theme: 'dark',
        compactMode: false,
      },
      shortcuts: {
        toggleRecording: 'Ctrl+Shift+R',
        toggleVoice: 'Ctrl+Shift+V',
        playback: 'Ctrl+Shift+P',
      },
    });
  });

  afterEach(() => {
    handler.clearHistory();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(handler.isActive).toBe(false);
      expect(handler.currentSession).toBeNull();
      expect(handler.settings).toBeNull();
      expect(handler.transcriptionHistory).toEqual([]);
      expect(handler.commandHistory).toEqual([]);
    });

    it('should setup message listeners', () => {
      expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    it('should load settings on initialization', async () => {
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async initialization
      
      expect(mockStorageService.getSync).toHaveBeenCalledWith('settings');
    });
  });

  describe('Message Handling', () => {
    it('should handle VOICE_START message', async () => {
      const message = {
        type: VOICE_MESSAGE_TYPES.VOICE_START,
        settings: {
          apiKey: 'AIza123456789012345678901234567890123456',
          model: 'auto',
          timeout: 120000,
          language: 'auto',
        },
      };

      mockGeminiLiveService.initialize.mockResolvedValue({
        success: true,
        model: 'gemini-2.0-flash-exp',
      });

      await handler.handleMessage(message, mockSender, mockSendResponse);

      expect(mockGeminiLiveService.initialize).toHaveBeenCalledWith(
        'AIza123456789012345678901234567890123456',
        message.settings
      );
      expect(handler.isActive).toBe(true);
      expect(handler.currentSession).toMatchObject({
        tabId: 123,
        frameId: 0,
      });
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        model: 'gemini-2.0-flash-exp',
        sessionId: expect.any(Number),
      });
    });

    it('should handle VOICE_STOP message', async () => {
      // First start a session
      handler.isActive = true;
      handler.currentSession = { tabId: 123, startTime: Date.now() };

      const message = {
        type: VOICE_MESSAGE_TYPES.VOICE_STOP,
      };

      await handler.handleMessage(message, mockSender, mockSendResponse);

      expect(mockGeminiLiveService.stop).toHaveBeenCalled();
      expect(handler.isActive).toBe(false);
      expect(handler.currentSession).toBeNull();
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle VOICE_DATA message', async () => {
      // Setup active session
      handler.isActive = true;
      handler.currentSession = { tabId: 123, startTime: Date.now() };

      const message = {
        type: VOICE_MESSAGE_TYPES.VOICE_DATA,
        audioData: [1, 2, 3, 4, 5],
        format: 'webm',
      };

      mockGeminiLiveService.streamAudio.mockResolvedValue({
        transcription: 'click the button',
        command: { type: 'click', target: 'button' },
      });

      await handler.handleMessage(message, mockSender, mockSendResponse);

      expect(mockGeminiLiveService.streamAudio).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        processed: true,
        timestamp: expect.any(Number),
      });
    });

    it('should handle SETTINGS_UPDATE message', async () => {
      const message = {
        type: SETTINGS_MESSAGE_TYPES.SETTINGS_UPDATE,
        settings: {
          gemini: { model: 'gemini-1.5-flash' },
        },
      };

      await handler.handleMessage(message, mockSender, mockSendResponse);

      expect(mockStorageService.getSync).toHaveBeenCalledWith('settings');
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle unknown message types', async () => {
      const message = { type: 'UNKNOWN_MESSAGE' };

      await handler.handleMessage(message, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown message type',
      });
    });

    it('should handle errors in message processing', async () => {
      const message = {
        type: VOICE_MESSAGE_TYPES.VOICE_START,
        settings: {},
      };

      mockGeminiLiveService.initialize.mockRejectedValue(new Error('Initialization failed'));

      await handler.handleMessage(message, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Initialization failed',
      });
    });
  });

  describe('Voice Session Management', () => {
    it('should start voice session successfully', async () => {
      mockGeminiLiveService.initialize.mockResolvedValue({
        success: true,
        model: 'gemini-2.0-flash-exp',
      });

      await handler.startVoiceSession({}, mockSender, mockSendResponse);

      expect(mockGeminiLiveService.initialize).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        model: 'gemini-2.0-flash-exp',
        sessionId: expect.any(Number),
      });
    });

    it('should fail to start session without API key', async () => {
      mockStorageService.getSync.mockResolvedValue({
        gemini: { apiKey: '' },
      });

      await handler.loadSettings();

      await expect(handler.startVoiceSession({}, mockSender, mockSendResponse))
        .rejects.toThrow('API key not configured');
    });

    it('should stop voice session successfully', async () => {
      handler.currentSession = { startTime: Date.now() };
      handler.sessionId = 'test-session';

      await handler.stopVoiceSession({}, mockSender, mockSendResponse);

      expect(mockGeminiLiveService.stop).toHaveBeenCalled();
      expect(handler.currentSession).toBeNull();
      expect(handler.sessionId).toBeNull();
    });

    it('should handle voice start when already active', async () => {
      handler.isActive = true;

      await handler.handleVoiceStart({}, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Voice session already active',
      });
    });

    it('should handle voice data without active session', async () => {
      handler.isActive = false;

      await handler.handleVoiceData({
        audioData: [1, 2, 3],
      }, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'No active voice session',
      });
    });
  });

  describe('Transcription Handling', () => {
    it('should handle transcription and add to history', async () => {
      const transcriptionData = {
        text: 'click the button',
        timestamp: Date.now(),
        model: 'gemini-2.0-flash-exp',
      };

      mockGeminiLiveService.parseCommand.mockReturnValue({
        type: 'click',
        target: 'button',
      });

      await handler.handleTranscription(transcriptionData, mockSender);

      expect(handler.transcriptionHistory).toHaveLength(1);
      expect(handler.transcriptionHistory[0]).toMatchObject({
        text: 'click the button',
        model: 'gemini-2.0-flash-exp',
      });
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VOICE_MESSAGE_TYPES.VOICE_TRANSCRIPTION,
          text: 'click the button',
        })
      );
    });

    it('should limit transcription history', async () => {
      // Add 55 transcriptions (more than the limit of 50)
      for (let i = 0; i < 55; i++) {
        await handler.handleTranscription({
          text: `transcription ${i}`,
          timestamp: Date.now(),
          model: 'test-model',
        }, mockSender);
      }

      expect(handler.transcriptionHistory).toHaveLength(50);
      expect(handler.transcriptionHistory[0].text).toBe('transcription 5'); // First 5 should be removed
    });

    it('should handle transcription errors gracefully', async () => {
      const transcriptionData = {
        text: 'test transcription',
        timestamp: Date.now(),
        model: 'test-model',
      };

      // Mock runtime.sendMessage to throw an error
      mockChrome.runtime.sendMessage.mockImplementation(() => {
        throw new Error('Send message failed');
      });

      // Should not throw
      await expect(handler.handleTranscription(transcriptionData, mockSender))
        .resolves.toBeUndefined();
    });
  });

  describe('Command Handling', () => {
    it('should handle command and send to content script', async () => {
      const commandData = {
        command: { type: 'click', target: 'button' },
        transcription: 'click the button',
        timestamp: Date.now(),
        model: 'gemini-2.0-flash-exp',
      };

      handler.currentSession = { tabId: 123 };

      await handler.handleCommand(commandData, mockSender);

      expect(handler.commandHistory).toHaveLength(1);
      expect(handler.commandHistory[0]).toMatchObject({
        command: { type: 'click', target: 'button' },
        transcription: 'click the button',
      });
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          type: 'EXECUTE_ACTION',
          action: { type: 'click', target: 'button' },
          source: 'voice',
        })
      );
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VOICE_MESSAGE_TYPES.VOICE_COMMAND,
          command: { type: 'click', target: 'button' },
          executed: true,
        })
      );
    });

    it('should limit command history', async () => {
      // Add 25 commands (more than the limit of 20)
      for (let i = 0; i < 25; i++) {
        await handler.handleCommand({
          command: { type: 'click', target: `button${i}` },
          transcription: `click button ${i}`,
          timestamp: Date.now(),
          model: 'test-model',
        }, mockSender);
      }

      expect(handler.commandHistory).toHaveLength(20);
      expect(handler.commandHistory[0].transcription).toBe('click button 5'); // First 5 should be removed
    });

    it('should handle command errors', async () => {
      const commandData = {
        command: { type: 'click', target: 'button' },
        timestamp: Date.now(),
      };

      handler.currentSession = { tabId: 123 };

      mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Content script error'));

      await handler.handleCommand(commandData, mockSender);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VOICE_MESSAGE_TYPES.VOICE_ERROR,
          error: 'Command execution error: Content script error',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors and stop session on critical errors', async () => {
      const errorData = {
        error: 'Connection lost',
        timestamp: Date.now(),
      };

      handler.isActive = true;
      handler.currentSession = { startTime: Date.now() };

      await handler.handleError(errorData, mockSender);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VOICE_MESSAGE_TYPES.VOICE_ERROR,
          error: 'Connection lost',
        })
      );
      expect(handler.isActive).toBe(false);
      expect(handler.currentSession).toBeNull();
    });

    it('should handle non-critical errors without stopping session', async () => {
      const errorData = {
        error: 'Temporary error',
        timestamp: Date.now(),
      };

      handler.isActive = true;
      handler.currentSession = { startTime: Date.now() };

      await handler.handleError(errorData, mockSender);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VOICE_MESSAGE_TYPES.VOICE_ERROR,
          error: 'Temporary error',
        })
      );
      expect(handler.isActive).toBe(true); // Should remain active
    });
  });

  describe('Settings Management', () => {
    it('should load settings from storage', async () => {
      const mockSettings = {
        gemini: {
          apiKey: 'AIza123456789012345678901234567890123456',
          model: 'auto',
        },
      };

      mockStorageService.getSync.mockResolvedValue(mockSettings);

      await handler.loadSettings();

      expect(handler.settings).toEqual(mockSettings);
    });

    it('should handle settings load errors', async () => {
      mockStorageService.getSync.mockRejectedValue(new Error('Storage error'));

      await handler.loadSettings();

      expect(handler.settings).toBeNull();
    });

    it('should restart voice session on settings update', async () => {
      handler.isActive = true;
      handler.currentSession = { startTime: Date.now() };

      mockGeminiLiveService.initialize.mockResolvedValue({
        success: true,
        model: 'gemini-1.5-flash',
      });

      await handler.handleSettingsUpdate({}, mockSender, mockSendResponse);

      expect(mockGeminiLiveService.stop).toHaveBeenCalled();
      expect(mockGeminiLiveService.initialize).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Status and History', () => {
    it('should get current status', () => {
      handler.isActive = true;
      handler.currentSession = { tabId: 123, startTime: Date.now() };
      handler.transcriptionHistory = [{ text: 'test' }];
      handler.commandHistory = [{ command: 'click' }];
      handler.settings = { gemini: { model: 'test' } };

      const status = handler.getStatus();

      expect(status).toMatchObject({
        isActive: true,
        currentSession: { tabId: 123, startTime: expect.any(Number) },
        transcriptionHistory: [{ text: 'test' }],
        commandHistory: [{ command: 'click' }],
        settings: { gemini: { model: 'test' } },
      });
    });

    it('should get transcription history with limit', () => {
      for (let i = 0; i < 25; i++) {
        handler.transcriptionHistory.push({ text: `transcription ${i}` });
      }

      const history = handler.getTranscriptionHistory(10);

      expect(history).toHaveLength(10);
      expect(history[0].text).toBe('transcription 15'); // Last 10
    });

    it('should get command history with limit', () => {
      for (let i = 0; i < 15; i++) {
        handler.commandHistory.push({ command: `command ${i}` });
      }

      const history = handler.getCommandHistory(5);

      expect(history).toHaveLength(5);
      expect(history[0].command).toBe('command 10'); // Last 5
    });

    it('should clear history', () => {
      handler.transcriptionHistory = [{ text: 'test' }];
      handler.commandHistory = [{ command: 'click' }];

      handler.clearHistory();

      expect(handler.transcriptionHistory).toEqual([]);
      expect(handler.commandHistory).toEqual([]);
    });
  });

  describe('Voice Testing', () => {
    it('should test voice functionality successfully', async () => {
      mockGeminiLiveService.testConnection.mockResolvedValue({
        success: true,
        model: 'gemini-2.0-flash-exp',
      });

      const result = await handler.testVoice();

      expect(result).toEqual({
        success: true,
        model: 'gemini-2.0-flash-exp',
      });
    });

    it('should fail voice test without API key', async () => {
      mockStorageService.getSync.mockResolvedValue({
        gemini: { apiKey: '' },
      });

      await handler.loadSettings();

      const result = await handler.testVoice();

      expect(result).toEqual({
        success: false,
        error: 'API key not configured',
      });
    });

    it('should handle voice test errors', async () => {
      mockGeminiLiveService.testConnection.mockRejectedValue(new Error('Test failed'));

      const result = await handler.testVoice();

      expect(result).toEqual({
        success: false,
        error: 'Test failed',
      });
    });
  });

  describe('Message Sending', () => {
    it('should send message to popup', async () => {
      const message = { type: 'TEST_MESSAGE' };

      await handler.sendMessageToPopup(message);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should handle popup send errors gracefully', async () => {
      mockChrome.runtime.sendMessage.mockRejectedValue(new Error('Popup closed'));

      // Should not throw
      await expect(handler.sendMessageToPopup({ type: 'TEST' }))
        .resolves.toBeUndefined();
    });

    it('should send message to content script', async () => {
      const message = { type: 'TEST_MESSAGE' };

      await handler.sendToContentScript(123, message);

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(123, message);
    });

    it('should handle content script send errors', async () => {
      mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Content script error'));

      await expect(handler.sendToContentScript(123, { type: 'TEST' }))
        .rejects.toThrow('Content script error');
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(voiceHandler).toBeInstanceOf(VoiceHandler);
    });

    it('should maintain state across imports', () => {
      const instance1 = voiceHandler;
      const { voiceHandler: instance2 } = require('../../src/background/voiceHandler.js');

      expect(instance1).toBe(instance2);
    });
  });
});