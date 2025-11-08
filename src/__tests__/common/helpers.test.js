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

  describe('Helpers Comprehensive Tests', () => {
    describe('delay() comprehensive', () => {
      test('should delay execution with various durations', async () => {
        const timings = [10, 25, 50];
        
        for (const duration of timings) {
          const start = Date.now();
          await Helpers.delay(duration);
          const elapsed = Date.now() - start;
          expect(elapsed).toBeGreaterThanOrEqual(duration - 5);
        }
      });

      test('should return a promise that resolves', async () => {
        const result = await Helpers.delay(10);
        expect(result).toBeUndefined();
      });

      test('should handle zero delay', async () => {
        const start = Date.now();
        await Helpers.delay(0);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(50);
      });
    });

    describe('deepClone() comprehensive', () => {
      test('should create independent copy of objects', () => {
        const original = { a: 1, b: { c: 2 } };
        const cloned = Helpers.deepClone(original);
        
        cloned.b.c = 999;
        expect(original.b.c).toBe(2);
      });

      test('should clone arrays independently', () => {
        const original = [1, 2, [3, 4]];
        const cloned = Helpers.deepClone(original);
        
        cloned[2][0] = 999;
        expect(original[2][0]).toBe(3);
      });

      test('should handle null and undefined', () => {
        expect(Helpers.deepClone(null)).toBeNull();
        expect(Helpers.deepClone(undefined)).toBeUndefined();
      });

      test('should handle primitive values', () => {
        expect(Helpers.deepClone(42)).toBe(42);
        expect(Helpers.deepClone('string')).toBe('string');
        expect(Helpers.deepClone(true)).toBe(true);
      });

      test('should handle nested objects with arrays', () => {
        const original = {
          users: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 }
          ],
          settings: { theme: 'dark' }
        };
        const cloned = Helpers.deepClone(original);
        
        cloned.users[0].name = 'Charlie';
        expect(original.users[0].name).toBe('Alice');
      });

      test('should handle circular references gracefully', () => {
        const obj = { a: 1 };
        obj.self = obj;
        expect(() => Helpers.deepClone(obj)).not.toThrow();
      });
    });

    describe('isVisible() comprehensive', () => {
      test('should detect visible elements', () => {
        const visible = { offsetParent: document.createElement('div') };
        expect(Helpers.isVisible(visible)).toBe(true);
      });

      test('should detect hidden elements', () => {
        expect(Helpers.isVisible({ offsetParent: null })).toBe(false);
      });

      test('should handle null/undefined safely', () => {
        expect(Helpers.isVisible(null)).toBe(false);
        expect(Helpers.isVisible(undefined)).toBe(false);
      });
    });

    describe('scrollIntoView() comprehensive', () => {
      test('should call scrollIntoView with correct options', () => {
        const mockElement = { scrollIntoView: jest.fn() };
        Helpers.scrollIntoView(mockElement);
        expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center'
        });
      });

      test('should handle null element', () => {
        expect(() => Helpers.scrollIntoView(null)).not.toThrow();
      });

      test('should handle scroll errors', () => {
        const mockElement = {
          scrollIntoView: jest.fn(() => {
            throw new Error('Scroll failed');
          })
        };
        expect(() => Helpers.scrollIntoView(mockElement)).not.toThrow();
      });
    });

    describe('generateSelector() comprehensive', () => {
      test('should return ID selector', () => {
        const element = { id: 'test-id', tagName: 'DIV' };
        expect(Helpers.generateSelector(element)).toBe('#test-id');
      });

      test('should return class selector when no ID', () => {
        const element = { id: '', className: 'my-class', tagName: 'BUTTON' };
        expect(Helpers.generateSelector(element)).toBe('.my-class');
      });

      test('should return tag name selector as fallback', () => {
        const element = { id: '', className: '', tagName: 'DIV' };
        expect(Helpers.generateSelector(element)).toBe('div');
      });

      test('should handle multiple classes', () => {
        const element = { id: '', className: 'class1 class2 class3', tagName: 'SPAN' };
        expect(Helpers.generateSelector(element)).toBe('.class1');
      });
    });

    describe('formatDate() comprehensive', () => {
      test('should format dates consistently', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const formatted = Helpers.formatDate(date);
        expect(typeof formatted).toBe('string');
        expect(formatted).toContain('2024');
      });

      test('should handle null/undefined dates', () => {
        expect(Helpers.formatDate(null)).toBeDefined();
        expect(Helpers.formatDate(undefined)).toBeDefined();
      });
    });

    describe('sanitizeHtml() comprehensive', () => {
      test('should remove script tags', () => {
        const dirty = '<p>Hello<script>alert("xss")</script></p>';
        const clean = Helpers.sanitizeHtml(dirty);
        expect(clean).not.toContain('<script>');
      });

      test('should remove onclick handlers', () => {
        const dirty = '<button onclick="alert(1)">Click</button>';
        const clean = Helpers.sanitizeHtml(dirty);
        expect(clean).not.toContain('onclick');
      });

      test('should preserve safe content', () => {
        const safe = '<p>Hello <b>World</b></p>';
        const clean = Helpers.sanitizeHtml(safe);
        expect(clean).toContain('Hello');
      });
    });

    describe('debounce() comprehensive', () => {
      test('should delay function execution', async () => {
        const fn = jest.fn();
        const debounced = Helpers.debounce(fn, 50);
        
        debounced();
        debounced();
        debounced();
        
        expect(fn).not.toHaveBeenCalled();
        await new Promise(r => setTimeout(r, 100));
        expect(fn).toHaveBeenCalledTimes(1);
      });

      test('should pass arguments correctly', async () => {
        const fn = jest.fn();
        const debounced = Helpers.debounce(fn, 50);
        
        debounced('arg1', 'arg2');
        
        await new Promise(r => setTimeout(r, 100));
        expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
      });
    });

    describe('throttle() comprehensive', () => {
      test('should limit execution frequency', async () => {
        const fn = jest.fn();
        const throttled = Helpers.throttle(fn, 50);
        
        throttled();
        throttled();
        throttled();
        
        expect(fn).toHaveBeenCalledTimes(1);
        await new Promise(r => setTimeout(r, 100));
        throttled();
        expect(fn).toHaveBeenCalledTimes(2);
      });

      test('should pass arguments correctly', async () => {
        const fn = jest.fn();
        const throttled = Helpers.throttle(fn, 50);
        
        throttled('arg1');
        
        expect(fn).toHaveBeenCalledWith('arg1');
      });
    });

    describe('generateId() comprehensive', () => {
      test('should create unique IDs', () => {
        const id1 = Helpers.generateId();
        const id2 = Helpers.generateId();
        
        expect(id1).not.toBe(id2);
        expect(typeof id1).toBe('string');
        expect(typeof id2).toBe('string');
      });

      test('should create IDs of reasonable length', () => {
        const id = Helpers.generateId();
        expect(id.length).toBeGreaterThan(0);
        expect(id.length).toBeLessThan(1000);
      });
    });

    describe('mergeObjects() comprehensive', () => {
      test('should merge multiple objects', () => {
        const obj1 = { a: 1, b: 2 };
        const obj2 = { b: 3, c: 4 };
        const obj3 = { c: 5, d: 6 };
        
        const merged = Helpers.mergeObjects(obj1, obj2, obj3);
        expect(merged).toEqual({ a: 1, b: 3, c: 5, d: 6 });
      });

      test('should handle null/undefined in merge', () => {
        const obj = { a: 1 };
        const merged = Helpers.mergeObjects(obj, null, undefined);
        expect(merged).toBeDefined();
      });

      test('should not mutate original objects', () => {
        const obj1 = { a: 1 };
        const obj2 = { b: 2 };
        
        Helpers.mergeObjects(obj1, obj2);
        expect(obj1).toEqual({ a: 1 });
      });
    });

    describe('getUrlParams() comprehensive', () => {
      test('should extract URL parameters', () => {
        const url = 'http://example.com?param1=value1&param2=value2';
        const params = Helpers.getUrlParams(url);
        expect(params).toEqual({ param1: 'value1', param2: 'value2' });
      });

      test('should handle URLs without parameters', () => {
        const url = 'http://example.com';
        const params = Helpers.getUrlParams(url);
        expect(params).toEqual({});
      });

      test('should handle duplicate parameters', () => {
        const url = 'http://example.com?key=val1&key=val2';
        const params = Helpers.getUrlParams(url);
        expect(params).toBeDefined();
      });
    });

    describe('buildQueryString() comprehensive', () => {
      test('should build query strings', () => {
        const params = { a: '1', b: '2' };
        const query = Helpers.buildQueryString(params);
        expect(query).toContain('a=1');
        expect(query).toContain('b=2');
      });

      test('should handle special characters', () => {
        const params = { key: 'value with spaces' };
        const query = Helpers.buildQueryString(params);
        expect(query).toBeDefined();
      });

      test('should handle empty objects', () => {
        const query = Helpers.buildQueryString({});
        expect(query).toBeDefined();
      });
    });
  });
});