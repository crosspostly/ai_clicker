/**
 * Tests for background service worker - job queue and state management
 * Tests 15+ scenarios covering job management, storage, message handling
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Background Service Worker', () => {
  beforeEach(() => {
    // Mock Chrome APIs
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
        sendMessage: jest.fn(),
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn(),
          clear: jest.fn(),
        },
        sync: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn(),
          clear: jest.fn(),
        },
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
      },
      action: {
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn(),
      },
    };

    // Mock global timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('Job Queue Management', () => {
    test('should create job with unique ID', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      const job = await JobQueue.addJob({
        type: 'click',
        target: 'button',
        description: 'Click button'
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.type).toBe('click');
      expect(job.target).toBe('button');
      expect(job.status).toBe('pending');
    });

    test('should process jobs in FIFO order', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      const job1 = await JobQueue.addJob({ type: 'click', target: 'button1' });
      const job2 = await JobQueue.addJob({ type: 'click', target: 'button2' });
      
      const jobs = await JobQueue.getJobs();
      
      expect(jobs).toHaveLength(2);
      expect(jobs[0].id).toBe(job1.id);
      expect(jobs[1].id).toBe(job2.id);
    });

    test('should update job status', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      const job = await JobQueue.addJob({ type: 'click', target: 'button' });
      await JobQueue.updateJobStatus(job.id, 'running');
      
      const updatedJob = await JobQueue.getJob(job.id);
      expect(updatedJob.status).toBe('running');
    });

    test('should mark job as completed', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      const job = await JobQueue.addJob({ type: 'click', target: 'button' });
      await JobQueue.completeJob(job.id);
      
      const completedJob = await JobQueue.getJob(job.id);
      expect(completedJob.status).toBe('completed');
      expect(completedJob.completedAt).toBeDefined();
    });

    test('should handle job failure', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      const job = await JobQueue.addJob({ type: 'click', target: 'button' });
      await JobQueue.failJob(job.id, 'Element not found');
      
      const failedJob = await JobQueue.getJob(job.id);
      expect(failedJob.status).toBe('failed');
      expect(failedJob.error).toBe('Element not found');
    });

    test('should limit queue size', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      // Add jobs up to limit
      const jobs = [];
      for (let i = 0; i < 150; i++) {
        try {
          jobs.push(await JobQueue.addJob({ type: 'click', target: `button${i}` }));
        } catch (error) {
          // Expected when queue is full
        }
      }
      
      expect(jobs.length).toBeLessThanOrEqual(100); // Assuming max 100 jobs
    });

    test('should clear completed jobs', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      // Add and complete some jobs
      const job1 = await JobQueue.addJob({ type: 'click', target: 'button1' });
      const job2 = await JobQueue.addJob({ type: 'click', target: 'button2' });
      
      await JobQueue.completeJob(job1.id);
      await JobQueue.completeJob(job2.id);
      
      const clearedCount = await JobQueue.clearCompletedJobs();
      expect(clearedCount).toBe(2);
      
      const remainingJobs = await JobQueue.getJobs();
      expect(remainingJobs).toHaveLength(0);
    });
  });

  describe('State Management', () => {
    test('should persist state to storage', async () => {
      const { StateManager } = await import('../../src/background/index.js');
      
      const state = { isRecording: true, currentJobId: 'job123' };
      await StateManager.setState(state);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'ai-autoclicker-state': state
        })
      );
    });

    test('should load state from storage', async () => {
      const { StateManager } = await import('../../src/background/index.js');
      
      const mockState = { isRecording: true, currentJobId: 'job123' };
      chrome.storage.local.get.mockResolvedValue({ 'ai-autoclicker-state': mockState });
      
      const state = await StateManager.getState();
      
      expect(state).toEqual(mockState);
      expect(chrome.storage.local.get).toHaveBeenCalledWith('ai-autoclicker-state');
    });

    test('should handle missing state gracefully', async () => {
      const { StateManager } = await import('../../src/background/index.js');
      
      chrome.storage.local.get.mockResolvedValue({});
      
      const state = await StateManager.getState();
      
      expect(state).toEqual({
        isRecording: false,
        currentJobId: null,
        jobs: []
      });
    });

    test('should update badge based on state', async () => {
      const { StateManager } = await import('../../src/background/index.js');
      
      await StateManager.setState({ isRecording: true });
      
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith('●');
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith('#ff0000');
      
      await StateManager.setState({ isRecording: false });
      
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith('');
    });

    test('should subscribe to state changes', async () => {
      const { StateManager } = await import('../../src/background/index.js');
      
      const listener = jest.fn();
      StateManager.subscribe(listener);
      
      await StateManager.setState({ isRecording: true });
      
      expect(listener).toHaveBeenCalledWith({ isRecording: true });
    });

    test('should unsubscribe from state changes', async () => {
      const { StateManager } = await import('../../src/background/index.js');
      
      const listener = jest.fn();
      StateManager.subscribe(listener);
      StateManager.unsubscribe(listener);
      
      await StateManager.setState({ isRecording: true });
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    test('should handle start recording message', async () => {
      const background = await import('../../src/background/index.js');
      
      const message = { type: 'START_RECORDING' };
      const sendResponse = jest.fn();
      
      await background.default(message, sendResponse);
      
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith('●');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should handle stop recording message', async () => {
      const background = await import('../../src/background/index.js');
      
      const message = { type: 'STOP_RECORDING' };
      const sendResponse = jest.fn();
      
      await background.default(message, sendResponse);
      
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith('');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should handle execute actions message', async () => {
      const background = await import('../../src/background/index.js');
      
      const actions = [{ type: 'click', target: 'button' }];
      const message = { type: 'EXECUTE_ACTIONS', actions };
      const sendResponse = jest.fn();
      
      await background.default(message, sendResponse);
      
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.any(Number),
        { type: 'EXECUTE_ACTIONS', actions }
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should handle get state message', async () => {
      const background = await import('../../src/background/index.js');
      
      const message = { type: 'GET_STATE' };
      const sendResponse = jest.fn();
      
      chrome.storage.local.get.mockResolvedValue({ 
        'ai-autoclicker-state': { isRecording: true } 
      });
      
      await background.default(message, sendResponse);
      
      expect(sendResponse).toHaveBeenCalledWith({ 
        success: true, 
        state: { isRecording: true } 
      });
    });

    test('should handle unknown message type', async () => {
      const background = await import('../../src/background/index.js');
      
      const message = { type: 'UNKNOWN_MESSAGE' };
      const sendResponse = jest.fn();
      
      await background.default(message, sendResponse);
      
      expect(sendResponse).toHaveBeenCalledWith({ 
        success: false, 
        error: 'Unknown message type' 
      });
    });

    test('should handle message sending errors', async () => {
      const background = await import('../../src/background/index.js');
      
      const message = { type: 'EXECUTE_ACTIONS', actions: [] };
      const sendResponse = jest.fn();
      
      chrome.tabs.sendMessage.mockImplementation(() => {
        throw new Error('Tab not found');
      });
      
      await background.default(message, sendResponse);
      
      expect(sendResponse).toHaveBeenCalledWith({ 
        success: false, 
        error: 'Tab not found' 
      });
    });
  });

  describe('Error Recovery', () => {
    test('should retry failed jobs', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      const job = await JobQueue.addJob({ 
        type: 'click', 
        target: 'button',
        retryCount: 0 
      });
      
      await JobQueue.failJob(job.id, 'Temporary error');
      
      // Wait for retry delay
      jest.advanceTimersByTime(5000);
      
      const retriedJob = await JobQueue.getJob(job.id);
      expect(retriedJob.retryCount).toBe(1);
      expect(retriedJob.status).toBe('pending');
    });

    test('should stop retrying after max attempts', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      const job = await JobQueue.addJob({ 
        type: 'click', 
        target: 'button',
        retryCount: 3 
      });
      
      await JobQueue.failJob(job.id, 'Persistent error');
      
      const failedJob = await JobQueue.getJob(job.id);
      expect(failedJob.status).toBe('failed');
      expect(failedJob.retryCount).toBe(3);
    });

    test('should handle storage errors gracefully', async () => {
      const { StateManager } = await import('../../src/background/index.js');
      
      chrome.storage.local.set.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await expect(StateManager.setState({ test: true }))
        .rejects.toThrow('Storage quota exceeded');
    });

    test('should maintain job queue integrity', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      // Simulate concurrent job operations
      const job1Promise = JobQueue.addJob({ type: 'click', target: 'button1' });
      const job2Promise = JobQueue.addJob({ type: 'click', target: 'button2' });
      
      const [job1, job2] = await Promise.all([job1Promise, job2Promise]);
      
      expect(job1.id).not.toBe(job2.id);
      
      const jobs = await JobQueue.getJobs();
      expect(jobs).toHaveLength(2);
    });
  });

  describe('Performance and Optimization', () => {
    test('should cleanup old completed jobs', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      // Add old completed job (24 hours ago)
      const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oldJob = await JobQueue.addJob({ type: 'click', target: 'button' });
      await JobQueue.completeJob(oldJob.id);
      
      // Mock the completedAt time
      jest.spyOn(Date, 'now').mockReturnValue(oldDate.getTime());
      
      const cleanedCount = await JobQueue.cleanupOldJobs();
      expect(cleanedCount).toBeGreaterThan(0);
    });

    test('should batch storage operations', async () => {
      const { StateManager } = await import('../../src/background/index.js');
      
      const state = { 
        isRecording: true,
        jobs: Array(50).fill().map((_, i) => ({ id: i, type: 'click' }))
      };
      
      await StateManager.setState(state);
      
      // Should batch multiple updates into single storage call
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    });

    test('should handle memory pressure', async () => {
      const { JobQueue } = await import('../../src/background/index.js');
      
      // Add many jobs to test memory management
      const jobs = [];
      for (let i = 0; i < 200; i++) {
        try {
          jobs.push(await JobQueue.addJob({ type: 'click', target: `button${i}` }));
        } catch (error) {
          // Expected when under memory pressure
        }
      }
      
      expect(jobs.length).toBeLessThan(200);
    });
  });
});