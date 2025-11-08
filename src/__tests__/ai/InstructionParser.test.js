/**
 * Tests for AI InstructionParser
 */

import { InstructionParser } from '../../ai/InstructionParser.js';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('InstructionParser', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('parse()', () => {
    it('should use fallback parsing when Gemini is disabled', async () => {
      const result = await InstructionParser.parse('Click the button', false);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should use Gemini parsing when enabled with API key', async () => {
      const mockResponse = [{ type: 'click', target: 'button' }];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockResponse) }],
            },
          }],
        }),
      });

      const result = await InstructionParser.parse('Click the button', true, 'test-api-key');
      
      expect(result).toEqual(mockResponse);
    });

    it('should fallback to rule-based parsing on Gemini error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await InstructionParser.parse('Click the button', true, 'test-api-key');
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('parseWithFallback()', () => {
    it('should parse Russian click instruction', () => {
      const result = InstructionParser.parseWithFallback('Кликни на "кнопку входа"');
      
      expect(result).toEqual([
        {
          type: 'click',
          target: 'кнопку входа',
          description: 'Клик на "кнопку входа"',
        },
      ]);
    });

    it('should parse input instruction', () => {
      const result = InstructionParser.parseWithFallback('Введи "test@example.com"');
      
      expect(result).toEqual([
        {
          type: 'input',
          value: 'test@example.com',
          description: 'Введи: "test@example.com"',
        },
      ]);
    });

    it('should parse wait instruction', () => {
      const result = InstructionParser.parseWithFallback('Жди 2 секунды');
      
      expect(result).toEqual([
        {
          type: 'wait',
          duration: 2000,
          description: 'Ожидание 2000ms',
        },
      ]);
    });

    it('should parse scroll instruction', () => {
      const result = InstructionParser.parseWithFallback('Прокрути 400 пикселей');
      
      expect(result).toEqual([
        {
          type: 'scroll',
          pixels: 400,
          description: 'Прокрутка на 400px',
        },
      ]);
    });

    it('should parse hover instruction', () => {
      const result = InstructionParser.parseWithFallback('Наведи на "меню"');
      
      expect(result).toEqual([
        {
          type: 'hover',
          target: 'меню',
          description: 'Наведение на "меню"',
        },
      ]);
    });

    it('should parse double click instruction', () => {
      const result = InstructionParser.parseWithFallback('Двойной клик на "файл"');
      
      expect(result).toEqual([
        {
          type: 'click',
          target: 'файл',
          description: 'Клик на "файл"',
        },
        {
          type: 'double_click',
          target: 'файл',
          description: 'Двойной клик на "файл"',
        },
      ]);
    });

    it('should parse right click instruction', () => {
      const result = InstructionParser.parseWithFallback('Правый клик на "элемент"');
      
      expect(result).toEqual([
        {
          type: 'click',
          target: 'элемент',
          description: 'Клик на "элемент"',
        },
        {
          type: 'right_click',
          target: 'элемент',
          description: 'Правый клик на "элемент"',
        },
      ]);
    });

    it('should parse select instruction', () => {
      const result = InstructionParser.parseWithFallback('Выбери "Россия"');
      
      expect(result).toEqual([
        {
          type: 'select',
          value: 'Россия',
          description: 'Выбрать "Россия"',
        },
      ]);
    });

    it('should return empty array for unrecognized instruction', () => {
      const result = InstructionParser.parseWithFallback('Invalid instruction format');
      
      expect(result).toEqual([]);
    });
  });

  describe('parseWithGemini()', () => {
    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(InstructionParser.parseWithGemini('Click button', 'test-key'))
        .rejects.toThrow('Network error');
    });

    it('should handle API error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(InstructionParser.parseWithGemini('Click button', 'test-key'))
        .rejects.toThrow('Gemini API Error: Rate limit exceeded');
    });

    it('should parse successful API response', async () => {
      const mockResponse = [
        { type: 'click', target: 'login button', description: 'Click login button' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockResponse) }],
            },
          }],
        }),
      });

      const result = await InstructionParser.parseWithGemini('Click the login button', 'test-key');
      
      expect(result).toEqual(mockResponse);
    });

    it('should handle malformed JSON response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Invalid JSON response' }],
            },
          }],
        }),
      });

      const result = await InstructionParser.parseWithGemini('Click button', 'test-key');
      expect(result).toBeUndefined();
    });
  });

  describe('validateActions()', () => {
    it('should validate valid actions array', () => {
      const actions = [
        { type: 'click', target: 'button' },
        { type: 'input', value: 'text' },
      ];
      
      expect(() => InstructionParser.validateActions(actions)).not.toThrow();
    });

    it('should reject non-array input', () => {
      expect(() => InstructionParser.validateActions('invalid')).toThrow('Actions must be an array');
    });

    it('should reject invalid action type', () => {
      const actions = [{ type: 'invalid_type' }];
      
      expect(() => InstructionParser.validateActions(actions)).toThrow('Invalid action type: invalid_type');
    });
  });

  describe('mergeDuplicates()', () => {
    it('should merge duplicate actions', () => {
      const actions = [
        { type: 'click', target: 'button' },
        { type: 'click', target: 'button' },
        { type: 'input', value: 'text' },
      ];
      
      const result = InstructionParser.mergeDuplicates(actions);
      
      expect(result).toEqual([
        { type: 'click', target: 'button' },
        { type: 'input', value: 'text' },
      ]);
    });

    it('should keep different actions', () => {
      const actions = [
        { type: 'click', target: 'button1' },
        { type: 'click', target: 'button2' },
      ];
      
      const result = InstructionParser.mergeDuplicates(actions);
      
      expect(result).toEqual(actions);
    });
  });

  describe('optimizeSequence()', () => {
    it('should remove consecutive wait actions', () => {
      const actions = [
        { type: 'wait', duration: 1000 },
        { type: 'wait', duration: 2000 },
        { type: 'click', target: 'button' },
      ];
      
      const result = InstructionParser.optimizeSequence(actions);
      
      expect(result).toEqual([
        { type: 'wait', duration: 2000 },
        { type: 'click', target: 'button' },
      ]);
    });

    it('should remove very short waits', () => {
      const actions = [
        { type: 'wait', duration: 50 },
        { type: 'click', target: 'button' },
      ];
      
      const result = InstructionParser.optimizeSequence(actions);
      
      expect(result).toEqual([
        { type: 'click', target: 'button' },
      ]);
    });
  });
});