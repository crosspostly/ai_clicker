/**
 * End-to-End Voice-Playback Integration Tests
 * Tests complete voice command → action execution → playback flows
 */

import { VoiceHandler } from '../../src/background/voiceHandler.js';
import { PlaybackHandler } from '../../src/background/playbackHandler.js';
import { VoicePlaybackIntegration } from '../../src/services/voicePlaybackIntegration.js';
import { GeminiLiveService } from '../../src/services/geminiLive.js';

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

// Mock dependencies
jest.mock('../../src/services/geminiLive.js');
jest.mock('../../src/services/storageService.js');

describe('End-to-End Voice-Playback Integration', () => {
  let voiceHandler;
  let playbackHandler;
  let voicePlaybackIntegration;
  let mockGeminiLiveService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock Gemini Live service
    mockGeminiLiveService = {
      initialize: jest.fn().mockResolvedValue({ success: true, model: 'gemini-2.0-flash-exp' }),
      streamAudio: jest.fn().mockResolvedValue({
        transcription: 'click the submit button',
        command: { type: 'click', target: 'submit button' }
      }),
      stop: jest.fn().mockResolvedValue(),
      getStatus: jest.fn().mockReturnValue({ isStreaming: true, currentModel: 'gemini-2.0-flash-exp' })
    };

    GeminiLiveService.mockImplementation(() => mockGeminiLiveService);

    // Initialize components
    playbackHandler = new PlaybackHandler();
    voicePlaybackIntegration = new VoicePlaybackIntegration(playbackHandler);
    voiceHandler = new VoiceHandler();
  });

  describe('Complete Voice Command Flow', () => {
    test('should process voice command from audio to action execution', async () => {
      // Mock settings
      chrome.storage.sync.get.mockResolvedValue({
        gemini: {
          apiKey: 'test-api-key',
          model: 'auto',
          language: 'en'
        }
      });

      // Mock tab
      const mockTab = { id: 123, url: 'https://example.com' };
      
      // Mock voice session
      voiceHandler.currentSession = {
        tabId: mockTab.id,
        isActive: true
      };

      // Mock the background message handling for voice command execution
      chrome.runtime.sendMessage.mockImplementation((message) => {
        if (message.type === 'voiceCommand') {
          return Promise.resolve({
            success: true,
            action: {
              type: 'click',
              selector: 'submit button',
              delay: 500,
              description: 'Click submit button'
            },
            jobId: 'test-job-id'
          });
        }
        return Promise.resolve({ success: true });
      });

      // Simulate voice command processing
      const voiceData = {
        type: 'transcription',
        text: 'click the submit button',
        command: { type: 'click', target: 'submit button' },
        model: 'gemini-2.0-flash-exp',
        timestamp: Date.now()
      };

      // Process the voice command
      await voiceHandler.handleCommand(voiceData, { tab: mockTab });

      // Verify the command was sent to background for execution
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voiceCommand',
          voiceCommand: expect.objectContaining({
            command: { type: 'click', target: 'submit button' },
            transcription: 'click the submit button'
          }),
          options: expect.objectContaining({
            voiceSessionId: mockTab.id,
            sequential: true
          })
        })
      );

      // Verify command was added to history
      const commandHistory = voiceHandler.getCommandHistory();
      expect(commandHistory).toHaveLength(1);
      expect(commandHistory[0].command).toEqual({ type: 'click', target: 'submit button' });
      expect(commandHistory[0].transcription).toBe('click the submit button');
    });

    test('should handle sequential voice commands', async () => {
      // Mock settings and tab
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key', model: 'auto' }
      });

      voiceHandler.currentSession = { tabId: 123, isActive: true };

      let executionCount = 0;
      chrome.runtime.sendMessage.mockImplementation((message) => {
        if (message.type === 'voiceCommand') {
          executionCount++;
          return Promise.resolve({
            success: true,
            queued: true,
            action: message.voiceCommand
          });
        }
        return Promise.resolve({ success: true });
      });

      // Process multiple voice commands
      const commands = [
        { text: 'click first button', command: { type: 'click', target: 'first button' } },
        { text: 'type hello world', command: { type: 'input', target: 'input field', text: 'hello world' } },
        { text: 'scroll down', command: { type: 'scroll', direction: 'down' } }
      ];

      for (const cmd of commands) {
        await voiceHandler.handleCommand({
          type: 'transcription',
          ...cmd,
          model: 'gemini-2.0-flash-exp',
          timestamp: Date.now()
        }, { tab: { id: 123 } });
      }

      // Verify all commands were queued
      expect(executionCount).toBe(3);
      expect(voiceHandler.getCommandHistory()).toHaveLength(3);

      // Verify queue status
      const queueStatus = voicePlaybackIntegration.getQueueStatus();
      expect(queueStatus.queueLength).toBeGreaterThan(0);
    });

    test('should handle voice command execution errors', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key' }
      });

      voiceHandler.currentSession = { tabId: 123, isActive: true };

      // Mock execution failure
      chrome.runtime.sendMessage.mockResolvedValue({
        success: false,
        error: 'Element not found: #non-existent-button'
      });

      const voiceData = {
        type: 'transcription',
        text: 'click non-existent button',
        command: { type: 'click', target: '#non-existent-button' },
        model: 'gemini-2.0-flash-exp',
        timestamp: Date.now()
      };

      // Should not throw error, but handle gracefully
      await expect(
        voiceHandler.handleCommand(voiceData, { tab: { id: 123 } })
      ).resolves.not.toThrow();

      // Verify error was handled
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Multi-language Voice Commands', () => {
    test('should process Russian voice commands', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key', language: 'ru' }
      });

      voiceHandler.currentSession = { tabId: 123, isActive: true };

      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        action: { type: 'click', selector: 'кнопка' }
      });

      const russianCommand = {
        type: 'transcription',
        text: 'нажми кнопку',
        command: { type: 'click', target: 'кнопка' },
        model: 'gemini-2.0-flash-exp',
        timestamp: Date.now()
      };

      await voiceHandler.handleCommand(russianCommand, { tab: { id: 123 } });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          voiceCommand: expect.objectContaining({
            command: { type: 'click', target: 'кнопка' },
            transcription: 'нажми кнопку'
          })
        })
      );
    });

    test('should handle mixed language commands', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key', language: 'auto' }
      });

      voiceHandler.currentSession = { tabId: 123, isActive: true };

      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        action: { type: 'input', selector: '.search-input', text: 'hello world' }
      });

      const mixedCommand = {
        type: 'transcription',
        text: 'введи hello world в поиск',
        command: { type: 'input', target: 'поиск', text: 'hello world' },
        model: 'gemini-2.0-flash-exp',
        timestamp: Date.now()
      };

      await voiceHandler.handleCommand(mixedCommand, { tab: { id: 123 } });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          voiceCommand: expect.objectContaining({
            command: { 
              type: 'input', 
              target: 'поиск', 
              text: 'hello world' 
            },
            transcription: 'введи hello world в поиск'
          })
        })
      );
    });
  });

  describe('Voice Session Management', () => {
    test('should start and stop voice sessions with job cleanup', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key' }
      });

      // Start voice session
      await voiceHandler.handleVoiceStart({
        type: 'VOICE_START',
        tabId: 123
      }, { tab: { id: 123 } });

      expect(voiceHandler.isActive).toBe(true);

      // Process a command to create jobs
      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        jobId: 'test-job-123'
      });

      await voiceHandler.handleCommand({
        type: 'transcription',
        text: 'click button',
        command: { type: 'click', target: 'button' },
        timestamp: Date.now()
      }, { tab: { id: 123 } });

      // Stop voice session
      await voiceHandler.handleVoiceStop({
        type: 'VOICE_STOP'
      });

      expect(voiceHandler.isActive).toBe(false);

      // Verify cleanup message was sent
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'stopVoiceJobs'
        })
      );
    });

    test('should handle tab closure during active voice session', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key' }
      });

      // Start session
      await voiceHandler.handleVoiceStart({
        type: 'VOICE_START',
        tabId: 123
      }, { tab: { id: 123 } });

      // Simulate tab closure
      voiceHandler.currentSession = { tabId: 123, isActive: true };

      // Mock tab removal handling (this would be called by background script)
      const status = voiceHandler.getStatus();
      expect(status.isActive).toBe(true);

      // Stop should clean up
      await voiceHandler.handleVoiceStop({ type: 'VOICE_STOP' });
      
      const finalStatus = voiceHandler.getStatus();
      expect(finalStatus.isActive).toBe(false);
    });
  });

  describe('Real-time Feedback Loop', () => {
    test('should provide feedback for successful command execution', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key' }
      });

      voiceHandler.currentSession = { tabId: 123, isActive: true };

      let popupMessages = [];
      chrome.runtime.sendMessage.mockImplementation((message) => {
        if (message.type === 'voiceCommand') {
          return Promise.resolve({
            success: true,
            action: { type: 'click', selector: 'button' },
            executionTime: 250
          });
        }
        // Capture popup messages
        if (message.type && message.type.startsWith('VOICE_')) {
          popupMessages.push(message);
        }
        return Promise.resolve({ success: true });
      });

      const voiceData = {
        type: 'transcription',
        text: 'click the button',
        command: { type: 'click', target: 'button' },
        model: 'gemini-2.0-flash-exp',
        timestamp: Date.now()
      };

      await voiceHandler.handleCommand(voiceData, { tab: { id: 123 } });

      // Verify feedback was sent to popup
      const commandMessages = popupMessages.filter(msg => msg.type.includes('VOICE_COMMAND'));
      expect(commandMessages.length).toBeGreaterThan(0);
    });

    test('should handle command execution timeouts', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key' }
      });

      voiceHandler.currentSession = { tabId: 123, isActive: true };

      // Mock timeout response
      chrome.runtime.sendMessage.mockResolvedValue({
        success: false,
        error: 'Command execution timeout'
      });

      const voiceData = {
        type: 'transcription',
        text: 'click slow button',
        command: { type: 'click', target: '.slow-button' },
        model: 'gemini-2.0-flash-exp',
        timestamp: Date.now()
      };

      await voiceHandler.handleCommand(voiceData, { tab: { id: 123 } });

      // Verify error was handled without crashing
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          voiceCommand: expect.objectContaining({
            command: { type: 'click', target: '.slow-button' }
          })
        })
      );
    });
  });

  describe('State Consistency', () => {
    test('should maintain consistent state across multiple commands', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key' }
      });

      voiceHandler.currentSession = { tabId: 123, isActive: true };

      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        queued: true
      });

      // Process multiple commands
      const commands = [
        { text: 'click button1', command: { type: 'click', target: 'button1' } },
        { text: 'click button2', command: { type: 'click', target: 'button2' } },
        { text: 'scroll down', command: { type: 'scroll', direction: 'down' } }
      ];

      for (const cmd of commands) {
        await voiceHandler.handleCommand({
          type: 'transcription',
          ...cmd,
          model: 'gemini-2.0-flash-exp',
          timestamp: Date.now()
        }, { tab: { id: 123 } });
      }

      // Verify state consistency
      const status = voiceHandler.getStatus();
      expect(status.isActive).toBe(true);
      expect(status.commandHistory).toHaveLength(3);

      const queueStatus = voicePlaybackIntegration.getQueueStatus();
      expect(queueStatus.queueLength).toBe(3);
    });

    test('should reset state properly on session restart', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        gemini: { apiKey: 'test-api-key' }
      });

      // Start first session
      await voiceHandler.handleVoiceStart({
        type: 'VOICE_START',
        tabId: 123
      }, { tab: { id: 123 } });

      // Process command
      chrome.runtime.sendMessage.mockResolvedValue({ success: true });
      
      await voiceHandler.handleCommand({
        type: 'transcription',
        text: 'click button',
        command: { type: 'click', target: 'button' },
        timestamp: Date.now()
      }, { tab: { id: 123 } });

      // Stop session
      await voiceHandler.handleVoiceStop({ type: 'VOICE_STOP' });

      // Start new session
      await voiceHandler.handleVoiceStart({
        type: 'VOICE_START',
        tabId: 456
      }, { tab: { id: 456 } });

      // Verify state is reset for new session
      expect(voiceHandler.currentSession.tabId).toBe(456);
      expect(voicePlaybackIntegration.getQueueStatus().queueLength).toBe(0);
    });
  });
});