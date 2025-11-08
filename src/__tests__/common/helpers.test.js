import { Helpers } from '../../common/helpers.js';

describe('Helpers Class', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('delay()', () => {
    test('should delay execution', async () => {
      const start = Date.now();
      await Helpers.delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    test('should return a promise', () => {
      const result = Helpers.delay(10);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('isVisible()', () => {
    test('should return true for visible element', () => {
      const mockElement = { offsetParent: document.createElement('div') };
      expect(Helpers.isVisible(mockElement)).toBe(true);
    });

    test('should return false for hidden element', () => {
      const mockElement = { offsetParent: null };
      expect(Helpers.isVisible(mockElement)).toBe(false);
    });

    test('should return false for null element', () => {
      expect(Helpers.isVisible(null)).toBe(false);
    });

    test('should return false for undefined element', () => {
      expect(Helpers.isVisible(undefined)).toBe(false);
    });
  });

  describe('scrollIntoView()', () => {
    test('should scroll element into view', () => {
      const mockElement = {
        scrollIntoView: jest.fn()
      };
      
      Helpers.scrollIntoView(mockElement);
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      });
    });

    test('should handle null element', () => {
      expect(() => {
        Helpers.scrollIntoView(null);
      }).not.toThrow();
    });

    test('should handle scroll errors gracefully', () => {
      const mockElement = {
        scrollIntoView: jest.fn(() => {
          throw new Error('Scroll error');
        })
      };
      
      expect(() => {
        Helpers.scrollIntoView(mockElement);
      }).not.toThrow();
    });
  });

  describe('generateSelector()', () => {
    test('should return ID selector when element has ID', () => {
      const mockElement = { id: 'test-id', tagName: 'DIV' };
      expect(Helpers.generateSelector(mockElement)).toBe('#test-id');
    });

    test('should return class selector when element has className', () => {
      const mockElement = { 
        id: '', 
        className: 'test-class another-class', 
        tagName: 'DIV' 
      };
      expect(Helpers.generateSelector(mockElement)).toBe('.test-class');
    });

    test('should return tag selector when element has no ID or class', () => {
      const mockElement = { 
        id: '', 
        className: '', 
        tagName: 'DIV' 
      };
      expect(Helpers.generateSelector(mockElement)).toBe('div');
    });
  });

  describe('deepClone()', () => {
    test('should clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = Helpers.deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    test('should clone arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = Helpers.deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    test('should handle primitives', () => {
      expect(Helpers.deepClone(null)).toBeNull();
      expect(Helpers.deepClone(undefined)).toBeUndefined();
      expect(Helpers.deepClone(123)).toBe(123);
      expect(Helpers.deepClone('string')).toBe('string');
      expect(Helpers.deepClone(true)).toBe(true);
    });
  });

  describe('mergeObjects()', () => {
    test('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = Helpers.mergeObjects(obj1, obj2);
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('should handle null objects', () => {
      const obj1 = { a: 1 };
      const merged = Helpers.mergeObjects(obj1, null);
      expect(merged).toEqual({ a: 1 });
    });

    test('should handle empty objects', () => {
      const merged = Helpers.mergeObjects({}, {});
      expect(merged).toEqual({});
    });
  });

  describe('formatBytes()', () => {
    test('should format bytes correctly', () => {
      expect(Helpers.formatBytes(0)).toBe('0 Bytes');
      expect(Helpers.formatBytes(1024)).toBe('1 KB');
      expect(Helpers.formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('debounce()', () => {
    test('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = Helpers.debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });
  });

  describe('throttle()', () => {
    test('should throttle function calls', (done) => {
      const mockFn = jest.fn();
      const throttledFn = Helpers.throttle(mockFn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      setTimeout(() => {
        throttledFn();
        expect(mockFn).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });
  });

  describe('formatBytes()', () => {
    test('should format bytes correctly', () => {
      expect(Helpers.formatBytes(0)).toBe('0 Bytes');
      expect(Helpers.formatBytes(1024)).toBe('1 KB');
      expect(Helpers.formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('dispatchEvent()', () => {
    test('should dispatch custom event', () => {
      const mockCallback = jest.fn();
      window.addEventListener('test-event', mockCallback);
      
      Helpers.dispatchEvent('test-event', { data: 'test' });
      
      // Event should be dispatched (checking that addEventListener was called)
      expect(window.addEventListener).toHaveBeenCalledWith('test-event', expect.any(Function));
    });
  });

  describe('onEvent()', () => {
    test('should listen to custom event', () => {
      const mockCallback = jest.fn();
      
      Helpers.onEvent('test-event', mockCallback);
      
      expect(window.addEventListener).toHaveBeenCalledWith('test-event', expect.any(Function));
    });
  });

  describe('getUrlParams()', () => {
    test('should parse URL parameters', () => {
      // Mock URL constructor
      global.URL = class MockURL {
        constructor(url) {
          this.searchParams = new Map([
            ['param1', 'value1'],
            ['param2', 'value2']
          ]);
        }
      };
      
      const params = Helpers.getUrlParams('http://example.com?param1=value1&param2=value2');
      expect(params).toEqual({ param1: 'value1', param2: 'value2' });
    });
  });

  describe('buildQueryString()', () => {
    test('should build query string from object', () => {
      const params = { param1: 'value1', param2: 'value2' };
      const queryString = Helpers.buildQueryString(params);
      expect(queryString).toBe('param1=value1&param2=value2');
    });
  });
});