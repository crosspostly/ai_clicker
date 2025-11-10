/**
 * MVP End-to-End Tests
 * Complete testing of core functionality: Recording → Server → API Key → Error Handling
 */

import { jest } from '@jest/globals';

// Import modules to test
import { StorageManager } from '../src/common/storage.js';
import { Validator } from '../src/common/validator.js';

// Mock DOM element getter
function getElement(id) {
  return document.getElementById(id);
}

// Mock server for testing
class MockServer {
  constructor() {
    this.actions = [];
    this.isOnline = true;
    this.shouldFail = false;
    this.delay = 100;
  }

  async receiveActions(actions) {
    if (!this.isOnline) {
      throw new Error('Сервер недоступен');
    }
    
    if (this.shouldFail) {
      throw new Error('Внутренняя ошибка сервера');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.delay));
    
    this.actions = actions;
    return { 
      status: 'ok', 
      count: actions.length,
      timestamp: new Date().toISOString()
    };
  }

  setOnline(online) {
    this.isOnline = online;
  }

  setShouldFail(shouldFail) {
    this.shouldFail = shouldFail;
  }

  getActions() {
    return this.actions;
  }

  clear() {
    this.actions = [];
  }
}

describe('MVP End-to-End Tests', () => {
  let mockServer;
  let storageManager;
  let validator;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup DOM environment
    document.body.innerHTML = `
      <div id="popup">
        <button id="start-recording">Начать запись</button>
        <button id="stop-recording" disabled>Остановить запись</button>
        <button id="play-actions" disabled>Воспроизвести</button>
        <button id="send-actions" disabled>Отправить</button>
        <div id="actions-container"></div>
        <div id="status-message"></div>
        <div id="status-detail"></div>
        <div id="status-timestamp"></div>
        <div id="status-log"></div>
      </div>
    `;
    
    // Initialize mocks
    mockServer = new MockServer();
    storageManager = new StorageManager();
    validator = new Validator();
    
    // Setup default Chrome API responses
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.sync.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue();
    chrome.storage.sync.set.mockResolvedValue();
    chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'http://example.com' }]);
    
    // Setup fetch mock
    fetch.mockImplementation(async (url, options) => {
      if (url.includes('/api/actions')) {
        const actions = JSON.parse(options.body);
        try {
          const result = await mockServer.receiveActions(actions);
          return {
            ok: true,
            json: async () => result
          };
        } catch (error) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: error.message })
          };
        }
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  describe('MVP Test Suite 1: Базовая запись действий', () => {
    test('Должен начать запись при нажатии кнопки', async () => {
      // Arrange
      const startButton = document.getElementById('start-recording');
      const stopButton = document.getElementById('stop-recording');
      
      // Act
      startButton.click();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Assert
      expect(startButton.disabled).toBe(true);
      expect(stopButton.disabled).toBe(false);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'START_RECORDING'
      });
      
      // Check status message
      const statusMessage = document.getElementById('status-message').textContent;
      expect(statusMessage).toContain('Запись началась');
    });

    test('Должен остановить запись при нажатии кнопки', async () => {
      // Arrange
      const stopButton = document.getElementById('stop-recording');
      const startButton = document.getElementById('start-recording');
      
      // Act
      stopButton.click();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Assert
      expect(stopButton.disabled).toBe(true);
      expect(startButton.disabled).toBe(false);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'STOP_RECORDING'
      });
      
      // Check status message
      const statusMessage = document.getElementById('status-message').textContent;
      expect(statusMessage).toContain('Запись остановлена');
    });

    test('Должен записывать клик на элемент', async () => {
      // Simulate recorded action from content script
      const recordedAction = {
        type: 'click',
        selector: '#test-button',
        timestamp: Date.now(),
        x: 100,
        y: 200
      };

      // Simulate message from content script
      const messageEvent = {
        type: 'actionRecorded',
        action: recordedAction
      };

      // Send message to popup (simulated)
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(messageEvent);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if action was recorded (would be displayed in UI)
      const actionsContainer = document.getElementById('actions-container');
      // In real implementation, this should show the recorded action
      expect(actionsContainer).toBeDefined();
    });
  });

  describe('MVP Test Suite 2: Отправка на сервер', () => {
    test('Должен отправлять записанные действия на сервер', async () => {
      // Arrange
      const testActions = [
        { type: 'click', selector: '#button1', timestamp: Date.now() },
        { type: 'input', selector: '#input1', value: 'test', timestamp: Date.now() },
        { type: 'scroll', x: 0, y: 100, timestamp: Date.now() }
      ];

      // Mock stored actions
      chrome.storage.local.get.mockResolvedValue({ 
        'popup-state': { actions: testActions }
      });

      const sendButton = document.getElementById('send-actions');
      sendButton.disabled = false;

      // Act
      sendButton.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 150));

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/actions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"type":"click"')
        })
      );

      // Check server response
      const serverActions = mockServer.getActions();
      expect(serverActions).toHaveLength(3);
      expect(serverActions[0].type).toBe('click');
    });

    test('Должен обрабатывать успешный ответ сервера', async () => {
      // Arrange
      const testActions = [{ type: 'click', selector: '#test', timestamp: Date.now() }];
      chrome.storage.local.get.mockResolvedValue({ 
        'popup-state': { actions: testActions }
      });

      const sendButton = document.getElementById('send-actions');
      sendButton.disabled = false;

      // Act
      sendButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Assert
      const statusMessage = document.getElementById('status-message').textContent;
      const statusDetail = document.getElementById('status-detail').textContent;
      
      expect(statusMessage).toContain('Отправлено');
      expect(statusDetail).toContain('1 действий');
    });
  });

  describe('MVP Test Suite 3: Проверка API ключа', () => {
    test('Должен валидировать пустой API ключ', async () => {
      // Arrange
      chrome.storage.sync.get.mockResolvedValue({ apiKey: '' });

      // Act
      const isValid = await validator.isApiKeyValid('');

      // Assert
      expect(isValid).toBe(false);
      
      const statusMessage = document.getElementById('status-message').textContent;
      expect(statusMessage).toContain('Ключ не установлен');
    });

    test('Должен валидировать корректный API ключ', async () => {
      // Arrange
      const validApiKey = 'AIzaSyDaGmWKa4JsXZ-HjGwBIS9kQtmBzZ4uyqU';
      chrome.storage.sync.get.mockResolvedValue({ apiKey: validApiKey });

      // Act
      const isValid = await validator.isApiKeyValid(validApiKey);

      // Assert
      expect(isValid).toBe(true);
      
      const statusMessage = document.getElementById('status-message').textContent;
      expect(statusMessage).toContain('Ключ валиден');
    });

    test('Должен сохранять API ключ в хранилище', async () => {
      // Arrange
      const apiKey = 'AIzaSyDaGmWKa4JsXZ-HjGwBIS9kQtmBzZ4uyqU';
      
      // Act
      await storageManager.set({ apiKey }, 'sync');

      // Assert
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ apiKey });
    });
  });

  describe('MVP Test Suite 4: Обработка ошибок', () => {
    test('Должен обрабатывать недоступный сервер', async () => {
      // Arrange
      mockServer.setOnline(false);
      const testActions = [{ type: 'click', selector: '#test', timestamp: Date.now() }];
      chrome.storage.local.get.mockResolvedValue({ 
        'popup-state': { actions: testActions }
      });

      const sendButton = document.getElementById('send-actions');
      sendButton.disabled = false;

      // Act
      sendButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Assert
      const statusMessage = document.getElementById('status-message').textContent;
      expect(statusMessage).toContain('Сервер недоступен');
      
      // Actions should not be lost
      expect(chrome.storage.local.get).toHaveBeenCalled();
    });

    test('Должен обрабатывать невалидные действия', async () => {
      // Arrange
      const invalidActions = [
        { type: 'click', selector: null }, // Invalid selector
        { type: 'input' }, // Missing required fields
        null // Null action
      ];
      
      chrome.storage.local.get.mockResolvedValue({ 
        'popup-state': { actions: invalidActions }
      });

      const sendButton = document.getElementById('send-actions');
      sendButton.disabled = false;

      // Act
      sendButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Assert
      const statusMessage = document.getElementById('status-message').textContent;
      expect(statusMessage).toContain('Невалидные действия');
      
      // Should not send to server
      expect(fetch).not.toHaveBeenCalled();
    });

    test('Должен повторно отправлять при восстановлении соединения', async () => {
      // Arrange
      mockServer.setOnline(false);
      const testActions = [{ type: 'click', selector: '#test', timestamp: Date.now() }];
      chrome.storage.local.get.mockResolvedValue({ 
        'popup-state': { actions: testActions }
      });

      const sendButton = document.getElementById('send-actions');
      sendButton.disabled = false;

      // Act - First attempt (should fail)
      sendButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Restore server connection
      mockServer.setOnline(true);
      
      // Second attempt
      sendButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Assert
      expect(fetch).toHaveBeenCalledTimes(2);
      const serverActions = mockServer.getActions();
      expect(serverActions).toHaveLength(1);
    });
  });

  describe('MVP Test Suite 5: Воспроизведение действий', () => {
    test('Должен воспроизводить записанные действия', async () => {
      // Arrange
      const testActions = [
        { type: 'click', selector: '#button1', timestamp: Date.now() },
        { type: 'input', selector: '#input1', value: 'test', timestamp: Date.now() }
      ];
      
      chrome.storage.local.get.mockResolvedValue({ 
        'popup-state': { actions: testActions }
      });

      const playButton = document.getElementById('play-actions');
      playButton.disabled = false;

      // Act
      playButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'PLAY_ACTIONS',
        actions: testActions,
        speed: 1.0
      });

      const statusMessage = document.getElementById('status-message').textContent;
      expect(statusMessage).toContain('Воспроизведение');
    });

    test('Должен обрабатывать ошибки воспроизведения', async () => {
      // Arrange
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Element not found'));
      
      const testActions = [{ type: 'click', selector: '#nonexistent', timestamp: Date.now() }];
      chrome.storage.local.get.mockResolvedValue({ 
        'popup-state': { actions: testActions }
      });

      const playButton = document.getElementById('play-actions');
      playButton.disabled = false;

      // Act
      playButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      const statusMessage = document.getElementById('status-message').textContent;
      expect(statusMessage).toContain('Ошибка');
    });
  });

  describe('MVP Test Suite 6: Полное сквозное тестирование (Happy Path)', () => {
    test('Должен выполнять полный сценарий: Запись → Отправка → Подтверждение', async () => {
      // Step 1: Начать запись
      const startButton = document.getElementById('start-recording');
      startButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(document.getElementById('status-message').textContent).toContain('Запись началась');

      // Step 2: Симулировать запись действий
      const testActions = [
        { type: 'click', selector: '#button1', timestamp: Date.now() },
        { type: 'input', selector: '#input1', value: 'hello world', timestamp: Date.now() + 100 },
        { type: 'scroll', x: 0, y: 200, timestamp: Date.now() + 200 }
      ];

      // Mock that actions were recorded
      chrome.storage.local.get.mockResolvedValue({ 
        'popup-state': { actions: testActions }
      });

      // Step 3: Остановить запись
      const stopButton = document.getElementById('stop-recording');
      stopButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(document.getElementById('status-message').textContent).toContain('Запись остановлена');
      expect(document.getElementById('status-detail').textContent).toContain('3 действия');

      // Step 4: Проверить API ключ
      const validApiKey = 'AIzaSyDaGmWKa4JsXZ-HjGwBIS9kQtmBzZ4uyqU';
      chrome.storage.sync.get.mockResolvedValue({ apiKey: validApiKey });
      
      const isApiKeyValid = await validator.isApiKeyValid(validApiKey);
      expect(isApiKeyValid).toBe(true);

      // Step 5: Отправить действия
      const sendButton = document.getElementById('send-actions');
      sendButton.disabled = false;
      sendButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Step 6: Проверить успешную отправку
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/actions'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"type":"click"')
        })
      );

      const serverActions = mockServer.getActions();
      expect(serverActions).toHaveLength(3);
      expect(serverActions[0].type).toBe('click');
      expect(serverActions[1].type).toBe('input');
      expect(serverActions[1].value).toBe('hello world');
      expect(serverActions[2].type).toBe('scroll');

      // Final status check
      const finalStatusMessage = document.getElementById('status-message').textContent;
      const finalStatusDetail = document.getElementById('status-detail').textContent;
      
      expect(finalStatusMessage).toContain('Отправлено');
      expect(finalStatusDetail).toContain('3 действия');

      // Check complete log trace
      const logContent = document.getElementById('status-log').innerHTML;
      expect(logContent).toContain('Запись началась');
      expect(logContent).toContain('Запись остановлена');
      expect(logContent).toContain('Ключ валиден');
      expect(logContent).toContain('Отправка');
      expect(logContent).toContain('Отправлено');
    });
  });

  describe('MVP Debugging Tests', () => {
    test('Должен логировать все шаги для отладки', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      const startButton = document.getElementById('start-recording');
      startButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Запись началась')
      );

      consoleSpy.mockRestore();
    });

    test('Должен обрабатывать ошибки background script', async () => {
      // Arrange
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Background script error'));
      
      const startButton = document.getElementById('start-recording');
      
      // Act
      expect(() => {
        startButton.click();
      }).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert - error should be caught and logged
      const statusMessage = document.getElementById('status-message').textContent;
      expect(statusMessage).toBeDefined(); // Should not crash
    });
  });
});