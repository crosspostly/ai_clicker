/**
 * BATCH 3: Content Scripts Tests - ActionExecutor
 * Tests: 111-120
 * Coverage: ActionExecutor functionality
 */

import { jest } from '@jest/globals';
import { ActionExecutor, ExecutionError } from '../../src/content/executor/ActionExecutor';
import { ElementFinder } from '../../src/content/finder/ElementFinder';

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => ({
    display: 'block',
    visibility: 'visible'
  }))
});

describe('ActionExecutor', () => {
  let actionExecutor;
  let elementFinder;
  let mockElement;

  beforeEach(() => {
    elementFinder = new ElementFinder();
    actionExecutor = new ActionExecutor(elementFinder);
    
    document.body.innerHTML = '';
    
    // Create mock element for testing
    mockElement = document.createElement('button');
    mockElement.id = 'test-button';
    mockElement.textContent = 'Test Button';
    document.body.appendChild(mockElement);
    
    // Mock scroll behavior
    window.scrollBy = jest.fn();
  });

  test('выполнить клик', async () => {
    // Arrange
    const clickAction = {
      type: 'click',
      target: '#test-button'
    };
    
    const clickSpy = jest.spyOn(mockElement, 'click');

    // Act
    await actionExecutor.executeAction(clickAction);

    // Assert
    expect(clickSpy).toHaveBeenCalled();
  });

  test('выполнить ввод текста', async () => {
    // Arrange
    const inputElement = document.createElement('input');
    inputElement.id = 'test-input';
    inputElement.type = 'text';
    document.body.appendChild(inputElement);
    
    const inputAction = {
      type: 'input',
      target: '#test-input',
      value: 'Test Text Input'
    };

    // Act
    await actionExecutor.executeAction(inputAction);

    // Assert
    expect(inputElement.value).toBe('Test Text Input');
  });

  test('выполнить скролл', async () => {
    // Arrange
    const scrollAction = {
      type: 'scroll',
      pixels: 300
    };

    // Act
    await actionExecutor.executeAction(scrollAction);

    // Assert
    expect(window.scrollBy).toHaveBeenCalledWith({ top: 300, behavior: 'smooth' });
  });

  test('выполнить двойной клик', async () => {
    // Arrange
    const doubleClickAction = {
      type: 'double_click',
      target: '#test-button'
    };
    
    const dispatchEventSpy = jest.spyOn(mockElement, 'dispatchEvent');

    // Act
    await actionExecutor.executeAction(doubleClickAction);

    // Assert
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dblclick',
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
  });

  test('выполнить правый клик', async () => {
    // Arrange
    const rightClickAction = {
      type: 'right_click',
      target: '#test-button'
    };
    
    const dispatchEventSpy = jest.spyOn(mockElement, 'dispatchEvent');

    // Act
    await actionExecutor.executeAction(rightClickAction);

    // Assert
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'contextmenu',
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
  });

  test('обработка ошибок при выполнении', async () => {
    // Arrange
    const invalidAction = {
      type: 'click',
      target: '#non-existent-element'
    };

    // Act & Assert
    await expect(actionExecutor.executeAction(invalidAction)).rejects.toThrow(ExecutionError);
  });

  test('очистка после выполнения', async () => {
    // Arrange
    const inputElement = document.createElement('input');
    inputElement.id = 'cleanup-input';
    inputElement.type = 'text';
    inputElement.value = 'Initial Value';
    document.body.appendChild(inputElement);
    
    const inputAction = {
      type: 'input',
      target: '#cleanup-input',
      value: 'New Value'
    };

    // Act
    await actionExecutor.executeAction(inputAction);

    // Assert - element should be properly cleaned up and contain new value
    expect(inputElement.value).toBe('New Value');
  });

  test('последовательное выполнение', async () => {
    // Arrange
    const inputElement = document.createElement('input');
    inputElement.id = 'sequence-input';
    inputElement.type = 'text';
    document.body.appendChild(inputElement);
    
    const actions = [
      { type: 'input', target: '#sequence-input', value: 'Hello' },
      { type: 'wait', duration: 100 },
      { type: 'input', target: '#sequence-input', value: 'Hello World' }
    ];

    // Act
    await actionExecutor.executeSequence(actions);

    // Assert
    expect(inputElement.value).toBe('Hello World');
  });

  test('отмена выполнения', async () => {
    // Arrange
    const actions = [
      { type: 'wait', duration: 1000 },
      { type: 'wait', duration: 1000 },
      { type: 'wait', duration: 1000 }
    ];
    
    let sequenceCompleted = false;
    actionExecutor.on('sequence-completed', () => {
      sequenceCompleted = true;
    });

    // Act
    const sequencePromise = actionExecutor.executeSequence(actions);
    
    // Stop after a short delay
    setTimeout(() => {
      actionExecutor.stop();
    }, 200);

    // Wait for sequence to be stopped
    await new Promise(resolve => setTimeout(resolve, 300));

    // Assert
    expect(sequenceCompleted).toBe(false);
    expect(actionExecutor.isRunning).toBe(false);
  });

  test('логирование операций', async () => {
    // Arrange
    const clickAction = {
      type: 'click',
      target: '#test-button'
    };
    
    const events = [];
    
    actionExecutor.on('action-started', (data) => {
      events.push({ type: 'action-started', data });
    });
    
    actionExecutor.on('action-completed', (data) => {
      events.push({ type: 'action-completed', data });
    });

    // Act
    await actionExecutor.executeAction(clickAction);

    // Assert - Check that we have at least the completion event
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[events.length - 1].type).toBe('action-completed');
    expect(events[events.length - 1].data.action).toBe(clickAction);
    expect(events[events.length - 1].data.status).toBe('success');
  });
});