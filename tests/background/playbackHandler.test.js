/**
 * Tests for PlaybackHandler
 */

import { jest } from '@jest/globals';
import { PlaybackHandler } from '../../src/background/playbackHandler.js';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

describe('PlaybackHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new PlaybackHandler();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize correctly', () => {
      expect(handler.jobs).toBeInstanceOf(Map);
      expect(handler.engines).toBeInstanceOf(Map);
      expect(handler.nextJobId).toBe(1);
      expect(handler.storageKey).toBe('playback_state');
    });

    test('should setup message listener', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    test('should throw error for empty actions', async () => {
      await expect(handler.start([]))
        .rejects.toThrow('Actions must be a non-empty array');
    });

    test('should throw error for invalid speed', async () => {
      await expect(handler.start([{ type: 'click' }], { speed: 3 }))
        .rejects.toThrow('Invalid speed: 3');
    });

    test('should throw error for invalid timeout', async () => {
      await expect(handler.start([{ type: 'click' }], { timeout: 1000 }))
        .rejects.toThrow('Timeout must be between');
    });

    test('should create job with valid inputs', async () => {
      // Mock active tab
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      const jobId = await handler.start([{ type: 'click' }], { speed: 1 });
      
      expect(jobId).toBe('job_1');
      expect(handler.jobs.has(jobId)).toBe(true);
      expect(handler.engines.has(jobId)).toBe(true);
      
      const job = handler.jobs.get(jobId);
      expect(job.status).toBe('running');
      expect(job.actions).toEqual([{ type: 'click' }]);
      expect(job.options.speed).toBe(1);
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      await handler.start([{ type: 'click' }]);
    });

    test('should stop running job', async () => {
      const result = await handler.stop('job_1');
      
      expect(result.success).toBe(true);
      
      const job = handler.jobs.get('job_1');
      expect(job.status).toBe('stopped');
      expect(job.endTime).toBeTruthy();
    });

    test('should return error for non-existent job', async () => {
      const result = await handler.stop('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Job not found');
    });

    test('should return error for finished job', async () => {
      const job = handler.jobs.get('job_1');
      job.status = 'complete';
      
      const result = await handler.stop('job_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already finished');
    });
  });

  describe('pause', () => {
    beforeEach(async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      await handler.start([{ type: 'click' }]);
    });

    test('should pause running job', async () => {
      const result = await handler.pause('job_1');
      
      expect(result.success).toBe(true);
      
      const job = handler.jobs.get('job_1');
      expect(job.status).toBe('paused');
    });

    test('should return error for non-running job', async () => {
      const result = await handler.pause('job_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Job not running');
    });
  });

  describe('resume', () => {
    beforeEach(async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      await handler.start([{ type: 'click' }]);
    });

    test('should resume paused job', async () => {
      // First pause the job
      await handler.pause('job_1');
      
      const result = await handler.resume('job_1');
      
      expect(result.success).toBe(true);
      
      const job = handler.jobs.get('job_1');
      expect(job.status).toBe('running');
    });

    test('should return error for non-paused job', async () => {
      const result = await handler.resume('job_1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Job not paused');
    });
  });

  describe('getStatus', () => {
    beforeEach(async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      await handler.start([{ type: 'click' }]);
    });

    test('should return status for specific job', async () => {
      const status = await handler.getStatus('job_1');
      
      expect(status.id).toBe('job_1');
      expect(status.status).toBe('running');
      expect(status.progress).toBeTruthy();
    });

    test('should return error for non-existent job', async () => {
      const status = await handler.getStatus('non-existent');
      
      expect(status.error).toContain('Job not found');
    });

    test('should return all jobs when no jobId provided', async () => {
      const status = await handler.getStatus();
      
      expect(status.jobs).toBeInstanceOf(Array);
      expect(status.jobs.length).toBe(1);
      expect(status.jobs[0].id).toBe('job_1');
    });
  });

  describe('_getActiveTabId', () => {
    test('should return tab ID when tab found', async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      const tabId = await handler._getActiveTabId();
      
      expect(tabId).toBe(123);
    });

    test('should return null when no tab found', async () => {
      chrome.tabs.query.mockResolvedValue([]);
      
      const tabId = await handler._getActiveTabId();
      
      expect(tabId).toBeNull();
    });

    test('should return null on error', async () => {
      chrome.tabs.query.mockRejectedValue(new Error('Chrome error'));
      
      const tabId = await handler._getActiveTabId();
      
      expect(tabId).toBeNull();
    });
  });

  describe('_relayToContent', () => {
    test('should send message to content script', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });
      
      const result = await handler._relayToContent(123, { type: 'click' }, 'job_1', 0);
      
      expect(result.success).toBe(true);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'PLAYBACK_EXECUTE',
        action: { type: 'click' },
        jobId: 'job_1',
        actionIndex: 0
      });
    });

    test('should return error when no tab ID', async () => {
      const result = await handler._relayToContent(null, { type: 'click' }, 'job_1', 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No active tab');
    });

    test('should return error on Chrome API error', async () => {
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Chrome error'));
      
      const result = await handler._relayToContent(123, { type: 'click' }, 'job_1', 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chrome error');
    });
  });

  describe('_sanitizeJob', () => {
    test('should sanitize job for external consumption', () => {
      const job = {
        id: 'job_1',
        status: 'running',
        progress: { current: 1, total: 2, completed: 1, failed: 0 },
        startTime: Date.now(),
        endTime: null,
        errors: []
      };

      const sanitized = handler._sanitizeJob(job);

      expect(sanitized.id).toBe('job_1');
      expect(sanitized.status).toBe('running');
      expect(sanitized.progress).toEqual(job.progress);
      expect(sanitized.errorCount).toBe(0);
      expect(sanitized.duration).toBeGreaterThanOrEqual(0);
    });
  });
});