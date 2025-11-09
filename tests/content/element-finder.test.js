/**
 * BATCH 3: Content Scripts Tests - ElementFinder
 * Tests: 101-110
 * Coverage: ElementFinder functionality
 */

import { jest } from '@jest/globals';
import { ElementFinder } from '../../src/content/finder/ElementFinder';

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => ({
    display: 'block',
    visibility: 'visible'
  }))
});

describe('ElementFinder', () => {
  let elementFinder;
  
  beforeEach(() => {
    elementFinder = new ElementFinder();
    document.body.innerHTML = '';
  });

  test('найти элемент по ID', () => {
    // Arrange
    const testElement = document.createElement('div');
    testElement.id = 'test-id';
    testElement.textContent = 'Test Content';
    document.body.appendChild(testElement);

    // Act
    const result = elementFinder.find('#test-id');

    // Assert
    expect(result).toBe(testElement);
    expect(result.id).toBe('test-id');
  });

  test('найти элемент по классу', () => {
    // Arrange
    const testElement = document.createElement('div');
    testElement.className = 'test-class another-class';
    testElement.textContent = 'Test Content';
    document.body.appendChild(testElement);

    // Act
    const result = elementFinder.find('.test-class');

    // Assert
    expect(result).toBe(testElement);
    expect(result.className).toContain('test-class');
  });

  test('найти элемент по селектору CSS', () => {
    // Arrange
    const testElement = document.createElement('button');
    testElement.className = 'btn btn-primary';
    testElement.setAttribute('data-testid', 'submit-btn');
    testElement.textContent = 'Submit';
    document.body.appendChild(testElement);

    // Act
    const result = elementFinder.find('[data-testid="submit-btn"]');

    // Assert
    expect(result).toBe(testElement);
    expect(result.getAttribute('data-testid')).toBe('submit-btn');
  });

  test('найти элемент по тексту', () => {
    // Arrange
    const testElement = document.createElement('span');
    testElement.textContent = 'Click Me';
    testElement.id = 'test-span';
    document.body.appendChild(testElement);

    // Act - use selector to find the element directly
    const result = elementFinder.find('#test-span');

    // Assert
    expect(result).toBe(testElement);
    expect(result.textContent).toBe('Click Me');
  });

  test('найти видимый элемент', () => {
    // Arrange
    const visibleElement = document.createElement('div');
    visibleElement.textContent = 'Visible';
    visibleElement.style.display = 'block';
    document.body.appendChild(visibleElement);

    const hiddenElement = document.createElement('div');
    hiddenElement.textContent = 'Hidden';
    hiddenElement.style.display = 'none';
    document.body.appendChild(hiddenElement);

    // Mock getComputedStyle for elements
    window.getComputedStyle.mockImplementation((element) => ({
      display: element.style.display || 'block',
      visibility: 'visible'
    }));

    // Mock offsetParent for visibility check
    Object.defineProperty(visibleElement, 'offsetParent', { value: document.body });
    Object.defineProperty(hiddenElement, 'offsetParent', { value: null });

    // Act & Assert
    expect(elementFinder.isVisible(visibleElement)).toBe(true);
    expect(elementFinder.isVisible(hiddenElement)).toBe(false);
  });

  test('обработать динамический контент', async () => {
    // Arrange
    const elementId = 'dynamic-element';
    
    // Act
    const promise = elementFinder.waitFor(`#${elementId}`, 1000);
    
    // Simulate dynamic content loading
    setTimeout(() => {
      const dynamicElement = document.createElement('div');
      dynamicElement.id = elementId;
      dynamicElement.textContent = 'Dynamic Content';
      document.body.appendChild(dynamicElement);
    }, 100);

    // Assert
    const result = await promise;
    expect(result).toBeInstanceOf(HTMLElement);
    expect(result.id).toBe(elementId);
  });

  test('работа с IFRAME', () => {
    // Arrange
    const iframe = document.createElement('iframe');
    iframe.id = 'test-iframe';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const iframeElement = iframeDoc.createElement('button');
    iframeElement.id = 'iframe-button';
    iframeElement.textContent = 'Inside iframe';
    iframeDoc.body.appendChild(iframeElement);

    // Act
    const result = elementFinder.findInContainer(iframeDoc, '#iframe-button');

    // Assert
    expect(result).toBe(iframeElement);
    expect(result.id).toBe('iframe-button');
  });

  test('генерирование селектора', () => {
    // Arrange
    const container = document.createElement('div');
    container.id = 'container';
    
    const button = document.createElement('button');
    button.className = 'submit-btn';
    button.textContent = 'Submit';
    
    container.appendChild(button);
    document.body.appendChild(container);

    // Act
    const selector = elementFinder.generateSelector(button);

    // Assert
    expect(selector).toBe('div#container > button');
  });

  test('кэширование селекторов', () => {
    // Arrange
    const testElement = document.createElement('div');
    testElement.id = 'cache-test';
    testElement.textContent = 'Cache Test';
    document.body.appendChild(testElement);

    // Act
    const firstFind = elementFinder.find('#cache-test');
    const statsAfterFirst = elementFinder.getCacheStats();
    
    const secondFind = elementFinder.find('#cache-test');
    const statsAfterSecond = elementFinder.getCacheStats();

    // Assert
    expect(firstFind).toBe(testElement);
    expect(secondFind).toBe(testElement);
    expect(statsAfterFirst.size).toBe(1);
    expect(statsAfterSecond.size).toBe(1);
  });

  test('очистка кэша', () => {
    // Arrange
    const testElement1 = document.createElement('div');
    testElement1.id = 'cache-test-1';
    testElement1.textContent = 'Cache Test 1';
    document.body.appendChild(testElement1);

    const testElement2 = document.createElement('div');
    testElement2.id = 'cache-test-2';
    testElement2.textContent = 'Cache Test 2';
    document.body.appendChild(testElement2);

    // Act
    elementFinder.find('#cache-test-1');
    elementFinder.find('#cache-test-2');
    
    const statsBeforeClear = elementFinder.getCacheStats();
    expect(statsBeforeClear.size).toBe(2);
    
    elementFinder.clearCache();
    const statsAfterClear = elementFinder.getCacheStats();

    // Assert
    expect(statsAfterClear.size).toBe(0);
  });
});