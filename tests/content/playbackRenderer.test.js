/**
 * Tests for PlaybackRenderer
 */

import { jest } from '@jest/globals';
import { PlaybackRenderer } from '../../src/content/playbackRenderer.js';

// Mock DOM environment
document.body.innerHTML = `
  <div id="test-div">Test Content</div>
  <button id="test-button" class="btn">Click Me</button>
  <input id="test-input" type="text" value="" />
  <textarea id="test-textarea"></textarea>
  <select id="test-select">
    <option value="">Select...</option>
    <option value="option1">Option 1</option>
  </select>
  <div id="scroll-container" style="height: 200px; overflow: auto;">
    <div style="height: 1000px;">Scrollable content</div>
  </div>
`;

describe('PlaybackRenderer', () => {
  let renderer;

  beforeEach(() => {
    renderer = new PlaybackRenderer();
  });

  afterEach(() => {
    renderer.cleanup();
  });

  describe('Constructor', () => {
    test('should initialize correctly', () => {
      expect(renderer.highlights).toBeInstanceOf(Set);
      expect(renderer.originalStates).toBeInstanceOf(Map);
      expect(renderer.isInitialized).toBe(true);
    });

    test('should add styles to document', () => {
      const styleElement = document.getElementById('playback-renderer-styles');
      expect(styleElement).toBeTruthy();
      expect(styleElement.textContent).toContain('playback-highlight');
    });
  });

  describe('execute', () => {
    test('should execute click action', async () => {
      const button = document.getElementById('test-button');
      const clickSpy = jest.spyOn(button, 'click');
      
      const result = await renderer.execute({
        type: 'click',
        selector: '#test-button'
      });

      expect(result.success).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
    });

    test('should return error for non-existent element', async () => {
      const result = await renderer.execute({
        type: 'click',
        selector: '#non-existent'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Element not found');
    });

    test('should execute input action', async () => {
      const input = document.getElementById('test-input');
      
      const result = await renderer.execute({
        type: 'input',
        selector: '#test-input',
        value: 'test value'
      });

      expect(result.success).toBe(true);
      expect(input.value).toBe('test value');
    });

    test('should execute scroll action', async () => {
      const result = await renderer.execute({
        type: 'scroll',
        x: 0,
        y: 100
      });

      expect(result.success).toBe(true);
    });

    test('should execute hover action', async () => {
      const button = document.getElementById('test-button');
      const mouseEnterSpy = jest.spyOn(button, 'dispatchEvent');
      
      const result = await renderer.execute({
        type: 'hover',
        selector: '#test-button'
      });

      expect(result.success).toBe(true);
      expect(button.classList.contains('playback-hover')).toBe(true);
    });

    test('should execute double click action', async () => {
      const button = document.getElementById('test-button');
      const dblClickSpy = jest.spyOn(button, 'dispatchEvent');
      
      const result = await renderer.execute({
        type: 'double_click',
        selector: '#test-button'
      });

      expect(result.success).toBe(true);
    });

    test('should execute right click action', async () => {
      const button = document.getElementById('test-button');
      const contextMenuSpy = jest.spyOn(button, 'dispatchEvent');
      
      const result = await renderer.execute({
        type: 'right_click',
        selector: '#test-button'
      });

      expect(result.success).toBe(true);
    });

    test('should execute wait action', async () => {
      const startTime = Date.now();
      
      const result = await renderer.execute({
        type: 'wait',
        duration: 100
      });

      const endTime = Date.now();
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
    });

    test('should return error for unsupported action type', async () => {
      const result = await renderer.execute({
        type: 'unsupported',
        selector: '#test-button'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported action type');
    });
  });

  describe('highlight', () => {
    test('should highlight element', async () => {
      const button = document.getElementById('test-button');
      
      await renderer.highlight('#test-button', 100);
      
      expect(button.classList.contains('playback-highlight')).toBe(true);
      
      // Wait for highlight to be removed
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(button.classList.contains('playback-highlight')).toBe(false);
    });

    test('should not error for non-existent element', async () => {
      // Should not throw error
      await expect(renderer.highlight('#non-existent', 100))
        .resolves.toBeUndefined();
    });
  });

  describe('cleanup', () => {
    test('should remove all highlights', async () => {
      const button = document.getElementById('test-button');
      const div = document.getElementById('test-div');
      
      button.classList.add('playback-highlight');
      div.classList.add('playback-highlight');
      renderer.highlights.add(button);
      renderer.highlights.add(div);
      
      renderer.cleanup();
      
      expect(button.classList.contains('playback-highlight')).toBe(false);
      expect(div.classList.contains('playback-highlight')).toBe(false);
      expect(renderer.highlights.size).toBe(0);
    });

    test('should remove styles if no highlights', () => {
      const styleElement = document.getElementById('playback-renderer-styles');
      expect(styleElement).toBeTruthy();
      
      renderer.cleanup();
      
      // Style should be removed since no highlights exist
      expect(document.getElementById('playback-renderer-styles')).toBeNull();
    });
  });

  describe('_findElement', () => {
    test('should find element by CSS selector', async () => {
      const element = await renderer._findElement('#test-button');
      expect(element).toBeTruthy();
      expect(element.id).toBe('test-button');
    });

    test('should return null for non-existent element', async () => {
      const element = await renderer._findElement('#non-existent');
      expect(element).toBeNull();
    });
  });

  describe('_isElementVisible', () => {
    test('should detect visible element', () => {
      const button = document.getElementById('test-button');
      expect(renderer._isElementVisible(button)).toBe(true);
    });

    test('should detect hidden element', () => {
      const button = document.getElementById('test-button');
      button.style.display = 'none';
      expect(renderer._isElementVisible(button)).toBe(false);
      
      // Reset for other tests
      button.style.display = '';
    });
  });
});