/**
 * Playback Engine Tests
 * Tests audio playback, UI animations, state management, error recovery, and cleanup
 */

import { PlaybackEngine } from '../../src/services/playbackEngine.js';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  tabs: {
    sendMessage: jest.fn()
  }
};

// Mock DOM APIs
global.document = {
  createElement: jest.fn().mockReturnValue({
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

global.window = {
  getComputedStyle: jest.fn().mockReturnValue({
    backgroundColor: 'rgb(255, 255, 255)',
    transition: 'all 0.3s ease'
  })
};

global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(),
  pause: jest.fn(),
  currentTime: 0,
  duration: 1,
  ended: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

global.setTimeout = jest.fn((fn, delay) => {
  return setTimeout(fn, delay);
});

global.clearTimeout = jest.fn();

describe('Playback Engine', () => {
  let playbackEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    playbackEngine = new PlaybackEngine();
  });

  describe('Action Execution', () => {
    test('should execute click action successfully', async () => {
      const actions = [{
        type: 'click',
        selector: '#test-button',
        delay: 100
      }];

      // Mock successful execution
      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        element: { id: 'test-button' }
      });

      const result = await playbackEngine.replay(actions);

      expect(result.success).toBe(true);
      expect(result.completed).toBe(1);
      expect(result.failed).toBe(0);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          type: 'EXECUTE_ACTION',
          action: expect.objectContaining({
            type: 'click',
            selector: '#test-button'
          })
        })
      );
    });

    test('should execute input action with text', async () => {
      const actions = [{
        type: 'input',
        selector: '#test-input',
        text: 'hello world',
        delay: 200
      }];

      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        element: { value: 'hello world' }
      });

      const result = await playbackEngine.replay(actions);

      expect(result.success).toBe(true);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          action: expect.objectContaining({
            type: 'input',
            text: 'hello world'
          })
        })
      );
    });

    test('should execute scroll action', async () => {
      const actions = [{
        type: 'scroll',
        direction: 'down',
        amount: 300,
        delay: 150
      }];

      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        scrollY: 300
      });

      const result = await playbackEngine.replay(actions);

      expect(result.success).toBe(true);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          action: expect.objectContaining({
            type: 'scroll',
            direction: 'down',
            amount: 300
          })
        })
      );
    });

    test('should execute wait action', async () => {
      const actions = [{
        type: 'wait',
        duration: 1000
      }];

      const startTime = Date.now();
      const result = await playbackEngine.replay(actions);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });

    test('should execute double click action', async () => {
      const actions = [{
        type: 'double_click',
        selector: '.test-element',
        delay: 100
      }];

      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        element: { className: 'test-element' }
      });

      const result = await playbackEngine.replay(actions);

      expect(result.success).toBe(true);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          action: expect.objectContaining({
            type: 'double_click'
          })
        })
      );
    });

    test('should execute right click action', async () => {
      const actions = [{
        type: 'right_click',
        selector: '#context-menu',
        delay: 100
      }];

      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        contextMenu: true
      });

      const result = await playbackEngine.replay(actions);

      expect(result.success).toBe(true);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          action: expect.objectContaining({
            type: 'right_click'
          })
        })
      );
    });
  });

  describe('State Management', () => {
    test('should maintain correct playback status', async () => {
      const actions = [{
        type: 'click',
        selector: '#button',
        delay: 100
      }];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      // Initial state
      expect(playbackEngine.status).toBe('idle');

      const replayPromise = playbackEngine.replay(actions);
      
      // During execution
      expect(playbackEngine.status).toBe('running');
      expect(playbackEngine.currentIndex).toBe(0);
      expect(playbackEngine.startTime).toBeDefined();

      await replayPromise;

      // After completion
      expect(playbackEngine.status).toBe('complete');
      expect(playbackEngine.completedCount).toBe(1);
    });

    test('should handle pause and resume', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 100 },
        { type: 'click', selector: '#button2', delay: 100 }
      ];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const replayPromise = playbackEngine.replay(actions);

      // Pause after first action
      await new Promise(resolve => setTimeout(resolve, 50));
      await playbackEngine.pause();

      expect(playbackEngine.status).toBe('paused');
      expect(playbackEngine.pauseTime).toBeDefined();

      // Resume playback
      await playbackEngine.resume();

      expect(playbackEngine.status).toBe('running');
      expect(playbackEngine.pauseTime).toBeNull();

      await replayPromise;

      expect(playbackEngine.status).toBe('complete');
    });

    test('should handle stop operation', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 100 },
        { type: 'click', selector: '#button2', delay: 100 },
        { type: 'click', selector: '#button3', delay: 100 }
      ];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const replayPromise = playbackEngine.replay(actions);

      // Stop after first action
      await new Promise(resolve => setTimeout(resolve, 50));
      const stopResult = await playbackEngine.stop();

      expect(stopResult.success).toBe(true);
      expect(playbackEngine.status).toBe('stopped');
      expect(playbackEngine.abortController.signal.aborted).toBe(true);

      await replayPromise;

      expect(playbackEngine.completedCount).toBeLessThan(actions.length);
    });

    test('should track progress correctly', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 50 },
        { type: 'click', selector: '#button2', delay: 50 },
        { type: 'click', selector: '#button3', delay: 50 }
      ];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const progressEvents = [];
      playbackEngine.on('progress', (data) => {
        progressEvents.push(data);
      });

      await playbackEngine.replay(actions);

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[progressEvents.length - 1].percentage).toBe(100);
    });
  });

  describe('Audio Playback', () => {
    test('should play success sound', async () => {
      const mockAudio = new Audio();
      global.Audio.mockReturnValue(mockAudio);

      await playbackEngine.playSuccessSound();

      expect(mockAudio.play).toHaveBeenCalled();
    });

    test('should play error sound', async () => {
      const mockAudio = new Audio();
      global.Audio.mockReturnValue(mockAudio);

      await playbackEngine.playErrorSound();

      expect(mockAudio.play).toHaveBeenCalled();
    });

    test('should handle audio playback errors gracefully', async () => {
      const mockAudio = new Audio();
      mockAudio.play.mockRejectedValue(new Error('Audio playback failed'));
      global.Audio.mockReturnValue(mockAudio);

      // Should not throw error
      await expect(playbackEngine.playSuccessSound()).resolves.not.toThrow();
    });

    test('should support custom audio files', async () => {
      const customAudioFile = 'custom-success.mp3';
      const mockAudio = new Audio();
      global.Audio.mockReturnValue(mockAudio);

      await playbackEngine.playSuccessSound(customAudioFile);

      expect(mockAudio.src).toContain(customAudioFile);
    });

    test('should mute audio when configured', async () => {
      playbackEngine.setAudioEnabled(false);
      const mockAudio = new Audio();
      global.Audio.mockReturnValue(mockAudio);

      await playbackEngine.playSuccessSound();

      expect(mockAudio.play).not.toHaveBeenCalled();
    });
  });

  describe('UI Animations', () => {
    test('should show visual feedback for click actions', async () => {
      const actions = [{
        type: 'click',
        selector: '#test-button',
        delay: 100
      }];

      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        element: { id: 'test-button' }
      });

      await playbackEngine.replay(actions);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          type: 'SHOW_VISUAL_FEEDBACK',
          element: expect.any(Object),
          actionType: 'click'
        })
      );
    });

    test('should highlight elements during execution', async () => {
      const actions = [{
        type: 'input',
        selector: '#test-input',
        text: 'test',
        delay: 100
      }];

      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        element: { id: 'test-input' }
      });

      await playbackEngine.replay(actions);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          type: 'HIGHLIGHT_ELEMENT',
          selector: '#test-input'
        })
      );
    });

    test('should show progress indicator', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 50 },
        { type: 'click', selector: '#button2', delay: 50 }
      ];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      await playbackEngine.replay(actions);

      // Should send progress updates
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          type: 'UPDATE_PROGRESS',
          current: expect.any(Number),
          total: expect.any(Number)
        })
      );
    });

    test('should customize animation duration', async () => {
      playbackEngine.setAnimationDuration(500);

      const actions = [{
        type: 'click',
        selector: '#button',
        delay: 100
      }];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      await playbackEngine.replay(actions);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          type: 'SHOW_VISUAL_FEEDBACK',
          duration: 500
        })
      );
    });
  });

  describe('Error Recovery', () => {
    test('should retry failed actions', async () => {
      const actions = [{
        type: 'click',
        selector: '#unreliable-button',
        delay: 100,
        retryCount: 3
      }];

      // Fail first 2 attempts, succeed on 3rd
      chrome.tabs.sendMessage
        .mockResolvedValueOnce({ success: false, error: 'Element not found' })
        .mockResolvedValueOnce({ success: false, error: 'Element not found' })
        .mockResolvedValueOnce({ success: true });

      const result = await playbackEngine.replay(actions);

      expect(result.success).toBe(true);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(3);
    });

    test('should handle element not found errors', async () => {
      const actions = [{
        type: 'click',
        selector: '#non-existent-button',
        delay: 100
      }];

      chrome.tabs.sendMessage.mockResolvedValue({
        success: false,
        error: 'Element not found: #non-existent-button'
      });

      const result = await playbackEngine.replay(actions);

      expect(result.success).toBe(false);
      expect(result.failed).toBe(1);
      expect(result.errors).toContain('Element not found: #non-existent-button');
    });

    test('should continue execution after non-critical errors', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 50 },
        { type: 'click', selector: '#non-existent', delay: 50 },
        { type: 'click', selector: '#button2', delay: 50 }
      ];

      chrome.tabs.sendMessage
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Element not found' })
        .mockResolvedValueOnce({ success: true });

      const result = await playbackEngine.replay(actions, { stopOnError: false });

      expect(result.success).toBe(true);
      expect(result.completed).toBe(2);
      expect(result.failed).toBe(1);
    });

    test('should stop on critical errors when configured', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 50 },
        { type: 'click', selector: '#non-existent', delay: 50 },
        { type: 'click', selector: '#button2', delay: 50 }
      ];

      chrome.tabs.sendMessage
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Element not found' });

      const result = await playbackEngine.replay(actions, { stopOnError: true });

      expect(result.success).toBe(false);
      expect(result.completed).toBe(1);
      expect(result.failed).toBe(1);
    });

    test('should handle timeout errors', async () => {
      const actions = [{
        type: 'click',
        selector: '#slow-button',
        delay: 100,
        timeout: 50
      }];

      // Simulate timeout by not responding
      chrome.tabs.sendMessage.mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });

      const result = await playbackEngine.replay(actions);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('timeout');
    });
  });

  describe('Cleanup and Resource Management', () => {
    test('should cleanup resources on completion', async () => {
      const actions = [{
        type: 'click',
        selector: '#button',
        delay: 100
      }];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      await playbackEngine.replay(actions);

      expect(playbackEngine.abortController).toBeNull();
      expect(playbackEngine.actions).toEqual([]);
    });

    test('should cleanup on stop', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 100 },
        { type: 'click', selector: '#button2', delay: 100 }
      ];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const replayPromise = playbackEngine.replay(actions);

      await new Promise(resolve => setTimeout(resolve, 50));
      await playbackEngine.stop();

      expect(playbackEngine.abortController.signal.aborted).toBe(true);
      expect(playbackEngine.status).toBe('stopped');
    });

    test('should remove visual feedback elements', async () => {
      const actions = [{
        type: 'click',
        selector: '#button',
        delay: 100
      }];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      await playbackEngine.replay(actions);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          type: 'REMOVE_VISUAL_FEEDBACK'
        })
      );
    });

    test('should handle memory leaks prevention', async () => {
      const actions = Array(10).fill().map((_, i) => ({
        type: 'click',
        selector: `#button${i}`,
        delay: 10
      }));

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      await playbackEngine.replay(actions);

      // Verify cleanup
      expect(playbackEngine.actions.length).toBe(0);
      expect(playbackEngine.progressListeners.size).toBe(0);
    });

    test('should cleanup event listeners', async () => {
      const mockAudio = new Audio();
      global.Audio.mockReturnValue(mockAudio);

      await playbackEngine.playSuccessSound();

      expect(mockAudio.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Performance and Optimization', () => {
    test('should execute actions with correct timing', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 100 },
        { type: 'click', selector: '#button2', delay: 150 },
        { type: 'click', selector: '#button3', delay: 200 }
      ];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const startTime = Date.now();
      await playbackEngine.replay(actions);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(450); // Sum of delays
    });

    test('should support variable playback speeds', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 200 },
        { type: 'click', selector: '#button2', delay: 200 }
      ];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const startTime = Date.now();
      await playbackEngine.replay(actions, { speed: 2 }); // 2x speed
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(350); // Should be faster than 400ms
    });

    test('should batch operations for better performance', async () => {
      const actions = Array(5).fill().map((_, i) => ({
        type: 'click',
        selector: `#button${i}`,
        delay: 10
      }));

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const result = await playbackEngine.replay(actions, { batch: true });

      expect(result.success).toBe(true);
      expect(result.completed).toBe(5);
    });

    test('should handle large action sequences efficiently', async () => {
      const actions = Array(100).fill().map((_, i) => ({
        type: 'click',
        selector: `#button${i % 10}`, // Reuse selectors
        delay: 1
      }));

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const startTime = Date.now();
      const result = await playbackEngine.replay(actions);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('Event System', () => {
    test('should emit progress events', async () => {
      const actions = [
        { type: 'click', selector: '#button1', delay: 50 },
        { type: 'click', selector: '#button2', delay: 50 }
      ];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const progressListener = jest.fn();
      playbackEngine.on('progress', progressListener);

      await playbackEngine.replay(actions);

      expect(progressListener).toHaveBeenCalledTimes(2);
    });

    test('should emit completion events', async () => {
      const actions = [{ type: 'click', selector: '#button', delay: 50 }];

      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const completionListener = jest.fn();
      playbackEngine.on('complete', completionListener);

      await playbackEngine.replay(actions);

      expect(completionListener).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          completed: 1,
          failed: 0
        })
      );
    });

    test('should emit error events', async () => {
      const actions = [{ type: 'click', selector: '#non-existent', delay: 50 }];

      chrome.tabs.sendMessage.mockResolvedValue({
        success: false,
        error: 'Element not found'
      });

      const errorListener = jest.fn();
      playbackEngine.on('error', errorListener);

      await playbackEngine.replay(actions);

      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Element not found')
        })
      );
    });

    test('should allow removing event listeners', () => {
      const listener = jest.fn();
      playbackEngine.on('test', listener);
      playbackEngine.off('test', listener);

      playbackEngine.emit('test', { data: 'test' });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});