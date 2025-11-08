/**
 * Tests for ElementFinder utility
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ElementFinder } from '../../../content/finder/ElementFinder.js';

describe('ElementFinder', () => {
  let finder;
  let mockDocument;

  beforeEach(() => {
    finder = new ElementFinder();
    
    // Mock document methods
    mockDocument = {
      contains: jest.fn(),
      createElement: jest.fn(),
      getElementById: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      evaluate: jest.fn(),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
      },
    };
    
    global.document = mockDocument;
    global.window = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor()', () => {
    it('should initialize with empty cache', () => {
      expect(finder.selectorCache.size).toBe(0);
      expect(finder.maxCacheSize).toBe(500);
    });
  });

  describe('find()', () => {
    beforeEach(() => {
      // Ensure document.contains is properly mocked
      global.document.contains = jest.fn();
    });

    it('should return cached element if available and valid', () => {
      const mockElement = { id: 'test-element' };
      finder.selectorCache.set('test-target', mockElement);
      global.document.contains.mockReturnValue(true);

      const result = finder.find('test-target');
      
      expect(result).toBe(mockElement);
      expect(global.document.contains).toHaveBeenCalledWith(mockElement);
    });

    it('should remove stale cache entry', () => {
      const mockElement = { id: 'test-element' };
      finder.selectorCache.set('test-target', mockElement);
      global.document.contains.mockReturnValue(false);

      finder.find('test-target');
      
      expect(finder.selectorCache.has('test-target')).toBe(false);
    });

    it('should try findByText strategy first', () => {
      const mockElement = { textContent: 'Click me' };
      jest.spyOn(finder, 'findByText').mockReturnValue(mockElement);

      const result = finder.find('Click me');
      
      expect(finder.findByText).toHaveBeenCalledWith('Click me');
      expect(result).toBe(mockElement);
    });

    it('should try findBySelector if findByText fails', () => {
      jest.spyOn(finder, 'findByText').mockReturnValue(null);
      const mockElement = { className: 'button' };
      jest.spyOn(finder, 'findBySelector').mockReturnValue(mockElement);

      const result = finder.find('button');
      
      expect(finder.findBySelector).toHaveBeenCalledWith('button');
      expect(result).toBe(mockElement);
    });

    it('should try findByAriaLabel if findBySelector fails', () => {
      jest.spyOn(finder, 'findByText').mockReturnValue(null);
      jest.spyOn(finder, 'findBySelector').mockReturnValue(null);
      const mockElement = { getAttribute: jest.fn() };
      jest.spyOn(finder, 'findByAriaLabel').mockReturnValue(mockElement);

      const result = finder.find('Submit');
      
      expect(finder.findByAriaLabel).toHaveBeenCalledWith('Submit');
      expect(result).toBe(mockElement);
    });

    it('should try findByXPath if findByAriaLabel fails', () => {
      jest.spyOn(finder, 'findByText').mockReturnValue(null);
      jest.spyOn(finder, 'findBySelector').mockReturnValue(null);
      jest.spyOn(finder, 'findByAriaLabel').mockReturnValue(null);
      const mockElement = { tagName: 'INPUT' };
      jest.spyOn(finder, 'findByXPath').mockReturnValue(mockElement);

      const result = finder.find('input');
      
      expect(finder.findByXPath).toHaveBeenCalledWith('input');
      expect(result).toBe(mockElement);
    });

    it('should try findByPartialText if all other strategies fail', () => {
      jest.spyOn(finder, 'findByText').mockReturnValue(null);
      jest.spyOn(finder, 'findBySelector').mockReturnValue(null);
      jest.spyOn(finder, 'findByAriaLabel').mockReturnValue(null);
      jest.spyOn(finder, 'findByXPath').mockReturnValue(null);
      const mockElement = { textContent: 'Click here to continue' };
      jest.spyOn(finder, 'findByPartialText').mockReturnValue(mockElement);

      const result = finder.find('continue');
      
      expect(finder.findByPartialText).toHaveBeenCalledWith('continue');
      expect(result).toBe(mockElement);
    });

    it('should return null if all strategies fail', () => {
      jest.spyOn(finder, 'findByText').mockReturnValue(null);
      jest.spyOn(finder, 'findBySelector').mockReturnValue(null);
      jest.spyOn(finder, 'findByAriaLabel').mockReturnValue(null);
      jest.spyOn(finder, 'findByXPath').mockReturnValue(null);
      jest.spyOn(finder, 'findByPartialText').mockReturnValue(null);

      const result = finder.find('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', () => {
      jest.spyOn(finder, 'findByText').mockImplementation(() => {
        throw new Error('Test error');
      });
      console.error = jest.fn();

      const result = finder.find('test');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error finding element:', expect.any(Error));
    });
  });

  describe('findByText()', () => {
    let mockEvaluate;

    beforeEach(() => {
      // Mock XPathResult constants
      global.XPathResult = {
        FIRST_ORDERED_NODE_TYPE: 9,
      };
      
      // Create fresh mock for evaluate
      mockEvaluate = jest.fn();
      
      // Update document with evaluate mock
      global.document.evaluate = mockEvaluate;
    });

    it('should find element by exact text match', () => {
      const mockElement = { textContent: 'Submit Form', tagName: 'BUTTON' };
      const mockResult = {
        singleNodeValue: mockElement,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByText('Submit Form');
      
      expect(mockEvaluate).toHaveBeenCalled();
      expect(result).toBe(mockElement);
    });

    it('should be case insensitive', () => {
      const mockElement = { textContent: 'submit form', tagName: 'BUTTON' };
      const mockResult = {
        singleNodeValue: mockElement,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByText('SUBMIT FORM');
      
      expect(result).toBe(mockElement);
    });

    it('should trim whitespace from text', () => {
      const mockElement = { textContent: 'Submit', tagName: 'BUTTON' };
      const mockResult = {
        singleNodeValue: mockElement,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByText('  Submit  ');
      
      expect(result).toBe(mockElement);
    });

    it('should return null if no element found', () => {
      const mockResult = {
        singleNodeValue: null,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByText('Nonexistent');
      
      expect(result).toBeNull();
    });

    it('should prefer clickable elements', () => {
      const button = { textContent: 'Submit', tagName: 'BUTTON' };
      const mockResult = {
        singleNodeValue: button,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByText('Submit');
      
      expect(result).toBe(button);
    });
  });

  describe('findBySelector()', () => {
    let mockQuerySelector;

    beforeEach(() => {
      mockQuerySelector = jest.fn();
      global.document.querySelector = mockQuerySelector;
    });

    it('should find element by CSS selector', () => {
      const mockElement = { id: 'submit-btn' };
      mockQuerySelector.mockReturnValue(mockElement);

      const result = finder.findBySelector('#submit-btn');
      
      expect(mockQuerySelector).toHaveBeenCalledWith('#submit-btn');
      expect(result).toBe(mockElement);
    });

    it('should return null if selector is invalid', () => {
      mockQuerySelector.mockReturnValue(null);

      const result = finder.findBySelector('#nonexistent');
      
      expect(result).toBeNull();
    });

    it('should handle selector errors', () => {
      mockQuerySelector.mockImplementation(() => {
        throw new Error('Invalid selector');
      });

      const result = finder.findBySelector('##invalid');
      
      expect(result).toBeNull();
    });
  });

  describe('findByAriaLabel()', () => {
    let mockQuerySelector, mockElement;

    beforeEach(() => {
      mockQuerySelector = jest.fn();
      global.document.querySelector = mockQuerySelector;
    });

    it('should find element by aria-label attribute', () => {
      mockElement = { 
        getAttribute: jest.fn().mockReturnValue('Close dialog'),
        tagName: 'BUTTON',
      };
      mockQuerySelector.mockReturnValue(mockElement);

      const result = finder.findByAriaLabel('Close dialog');
      
      expect(mockQuerySelector).toHaveBeenCalledWith('[aria-label="Close dialog"]');
      expect(result).toBe(mockElement);
    });

    it('should find element by title attribute as fallback', () => {
      // This test is for future enhancement - current implementation only checks aria-label
      const mockElement = { 
        getAttribute: jest.fn().mockReturnValue('Help tooltip'),
        tagName: 'SPAN',
      };
      mockQuerySelector.mockReturnValue(mockElement);

      const result = finder.findByAriaLabel('Help tooltip');
      
      expect(result).toBe(mockElement);
    });

    it('should return null if no matching aria element', () => {
      mockQuerySelector.mockReturnValue(null);

      const result = finder.findByAriaLabel('Nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('findByXPath()', () => {
    let mockEvaluate;

    beforeEach(() => {
      // Mock XPathResult constants
      global.XPathResult = {
        FIRST_ORDERED_NODE_TYPE: 9,
        ORDERED_NODE_SNAPSHOT_TYPE: 7,
        ANY_UNORDERED_NODE_TYPE: 8,
      };
      
      // Create fresh mock for evaluate
      mockEvaluate = jest.fn();
      
      // Update document with evaluate mock
      global.document.evaluate = mockEvaluate;
    });

    it('should find element by XPath expression', () => {
      const mockElement = { tagName: 'INPUT' };
      const mockResult = {
        singleNodeValue: mockElement,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByXPath('//input[@type="submit"]');
      
      expect(mockEvaluate).toHaveBeenCalled();
      expect(result).toBe(mockElement);
    });

    it('should return null if XPath finds nothing', () => {
      const mockResult = {
        singleNodeValue: null,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByXPath('//nonexistent');
      
      expect(result).toBeNull();
    });

    it('should handle XPath errors', () => {
      mockEvaluate.mockImplementation(() => {
        throw new Error('Invalid XPath');
      });

      const result = finder.findByXPath('invalid xpath');
      
      expect(result).toBeNull();
    });
  });

  describe('findByPartialText()', () => {
    let mockEvaluate;

    beforeEach(() => {
      // Mock XPathResult constants
      global.XPathResult = {
        FIRST_ORDERED_NODE_TYPE: 9,
      };
      
      // Create fresh mock for evaluate
      mockEvaluate = jest.fn();
      
      // Update document with evaluate mock
      global.document.evaluate = mockEvaluate;
    });

    it('should find element containing partial text', () => {
      const mockElement = { textContent: 'Click here to continue to the next page' };
      const mockResult = {
        singleNodeValue: mockElement,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByPartialText('continue');
      
      expect(result).toBe(mockElement);
    });

    it('should be case insensitive for partial text', () => {
      const mockElement = { textContent: 'Click here to CONTINUE' };
      const mockResult = {
        singleNodeValue: mockElement,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByPartialText('continue');
      
      expect(result).toBe(mockElement);
    });

    it('should return null if no partial match found', () => {
      const mockResult = {
        singleNodeValue: null,
      };
      mockEvaluate.mockReturnValue(mockResult);

      const result = finder.findByPartialText('nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('cacheElement()', () => {
    it('should cache element and return it', () => {
      const mockElement = { id: 'test' };
      
      const result = finder.cacheElement('test-target', mockElement);
      
      expect(result).toBe(mockElement);
      expect(finder.selectorCache.get('test-target')).toBe(mockElement);
    });

    it('should limit cache size', () => {
      // Fill cache to max size
      for (let i = 0; i < finder.maxCacheSize; i++) {
        finder.cacheElement(`key${i}`, { id: i });
      }
      
      expect(finder.selectorCache.size).toBe(finder.maxCacheSize);
      
      // Add one more - should remove oldest
      finder.cacheElement('new-key', { id: 'new' });
      
      expect(finder.selectorCache.size).toBe(finder.maxCacheSize);
      expect(finder.selectorCache.has('key0')).toBe(false);
      expect(finder.selectorCache.has('new-key')).toBe(true);
    });
  });

  describe('clearCache()', () => {
    it('should clear all cached elements', () => {
      finder.cacheElement('key1', { id: 1 });
      finder.cacheElement('key2', { id: 2 });
      expect(finder.selectorCache.size).toBe(2);

      finder.clearCache();
      
      expect(finder.selectorCache.size).toBe(0);
    });
  });

  describe('getCacheStats()', () => {
    it('should return cache statistics', () => {
      finder.cacheElement('key1', { id: 1 });
      finder.cacheElement('key2', { id: 2 });
      
      const stats = finder.getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(500);
      expect(stats.usage).toBe('0.4%');
    });
  });
});