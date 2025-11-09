/**
 * Tests for PlaybackEngine
 */

import { jest } from '@jest/globals';
import { PlaybackEngine } from '../../src/services/playbackEngine.js';

describe('PlaybackEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new PlaybackEngine();
  });

  afterEach(() => {
    engine.cleanup();
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(engine.actions).toEqual([]);
      expect(engine.currentIndex).toBe(0);
      expect(engine.status).toBe('idle');
      expect(engine.speed).toBe(1);
      expect(engine.completedCount).toBe(0);
      expect(engine.failedCount).toBe(0);
      expect(engine.errors).toEqual([]);
    });
  });

  describe('setSpeed', () => {
    test('should set valid speed', () => {
      engine.setSpeed(2);
      expect(engine.speed).toBe(2);
    });

    test('should throw error for invalid speed', () => {
      expect(() => engine.setSpeed(3)).toThrow('Invalid speed: 3');
    });
  });

  describe('pause and resume', () => {
    test('should pause and resume correctly', () => {
      engine.status = 'running';
      engine.pause();
      expect(engine.status).toBe('paused');
      
      engine.resume();
      expect(engine.status).toBe('running');
    });

    test('should not pause if not running', () => {
      engine.pause();
      expect(engine.status).toBe('idle');
    });

    test('should not resume if not paused', () => {
      engine.status = 'running';
      engine.resume();
      expect(engine.status).toBe('running');
    });
  });

  describe('stop', () => {
    test('should stop execution', () => {
      engine.status = 'running';
      engine.stop();
      expect(engine.status).toBe('idle');
    });
  });

  describe('getProgress', () => {
    test('should return progress information', () => {
      engine.actions = [{ type: 'click' }, { type: 'input' }];
      engine.currentIndex = 1;
      engine.status = 'running';
      engine.completedCount = 1;
      engine.failedCount = 0;

      const progress = engine.getProgress();
      
      expect(progress.current).toBe(1);
      expect(progress.total).toBe(2);
      expect(progress.status).toBe('running');
      expect(progress.completed).toBe(1);
      expect(progress.failed).toBe(0);
    });
  });

  describe('progress listeners', () => {
    test('should add and remove progress listeners', () => {
      const listener = jest.fn();
      
      engine.addProgressListener(listener);
      expect(engine.progressListeners.size).toBe(1);
      
      engine.removeProgressListener(listener);
      expect(engine.progressListeners.size).toBe(0);
    });

    test('should notify progress listeners', () => {
      const listener = jest.fn();
      engine.addProgressListener(listener);
      
      engine._notifyProgress();
      
      expect(listener).toHaveBeenCalledWith(engine.getProgress());
    });
  });

  describe('action executor', () => {
    test('should set and use action executor', async () => {
      const mockExecutor = {
        execute: jest.fn().mockResolvedValue({ success: true })
      };
      
      engine.setActionExecutor(mockExecutor);
      
      const result = await engine._executeAction({ type: 'click' });
      
      expect(mockExecutor.execute).toHaveBeenCalledWith({ type: 'click' });
      expect(result).toEqual({ success: true });
    });

    test('should throw error when no executor set', async () => {
      await expect(engine._executeAction({ type: 'click' }))
        .rejects.toThrow('Action executor not set');
    });
  });

  describe('replay validation', () => {
    test('should throw error for empty actions', async () => {
      await expect(engine.replay([]))
        .rejects.toThrow('Actions must be a non-empty array');
    });

    test('should throw error for non-array actions', async () => {
      await expect(engine.replay('not-array'))
        .rejects.toThrow('Actions must be a non-empty array');
    });

    test('should throw error for invalid speed', async () => {
      await expect(engine.replay([{ type: 'click' }], { speed: 3 }))
        .rejects.toThrow('Invalid speed: 3');
    });

    test('should throw error for invalid timeout', async () => {
      await expect(engine.replay([{ type: 'click' }], { timeout: 1000 }))
        .rejects.toThrow('Timeout must be between');
    });
  });
});