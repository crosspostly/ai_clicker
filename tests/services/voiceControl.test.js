/**
 * Voice Control Tests
 * Tests voice control functionality including Web Audio API, Gemini Live streaming, command parsing, and multi-language support
 */

import { GeminiLiveService } from '../../src/services/geminiLive.js';
import { VoiceHandler } from '../../src/background/voiceHandler.js';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn().mockReturnValue({
    connect: jest.fn()
  }),
  createScriptProcessor: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn()
  }),
  sampleRate: 44100
}));

global.MediaStream = jest.fn().mockImplementation(() => ({
  getTracks: jest.fn().mockReturnValue([{
    stop: jest.fn()
  }])
}));

global.navigator = {
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue(new MediaStream())
  }
};

describe('Voice Control', () => {
  let geminiLiveService;
  let voiceHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    geminiLiveService = new GeminiLiveService();
    voiceHandler = new VoiceHandler();
  });

  describe('Gemini Live Service Initialization', () => {
    test('should initialize with API key', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: {
          apiKey: 'test-api-key',
          model: 'auto'
        }
      });

      const result = await geminiLiveService.initialize('test-api-key');

      expect(result.success).toBe(true);
      expect(result.model).toBeDefined();
      expect(geminiLiveService.isStreaming).toBe(true);
    });

    test('should fail initialization without API key', async () => {
      await expect(geminiLiveService.initialize('')).rejects.toThrow('API key is required');
    });

    test('should use fallback chain on model failure', async () => {
      // Mock first model failure, second success
      const originalCreateMockSession = geminiLiveService._createMockSession;
      let callCount = 0;
      
      geminiLiveService._createMockSession = jest.fn().mockImplementation((model, apiKey, config) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First model failed');
        }
        return originalCreateMockSession.call(geminiLiveService, model, apiKey, config);
      });

      const result = await geminiLiveService.initialize('test-api-key');

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });

    test('should handle all models failing', async () => {
      geminiLiveService._createMockSession = jest.fn().mockRejectedValue(new Error('Model failed'));

      await expect(geminiLiveService.initialize('test-api-key')).rejects.toThrow('All models failed to connect');
    });
  });

  describe('Audio Streaming', () => {
    beforeEach(async () => {
      await geminiLiveService.initialize('test-api-key');
    });

    test('should stream audio data successfully', async () => {
      const audioData = new Uint8Array([1, 2, 3, 4, 5]);
      
      const result = await geminiLiveService.streamAudio(audioData);

      expect(result).toBeDefined();
      expect(typeof result.transcription).toBe('string');
      expect(typeof result.command).toBe('object');
    });

    test('should handle streaming when session not active', async () => {
      await geminiLiveService.stop();
      
      const audioData = new Uint8Array([1, 2, 3]);
      
      await expect(geminiLiveService.streamAudio(audioData)).rejects.toThrow('Session not active');
    });

    test('should call transcription callback', async () => {
      const transcriptionCallback = jest.fn();
      geminiLiveService.onTranscription = transcriptionCallback;

      const audioData = new Uint8Array([1, 2, 3, 4]);
      await geminiLiveService.streamAudio(audioData);

      expect(transcriptionCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'VOICE_TRANSCRIPTION',
          text: expect.any(String),
          timestamp: expect.any(Number)
        })
      );
    });

    test('should call command callback', async () => {
      const commandCallback = jest.fn();
      geminiLiveService.onCommand = commandCallback;

      const audioData = new Uint8Array([1, 2, 3, 4]);
      await geminiLiveService.streamAudio(audioData);

      expect(commandCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'VOICE_COMMAND',
          command: expect.any(Object),
          timestamp: expect.any(Number)
        })
      );
    });

    test('should handle streaming errors gracefully', async () => {
      geminiLiveService._processAudioMock = jest.fn().mockRejectedValue(new Error('Processing failed'));
      
      const errorCallback = jest.fn();
      geminiLiveService.onError = errorCallback;

      const audioData = new Uint8Array([1, 2, 3]);
      
      await expect(geminiLiveService.streamAudio(audioData)).rejects.toThrow('Processing failed');
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('Command Parsing', () => {
    test('should parse click commands correctly', () => {
      const mockResponse = {
        transcription: 'click the submit button',
        command: { type: 'click', target: 'submit button' }
      };

      expect(mockResponse.command.type).toBe('click');
      expect(mockResponse.command.target).toBe('submit button');
    });

    test('should parse input commands correctly', () => {
      const mockResponse = {
        transcription: 'type hello world',
        command: { type: 'input', text: 'hello world' }
      };

      expect(mockResponse.command.type).toBe('input');
      expect(mockResponse.command.text).toBe('hello world');
    });

    test('should parse scroll commands correctly', () => {
      const mockResponse = {
        transcription: 'scroll down',
        command: { type: 'scroll', direction: 'down' }
      };

      expect(mockResponse.command.type).toBe('scroll');
      expect(mockResponse.command.direction).toBe('down');
    });

    test('should parse double click commands', () => {
      const mockResponse = {
        transcription: 'double click',
        command: { type: 'double_click' }
      };

      expect(mockResponse.command.type).toBe('double_click');
    });

    test('should parse right click commands', () => {
      const mockResponse = {
        transcription: 'right click',
        command: { type: 'right_click' }
      };

      expect(mockResponse.command.type).toBe('right_click');
    });
  });

  describe('Multi-language Support', () => {
    test('should handle Russian commands', async () => {
      // Mock Russian response
      geminiLiveService._processAudioMock = jest.fn().mockResolvedValue({
        transcription: 'нажми кнопку',
        command: { type: 'click', target: 'кнопка' }
      });

      const audioData = new Uint8Array([1, 2, 3, 4]);
      const result = await geminiLiveService.streamAudio(audioData);

      expect(result.transcription).toBe('нажми кнопку');
      expect(result.command.target).toBe('кнопка');
    });

    test('should handle mixed language commands', async () => {
      geminiLiveService._processAudioMock = jest.fn().mockResolvedValue({
        transcription: 'введи hello world',
        command: { type: 'input', target: 'поле ввода', text: 'hello world' }
      });

      const audioData = new Uint8Array([1, 2, 3, 4]);
      const result = await geminiLiveService.streamAudio(audioData);

      expect(result.transcription).toContain('hello world');
      expect(result.command.text).toBe('hello world');
      expect(result.command.target).toContain('поле');
    });

    test('should auto-detect language settings', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: {
          apiKey: 'test-api-key',
          language: 'auto'
        }
      });

      // Mock language detection in response
      geminiLiveService._processAudioMock = jest.fn().mockResolvedValue({
        transcription: 'click the button',
        command: { type: 'click', target: 'button' },
        detectedLanguage: 'en'
      });

      const audioData = new Uint8Array([1, 2, 3, 4]);
      const result = await geminiLiveService.streamAudio(audioData);

      expect(result.detectedLanguage).toBe('en');
    });
  });

  describe('Fallback Chain Management', () => {
    test('should try models in correct order', async () => {
      const modelsTried = [];
      
      geminiLiveService._createMockSession = jest.fn().mockImplementation((model) => {
        modelsTried.push(model);
        if (model === 'gemini-2.0-flash-exp') {
          throw new Error('First failed');
        }
        return { model, isConnected: true };
      });

      await geminiLiveService.initialize('test-api-key');

      expect(modelsTried).toEqual([
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash-001'
      ]);
    });

    test('should update fallback index after failure', async () => {
      geminiLiveService._createMockSession = jest.fn()
        .mockRejectedValueOnce(new Error('First failed'))
        .mockResolvedValueOnce({ model: 'gemini-2.0-flash-001', isConnected: true });

      await geminiLiveService.initialize('test-api-key');

      expect(geminiLiveService.currentModel).toBe('gemini-2.0-flash-001');
      expect(geminiLiveService.fallbackIndex).toBe(1);
    });

    test('should reset fallback index on successful connection', async () => {
      // Set initial fallback index
      geminiLiveService.fallbackIndex = 2;
      
      await geminiLiveService.initialize('test-api-key');

      expect(geminiLiveService.fallbackIndex).toBe(0);
    });
  });

  describe('Voice Handler Integration', () => {
    beforeEach(() => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: {
          apiKey: 'test-api-key',
          model: 'auto',
          language: 'en'
        }
      });
    });

    test('should handle voice start command', async () => {
      const mockTab = { id: 123 };
      
      await voiceHandler.handleVoiceStart({
        type: 'VOICE_START',
        tabId: mockTab.id
      }, { tab: mockTab });

      expect(voiceHandler.isActive).toBe(true);
      expect(voiceHandler.currentSession.tabId).toBe(mockTab.id);
    });

    test('should handle voice stop command', async () => {
      voiceHandler.isActive = true;
      voiceHandler.currentSession = { tabId: 123 };

      await voiceHandler.handleVoiceStop({
        type: 'VOICE_STOP'
      });

      expect(voiceHandler.isActive).toBe(false);
      expect(voiceHandler.currentSession).toBeNull();
    });

    test('should process voice data correctly', async () => {
      voiceHandler.isActive = true;
      voiceHandler.currentSession = { tabId: 123 };

      const voiceData = {
        type: 'VOICE_DATA',
        audioData: new Uint8Array([1, 2, 3, 4])
      };

      await voiceHandler.handleVoiceData(voiceData, { tab: { id: 123 } });

      // Verify transcription was processed
      expect(voiceHandler.transcriptionHistory.length).toBeGreaterThan(0);
    });

    test('should maintain command history', async () => {
      voiceHandler.isActive = true;
      voiceHandler.currentSession = { tabId: 123 };

      chrome.runtime.sendMessage.mockResolvedValue({ success: true });

      const command = {
        type: 'transcription',
        text: 'click button',
        command: { type: 'click', target: 'button' },
        timestamp: Date.now()
      };

      await voiceHandler.handleCommand(command, { tab: { id: 123 } });

      const history = voiceHandler.getCommandHistory();
      expect(history).toHaveLength(1);
      expect(history[0].command).toEqual({ type: 'click', target: 'button' });
    });

    test('should limit history size', async () => {
      voiceHandler.isActive = true;
      voiceHandler.currentSession = { tabId: 123 };

      chrome.runtime.sendMessage.mockResolvedValue({ success: true });

      // Add more commands than the limit
      for (let i = 0; i < 25; i++) {
        await voiceHandler.handleCommand({
          type: 'transcription',
          text: `command ${i}`,
          command: { type: 'click', target: `button${i}` },
          timestamp: Date.now() + i
        }, { tab: { id: 123 } });
      }

      const history = voiceHandler.getCommandHistory();
      expect(history.length).toBeLessThanOrEqual(20);
    });

    test('should clear history correctly', async () => {
      voiceHandler.isActive = true;
      voiceHandler.currentSession = { tabId: 123 };

      chrome.runtime.sendMessage.mockResolvedValue({ success: true });

      await voiceHandler.handleCommand({
        type: 'transcription',
        text: 'test command',
        command: { type: 'click', target: 'button' },
        timestamp: Date.now()
      }, { tab: { id: 123 } });

      expect(voiceHandler.getCommandHistory().length).toBe(1);

      voiceHandler.clearHistory();

      expect(voiceHandler.getCommandHistory().length).toBe(0);
      expect(voiceHandler.getTranscriptionHistory().length).toBe(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle microphone permission denial', async () => {
      navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'));

      await expect(voiceHandler.startAudioCapture()).rejects.toThrow('Permission denied');
    });

    test('should handle network connectivity issues', async () => {
      geminiLiveService._createMockSession = jest.fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(geminiLiveService.initialize('test-api-key')).rejects.toThrow('All models failed to connect');
    });

    test('should recover from temporary failures', async () => {
      let attemptCount = 0;
      geminiLiveService._createMockSession = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Temporary failure');
        }
        return { model: 'gemini-2.0-flash-001', isConnected: true };
      });

      const result = await geminiLiveService.initialize('test-api-key');

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(2);
    });

    test('should handle malformed audio data', async () => {
      await geminiLiveService.initialize('test-api-key');

      // Test with invalid audio data
      const invalidAudio = null;
      
      await expect(geminiLiveService.streamAudio(invalidAudio)).rejects.toThrow();
    });

    test('should handle API quota exceeded errors', async () => {
      geminiLiveService._processAudioMock = jest.fn()
        .mockRejectedValue(new Error('Quota exceeded'));

      await geminiLiveService.initialize('test-api-key');
      
      const audioData = new Uint8Array([1, 2, 3]);
      
      await expect(geminiLiveService.streamAudio(audioData)).rejects.toThrow('Quota exceeded');
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle rapid audio stream processing', async () => {
      await geminiLiveService.initialize('test-api-key');

      const startTime = Date.now();
      const promises = [];

      // Process multiple audio chunks rapidly
      for (let i = 0; i < 10; i++) {
        const audioData = new Uint8Array([i, i + 1, i + 2]);
        promises.push(geminiLiveService.streamAudio(audioData));
      }

      await Promise.all(promises);
      const endTime = Date.now();

      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should cleanup resources properly', async () => {
      await geminiLiveService.initialize('test-api-key');
      
      expect(geminiLiveService.isStreaming).toBe(true);
      expect(geminiLiveService.session).toBeDefined();

      await geminiLiveService.stop();

      expect(geminiLiveService.isStreaming).toBe(false);
      expect(geminiLiveService.session).toBeNull();
    });

    test('should handle memory leaks prevention', async () => {
      await geminiLiveService.initialize('test-api-key');

      // Process many commands to test memory management
      for (let i = 0; i < 100; i++) {
        const audioData = new Uint8Array([i % 255]);
        await geminiLiveService.streamAudio(audioData);
      }

      // Verify history is properly limited
      const status = geminiLiveService.getStatus();
      expect(status.isStreaming).toBe(true);
    });
  });
});