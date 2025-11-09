/**
 * Tests for InstructionParser - AI instruction parsing
 * Tests 25+ scenarios covering AI parsing, fallback parsing, error handling
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InstructionParser } from '../../../ai/InstructionParser';
import { ACTION_TYPES } from '../../../common/constants';

describe('InstructionParser', () => {
  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parse() - Main entry point', () => {
    test('should use fallback parser when Gemini is disabled', async () => {
      const instructions = 'Click the submit button';
      const result = await InstructionParser.parse(instructions, false);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should use Gemini when enabled with API key', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify([{
                  type: ACTION_TYPES.CLICK,
                  target: 'submit button',
                  description: 'Click submit button'
                }])
              }]
            }
          }]
        })
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      const result = await InstructionParser.parse(
        'Click the submit button',
        true,
        'test-api-key'
      );
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.any(Object)
      );
      expect(result).toEqual([{
        type: ACTION_TYPES.CLICK,
        target: 'submit button',
        description: 'Click submit button'
      }]);
    });

    test('should fallback to rule-based parser when Gemini fails', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'));
      
      const result = await InstructionParser.parse(
        'Click the submit button',
        true,
        'test-api-key'
      );
      
      expect(console.warn).toHaveBeenCalledWith(
        'Gemini parsing failed, falling back to rule-based parser:',
        expect.any(Error)
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle empty instructions', async () => {
      const result = await InstructionParser.parse('');
      
      expect(result).toEqual([]);
    });

    test('should handle null/undefined instructions', async () => {
      const result1 = await InstructionParser.parse(null);
      const result2 = await InstructionParser.parse(undefined);
      
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });
  });

  describe('parseWithFallback() - Rule-based parsing', () => {
    test('should parse simple click instructions', () => {
      const result = InstructionParser.parseWithFallback('Click the login button');
      
      expect(result).toEqual([{
        type: ACTION_TYPES.CLICK,
        target: 'login button',
        description: 'Click the login button'
      }]);
    });

    test('should parse input instructions', () => {
      const result = InstructionParser.parseWithFallback('Type "hello world" in the search box');
      
      expect(result).toEqual([{
        type: ACTION_TYPES.INPUT,
        target: 'search box',
        value: 'hello world',
        description: 'Type "hello world" in the search box'
      }]);
    });

    test('should parse scroll instructions', () => {
      const result = InstructionParser.parseWithFallback('Scroll down to see more content');
      
      expect(result).toEqual([{
        type: ACTION_TYPES.SCROLL,
        direction: 'down',
        amount: 500,
        description: 'Scroll down to see more content'
      }]);
    });

    test('should parse hover instructions', () => {
      const result = InstructionParser.parseWithFallback('Hover over the menu item');
      
      expect(result).toEqual([{
        type: ACTION_TYPES.HOVER,
        target: 'menu item',
        description: 'Hover over the menu item'
      }]);
    });

    test('should parse double-click instructions', () => {
      const result = InstructionParser.parseWithFallback('Double-click the file to open it');
      
      expect(result).toEqual([{
        type: ACTION_TYPES.DOUBLE_CLICK,
        target: 'file',
        description: 'Double-click the file to open it'
      }]);
    });

    test('should parse right-click instructions', () => {
      const result = InstructionParser.parseWithFallback('Right-click on the element');
      
      expect(result).toEqual([{
        type: ACTION_TYPES.RIGHT_CLICK,
        target: 'element',
        description: 'Right-click on the element'
      }]);
    });

    test('should parse multi-step instructions', () => {
      const result = InstructionParser.parseWithFallback(
        'Click the login button, then type "admin" in the username field, and finally click submit'
      );
      
      expect(result).toHaveLength(3);
      expect(result[0].type).toBe(ACTION_TYPES.CLICK);
      expect(result[1].type).toBe(ACTION_TYPES.INPUT);
      expect(result[2].type).toBe(ACTION_TYPES.CLICK);
    });

    test('should handle complex sentences', () => {
      const result = InstructionParser.parseWithFallback(
        'I need you to click on the settings icon in the top right corner of the page'
      );
      
      expect(result).toEqual([{
        type: ACTION_TYPES.CLICK,
        target: 'settings icon in the top right corner of the page',
        description: 'Click on the settings icon in the top right corner of the page'
      }]);
    });

    test('should extract numeric values from instructions', () => {
      const result = InstructionParser.parseWithFallback('Scroll down by 300 pixels');
      
      expect(result).toEqual([{
        type: ACTION_TYPES.SCROLL,
        direction: 'down',
        amount: 300,
        description: 'Scroll down by 300 pixels'
      }]);
    });

    test('should handle malformed instructions gracefully', () => {
      const result = InstructionParser.parseWithFallback('Just some random text without clear action');
      
      expect(result).toEqual([]);
    });
  });

  describe('parseWithGemini() - AI parsing', () => {
    test('should handle successful API response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify([{
                  type: ACTION_TYPES.CLICK,
                  target: 'submit button',
                  description: 'Click submit button'
                }])
              }]
            }
          }]
        })
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      const result = await InstructionParser.parseWithGemini(
        'Click the submit button',
        'test-api-key'
      );
      
      expect(result).toEqual([{
        type: ACTION_TYPES.CLICK,
        target: 'submit button',
        description: 'Click submit button'
      }]);
    });

    test('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      await expect(
        InstructionParser.parseWithGemini('Click button', 'test-key')
      ).rejects.toThrow('Network error');
    });

    test('should handle malformed API response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: 'invalid json response'
              }]
            }
          }]
        })
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      await expect(
        InstructionParser.parseWithGemini('Click button', 'test-key')
      ).rejects.toThrow();
    });

    test('should include page context in API call', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify([])
              }]
            }
          }]
        })
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      const pageContext = 'Current page: Login form with username and password fields';
      
      await InstructionParser.parseWithGemini(
        'Fill the form',
        'test-api-key',
        pageContext
      );
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          body: expect.stringContaining(pageContext)
        })
      );
    });

    test('should try different Gemini models on failure', async () => {
      // First model fails
      global.fetch
        .mockRejectedValueOnce(new Error('Model not available'))
        .mockRejectedValueOnce(new Error('Rate limited'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify([{
                    type: ACTION_TYPES.CLICK,
                    target: 'button'
                  }])
                }]
              }
            }]
          })
        });
      
      const result = await InstructionParser.parseWithGemini(
        'Click button',
        'test-api-key'
      );
      
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual([{
        type: ACTION_TYPES.CLICK,
        target: 'button'
      }]);
    });
  });

  describe('validateActions() - Action validation', () => {
    test('should validate action structure', () => {
      const validActions = [{
        type: ACTION_TYPES.CLICK,
        target: 'button',
        description: 'Click button'
      }];
      
      expect(() => InstructionParser.validateActions(validActions)).not.toThrow();
    });

    test('should reject invalid action types', () => {
      const invalidActions = [{
        type: 'INVALID_TYPE',
        target: 'button'
      }];
      
      expect(() => InstructionParser.validateActions(invalidActions)).toThrow();
    });

    test('should reject actions without target', () => {
      const invalidActions = [{
        type: ACTION_TYPES.CLICK
        // missing target
      }];
      
      expect(() => InstructionParser.validateActions(invalidActions)).toThrow();
    });

    test('should handle empty action arrays', () => {
      expect(() => InstructionParser.validateActions([])).not.toThrow();
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle network timeouts', async () => {
      global.fetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      await expect(
        InstructionParser.parseWithGemini('Click button', 'test-key')
      ).rejects.toThrow('Timeout');
    });

    test('should handle API rate limiting', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      await expect(
        InstructionParser.parseWithGemini('Click button', 'test-key')
      ).rejects.toThrow();
    });

    test('should handle invalid JSON in Gemini response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: '{ invalid json }'
              }]
            }
          }]
        })
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      await expect(
        InstructionParser.parseWithGemini('Click button', 'test-key')
      ).rejects.toThrow();
    });

    test('should preserve original instruction in description', async () => {
      const originalInstruction = 'Click the blue submit button at the bottom of the form';
      
      const result = InstructionParser.parseWithFallback(originalInstruction);
      
      expect(result[0].description).toContain(originalInstruction);
    });

    test('should handle special characters in instructions', () => {
      const result = InstructionParser.parseWithFallback('Type "hello@world.com" in the email field');
      
      expect(result).toEqual([{
        type: ACTION_TYPES.INPUT,
        target: 'email field',
        value: 'hello@world.com',
        description: 'Type "hello@world.com" in the email field'
      }]);
    });
  });
});