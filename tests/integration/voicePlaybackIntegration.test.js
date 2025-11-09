/**
 * Voice-Playback Integration Tests
 * Tests the integration between voice commands and playback engine
 */

import { VoicePlaybackIntegration } from '../../src/services/voicePlaybackIntegration.js';
import { PlaybackHandler } from '../../src/background/playbackHandler.js';

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

// Mock playback handler
jest.mock('../../src/background/playbackHandler.js');

describe('Voice-Playback Integration', () => {
  let voicePlaybackIntegration;
  let mockPlaybackHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPlaybackHandler = {
      start: jest.fn().mockResolvedValue('test-job-id'),
      stop: jest.fn().mockResolvedValue({ success: true }),
      getStatus: jest.fn().mockResolvedValue({
        status: 'complete',
        completed: 1,
        failed: 0
      })
    };

    // Mock the PlaybackHandler constructor
    PlaybackHandler.mockImplementation(() => mockPlaybackHandler);

    voicePlaybackIntegration = new VoicePlaybackIntegration(mockPlaybackHandler);
  });

  describe('Voice Command to Action Conversion', () => {
    test('should convert click command to action', () => {
      const voiceCommand = {
        command: { type: 'click', target: 'button' }
      };

      const action = voicePlaybackIntegration.voiceCommandToAction(voiceCommand);

      expect(action).toEqual({
        type: 'click',
        selector: 'button',
        delay: 500,
        description: 'Click button'
      });
    });

    test('should convert double click command to action', () => {
      const voiceCommand = {
        command: { type: 'double_click', target: '#submit' }
      };

      const action = voicePlaybackIntegration.voiceCommandToAction(voiceCommand);

      expect(action).toEqual({
        type: 'double_click',
        selector: '#submit',
        delay: 500,
        description: 'Double click #submit'
      });
    });

    test('should convert input command to action', () => {
      const voiceCommand = {
        command: { type: 'input', target: '.input-field', text: 'hello world' }
      };

      const action = voicePlaybackIntegration.voiceCommandToAction(voiceCommand);

      expect(action).toEqual({
        type: 'input',
        selector: '.input-field',
        text: 'hello world',
        delay: 300,
        description: 'Type "hello world" into .input-field'
      });
    });

    test('should convert scroll command to action', () => {
      const voiceCommand = {
        command: { type: 'scroll', direction: 'down', amount: 500 }
      };

      const action = voicePlaybackIntegration.voiceCommandToAction(voiceCommand);

      expect(action).toEqual({
        type: 'scroll',
        direction: 'down',
        amount: 500,
        delay: 300,
        description: 'Scroll down'
      });
    });

    test('should convert wait command to action', () => {
      const voiceCommand = {
        command: { type: 'wait', duration: 2000 }
      };

      const action = voicePlaybackIntegration.voiceCommandToAction(voiceCommand);

      expect(action).toEqual({
        type: 'wait',
        duration: 2000,
        description: 'Wait 2000ms'
      });
    });

    test('should throw error for unknown command type', () => {
      const voiceCommand = {
        command: { type: 'unknown_command' }
      };

      expect(() => {
        voicePlaybackIntegration.voiceCommandToAction(voiceCommand);
      }).toThrow('Unknown command type: unknown_command');
    });

    test('should handle commands without targets', () => {
      const voiceCommand = {
        command: { type: 'click' }
      };

      const action = voicePlaybackIntegration.voiceCommandToAction(voiceCommand);

      expect(action.selector).toBe('body');
      expect(action.description).toBe('Click element');
    });
  });

  describe('Voice Command Execution', () => {
    test('should execute single voice command immediately', async () => {
      const voiceCommand = {
        command: { type: 'click', target: 'button' }
      };

      const result = await voicePlaybackIntegration.executeVoiceCommand(voiceCommand, {
        sequential: false
      });

      expect(mockPlaybackHandler.start).toHaveBeenCalledWith([{
        type: 'click',
        selector: 'button',
        delay: 500,
        description: 'Click button'
      }], expect.any(Object));

      expect(result.success).toBe(true);
      expect(result.action).toBeDefined();
    });

    test('should queue commands when sequential execution is enabled', async () => {
      const voiceCommand1 = {
        command: { type: 'click', target: 'button1' }
      };
      const voiceCommand2 = {
        command: { type: 'click', target: 'button2' }
      };

      const result1 = await voicePlaybackIntegration.executeVoiceCommand(voiceCommand1);
      const result2 = await voicePlaybackIntegration.executeVoiceCommand(voiceCommand2);

      expect(result1.queued).toBe(true);
      expect(result2.queued).toBe(true);
      expect(voicePlaybackIntegration.getQueueStatus().queueLength).toBe(2);
    });

    test('should process command queue sequentially', async () => {
      // Mock multiple status updates
      mockPlaybackHandler.getStatus
        .mockResolvedValueOnce({ status: 'running' })
        .mockResolvedValueOnce({ status: 'running' })
        .mockResolvedValueOnce({ status: 'complete' });

      const voiceCommand = {
        command: { type: 'click', target: 'button' }
      };

      await voicePlaybackIntegration.executeVoiceCommand(voiceCommand, {
        sequential: true
      });

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockPlaybackHandler.start).toHaveBeenCalled();
      expect(mockPlaybackHandler.getStatus).toHaveBeenCalled();
    });

    test('should handle execution errors gracefully', async () => {
      mockPlaybackHandler.start.mockRejectedValue(new Error('Playback failed'));

      const voiceCommand = {
        command: { type: 'click', target: 'button' }
      };

      const result = await voicePlaybackIntegration.executeVoiceCommand(voiceCommand, {
        sequential: false
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Playback failed');
    });

    test('should stop on error when configured', async () => {
      // Mock first command success, second command failure
      mockPlaybackHandler.start
        .mockResolvedValueOnce('job1')
        .mockRejectedValueOnce(new Error('Second command failed'));

      mockPlaybackHandler.getStatus
        .mockResolvedValueOnce({ status: 'complete' });

      const voiceCommand1 = {
        command: { type: 'click', target: 'button1' }
      };
      const voiceCommand2 = {
        command: { type: 'click', target: 'button2' }
      };

      await voicePlaybackIntegration.executeVoiceCommand(voiceCommand1);
      await voicePlaybackIntegration.executeVoiceCommand(voiceCommand2);

      // Process queue
      await new Promise(resolve => setTimeout(resolve, 50));

      const queueStatus = voicePlaybackIntegration.getQueueStatus();
      expect(queueStatus.queueLength).toBe(0); // Should be empty after processing
    });
  });

  describe('Voice Job Management', () => {
    test('should track active voice jobs', async () => {
      const voiceCommand = {
        command: { type: 'click', target: 'button' }
      };

      await voicePlaybackIntegration.executeVoiceCommand(voiceCommand, {
        voiceSessionId: 'session123',
        sequential: false
      });

      const status = voicePlaybackIntegration.getVoiceJobStatus('session123');
      expect(status).toBeDefined();
    });

    test('should stop specific voice jobs', async () => {
      // Add a job to the tracking
      voicePlaybackIntegration.activeVoiceJobs.set('session1', 'job1');
      voicePlaybackIntegration.activeVoiceJobs.set('session2', 'job2');

      const result = await voicePlaybackIntegration.stopVoiceJobs('session1');

      expect(mockPlaybackHandler.stop).toHaveBeenCalledWith('job1');
      expect(result.success).toBe(true);
      expect(voicePlaybackIntegration.activeVoiceJobs.has('session1')).toBe(false);
      expect(voicePlaybackIntegration.activeVoiceJobs.has('session2')).toBe(true);
    });

    test('should stop all voice jobs when no session specified', async () => {
      // Add multiple jobs
      voicePlaybackIntegration.activeVoiceJobs.set('session1', 'job1');
      voicePlaybackIntegration.activeVoiceJobs.set('session2', 'job2');

      const result = await voicePlaybackIntegration.stopVoiceJobs();

      expect(mockPlaybackHandler.stop).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(voicePlaybackIntegration.activeVoiceJobs.size).toBe(0);
    });

    test('should get status of all voice jobs', async () => {
      voicePlaybackIntegration.activeVoiceJobs.set('session1', 'job1');
      voicePlaybackIntegration.activeVoiceJobs.set('session2', 'job2');

      mockPlaybackHandler.getStatus
        .mockResolvedValueOnce({ status: 'running' })
        .mockResolvedValueOnce({ status: 'complete' });

      const status = voicePlaybackIntegration.getVoiceJobStatus();

      expect(status.session1.status).toBe('running');
      expect(status.session2.status).toBe('complete');
    });
  });

  describe('Selector Generation', () => {
    test('should return ID selector for ID targets', () => {
      const selector = voicePlaybackIntegration._generateSelector('#my-button');
      expect(selector).toBe('#my-button');
    });

    test('should return class selector for class targets', () => {
      const selector = voicePlaybackIntegration._generateSelector('.my-class');
      expect(selector).toBe('.my-class');
    });

    test('should generate text-based selector for text targets', () => {
      const selector = voicePlaybackIntegration._generateSelector('Submit Button');
      expect(selector).toBe('*:contains("Submit Button")');
    });

    test('should return tag name for simple targets', () => {
      const selector = voicePlaybackIntegration._generateSelector('BUTTON');
      expect(selector).toBe('button');
    });

    test('should return body selector for empty targets', () => {
      const selector = voicePlaybackIntegration._generateSelector('');
      expect(selector).toBe('body');
    });
  });

  describe('Queue Management', () => {
    test('should reset queue and processing state', () => {
      voicePlaybackIntegration.commandQueue = [{}, {}];
      voicePlaybackIntegration.isProcessing = true;

      voicePlaybackIntegration.reset();

      expect(voicePlaybackIntegration.commandQueue).toEqual([]);
      expect(voicePlaybackIntegration.isProcessing).toBe(false);
    });

    test('should return correct queue status', () => {
      voicePlaybackIntegration.commandQueue = [{}, {}];
      voicePlaybackIntegration.activeVoiceJobs.set('session1', 'job1');

      const status = voicePlaybackIntegration.getQueueStatus();

      expect(status.queueLength).toBe(2);
      expect(status.activeJobs).toBe(1);
      expect(status.isProcessing).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing command object', () => {
      const voiceCommand = {};

      expect(() => {
        voicePlaybackIntegration.voiceCommandToAction(voiceCommand);
      }).toThrow();
    });

    test('should handle timeout during command execution', async () => {
      mockPlaybackHandler.getStatus.mockResolvedValue({ status: 'running' });

      const voiceCommand = {
        command: { type: 'click', target: 'button' }
      };

      const result = await voicePlaybackIntegration.executeVoiceCommand(voiceCommand, {
        sequential: false,
        timeout: 50 // Very short timeout
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    test('should clean up job tracking on execution completion', async () => {
      mockPlaybackHandler.getStatus.mockResolvedValue({ status: 'complete' });

      const voiceCommand = {
        command: { type: 'click', target: 'button' }
      };

      await voicePlaybackIntegration.executeVoiceCommand(voiceCommand, {
        voiceSessionId: 'session123',
        sequential: false
      });

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 50));

      // Job should still be tracked until manually stopped
      expect(voicePlaybackIntegration.activeVoiceJobs.has('session123')).toBe(true);
    });
  });
});