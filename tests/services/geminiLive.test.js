/**
 * Tests for Gemini Live service
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GeminiLiveService, geminiLiveService } from '../../src/services/geminiLive.js';
import { VOICE_MESSAGE_TYPES, API_CONFIG } from '../../src/common/constants.js';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
  },
  tabs: {
    sendMessage: jest.fn(),
  },
};

describe('GeminiLiveService', () => {
  let service;

  beforeEach(() => {
    service = new GeminiLiveService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (service) {
      service.stop();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(service.session).toBeNull();
      expect(service.isStreaming).toBe(false);
      expect(service.currentModel).toBeNull();
      expect(service.fallbackIndex).toBe(0);
    });

    it('should initialize successfully with valid API key', async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';
      const settings = { model: 'auto', timeout: 120000, language: 'auto' };

      const result = await service.initialize(apiKey, settings);

      expect(result.success).toBe(true);
      expect(result.model).toBe(API_CONFIG.GEMINI_LIVE_MODELS[0]);
      expect(service.isStreaming).toBe(true);
      expect(service.currentModel).toBe(API_CONFIG.GEMINI_LIVE_MODELS[0]);
    });

    it('should fail initialization without API key', async () => {
      await expect(service.initialize('')).rejects.toThrow('API key is required');
    });

    it('should use specific model when provided', async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';
      const settings = { model: 'gemini-1.5-flash', timeout: 120000, language: 'auto' };

      const result = await service.initialize(apiKey, settings);

      expect(result.success).toBe(true);
      expect(result.model).toBe('gemini-1.5-flash');
      expect(service.currentModel).toBe('gemini-1.5-flash');
    });
  });

  describe('Fallback Chain', () => {
    it('should try next model when first fails', async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';
      
      // Mock first model to fail, second to succeed
      let callCount = 0;
      service._createMockSession = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First model failed');
        }
        return { isConnected: true };
      });

      const result = await service.initialize(apiKey);

      expect(result.success).toBe(true);
      expect(result.model).toBe(API_CONFIG.GEMINI_LIVE_MODELS[1]);
      expect(callCount).toBe(2);
    });

    it('should fail when all models fail', async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';
      
      service._createMockSession = jest.fn().mockRejectedValue(new Error('Model failed'));

      await expect(service.initialize(apiKey)).rejects.toThrow('All models failed to connect');
    });

    it('should respect fallback index', async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';
      const settings = { model: 'gemini-1.5-flash' };

      service._createMockSession = jest.fn().mockResolvedValue({ isConnected: true });

      const result = await service.initialize(apiKey, settings);

      expect(result.success).toBe(true);
      expect(result.model).toBe('gemini-1.5-flash');
      expect(service.fallbackIndex).toBe(2); // Index of gemini-1.5-flash
    });
  });

  describe('Audio Streaming', () => {
    beforeEach(async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';
      await service.initialize(apiKey);
      service.onTranscription = jest.fn();
      service.onCommand = jest.fn();
    });

    it('should stream audio data successfully', async () => {
      const audioData = new Uint8Array([1, 2, 3, 4, 5]);

      const result = await service.streamAudio(audioData);

      expect(result).toBeDefined();
      expect(service.onTranscription).toHaveBeenCalled();
    });

    it('should fail streaming without active session', async () => {
      await service.stop();
      const audioData = new Uint8Array([1, 2, 3]);

      await expect(service.streamAudio(audioData)).rejects.toThrow('Session not active');
    });

    it('should handle transcription callback', async () => {
      const audioData = new Uint8Array([10, 20, 30]);
      const mockCallback = jest.fn();
      service.onTranscription = mockCallback;

      await service.streamAudio(audioData);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VOICE_MESSAGE_TYPES.VOICE_TRANSCRIPTION,
          text: expect.any(String),
          timestamp: expect.any(Number),
          model: expect.any(String),
        })
      );
    });

    it('should handle command callback', async () => {
      const audioData = new Uint8Array([1, 1, 1]); // Should trigger first mock response
      const mockCallback = jest.fn();
      service.onCommand = mockCallback;

      await service.streamAudio(audioData);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VOICE_MESSAGE_TYPES.VOICE_COMMAND,
          command: expect.any(Object),
          timestamp: expect.any(Number),
          model: expect.any(String),
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';
      await service.initialize(apiKey);
      service.onError = jest.fn();
    });

    it('should handle streaming errors', async () => {
      service._processAudioMock = jest.fn().mockRejectedValue(new Error('Stream failed'));

      const audioData = new Uint8Array([1, 2, 3]);

      await expect(service.streamAudio(audioData)).rejects.toThrow('Stream failed');
      expect(service.onError).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', async () => {
      const mockCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      service.onTranscription = mockCallback;

      const audioData = new Uint8Array([1, 2, 3]);

      // Should not throw, callback errors should be caught internally
      const result = await service.streamAudio(audioData);
      expect(result).toBeDefined();
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Command Parsing', () => {
    it('should parse click commands correctly', () => {
      const transcription = 'click the button';
      const command = service.parseCommand(transcription);

      expect(command).toEqual({
        type: 'click',
        target: 'button',
      });
    });

    it('should parse Russian click commands', () => {
      const transcription = 'нажми на кнопку';
      const command = service.parseCommand(transcription);

      expect(command).toEqual({
        type: 'click',
        target: 'кнопку',
      });
    });

    it('should parse scroll commands', () => {
      const transcription = 'scroll down';
      const command = service.parseCommand(transcription);

      expect(command).toEqual({
        type: 'scroll',
        direction: 'down',
      });
    });

    it('should parse Russian scroll commands', () => {
      const transcription = 'прокрути вниз';
      const command = service.parseCommand(transcription);

      expect(command).toEqual({
        type: 'scroll',
        direction: 'down',
      });
    });

    it('should parse input commands', () => {
      const transcription = 'type hello world';
      const command = service.parseCommand(transcription);

      expect(command).toEqual({
        type: 'input',
        text: 'hello world',
      });
    });

    it('should parse Russian input commands', () => {
      const transcription = 'введи текст привет';
      const command = service.parseCommand(transcription);

      expect(command).toEqual({
        type: 'input',
        text: 'текст привет',
      });
    });

    it('should parse double click commands', () => {
      const transcription = 'double click';
      const command = service.parseCommand(transcription);

      expect(command).toEqual({
        type: 'double_click',
      });
    });

    it('should parse right click commands', () => {
      const transcription = 'right click';
      const command = service.parseCommand(transcription);

      expect(command).toEqual({
        type: 'right_click',
      });
    });

    it('should return null for unrecognized commands', () => {
      const transcription = 'some random text';
      const command = service.parseCommand(transcription);

      expect(command).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should stop session correctly', async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';
      await service.initialize(apiKey);

      expect(service.isStreaming).toBe(true);
      expect(service.session).toBeTruthy();

      await service.stop();

      expect(service.isStreaming).toBe(false);
      expect(service.session).toBeNull();
      expect(service.currentModel).toBeNull();
      expect(service.fallbackIndex).toBe(0);
    });

    it('should get correct status', async () => {
      // Before initialization
      let status = service.getStatus();
      expect(status.isStreaming).toBe(false);
      expect(status.currentModel).toBeNull();
      expect(status.hasSession).toBe(false);

      // After initialization
      const apiKey = 'AIza123456789012345678901234567890123456';
      await service.initialize(apiKey);

      status = service.getStatus();
      expect(status.isStreaming).toBe(true);
      expect(status.currentModel).toBeTruthy();
      expect(status.hasSession).toBe(true);
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';

      const result = await service.testConnection(apiKey);

      expect(result.success).toBe(true);
      expect(result.model).toBe(API_CONFIG.GEMINI_LIVE_MODELS[0]);
    });

    it('should test connection with specific model', async () => {
      const apiKey = 'AIza123456789012345678901234567890123456';
      const model = 'gemini-1.5-pro';

      const result = await service.testConnection(apiKey, model);

      expect(result.success).toBe(true);
      expect(result.model).toBe(model);
    });

    it('should handle connection test failure', async () => {
      service._createMockSession = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await service.testConnection('invalid-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('Available Models', () => {
    it('should return list of available models', () => {
      const models = service.getAvailableModels();

      expect(models).toEqual(API_CONFIG.GEMINI_LIVE_MODELS);
      expect(models).toContain('gemini-2.0-flash-exp');
      expect(models).toContain('gemini-1.5-pro');
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(geminiLiveService).toBeInstanceOf(GeminiLiveService);
    });

    it('should maintain state across imports', () => {
      const instance1 = geminiLiveService;
      const { geminiLiveService: instance2 } = require('../../src/services/geminiLive.js');

      expect(instance1).toBe(instance2);
    });
  });
});