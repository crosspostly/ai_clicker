/**
 * Message Architecture Tests
 * Tests Popup ↔ Background ↔ Content relay, async handling, and error propagation
 */

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    getManifest: jest.fn().mockReturnValue({
      version: '3.0.0'
    })
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

describe('Message Architecture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Popup → Background → Content Relay', () => {
    test('should relay messages from popup to content script', async () => {
      // Mock tab query
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      // Mock content script response
      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: 'content response'
      });

      // Simulate popup sending message to background
      const popupMessage = {
        target: 'content',
        type: 'GET_ELEMENT_INFO',
        selector: '#test-button'
      };

      // Mock background message handler
      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content') {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                sendResponse(response);
              });
            } else {
              sendResponse({ error: 'No active tab' });
            }
          });
          return true; // Keep message channel open
        }
      };

      // Execute the relay
      const sendResponse = jest.fn();
      const result = backgroundHandler(popupMessage, {}, sendResponse);

      expect(result).toBe(true);
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      );
      
      // Wait for async response
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        popupMessage,
        expect.any(Function)
      );
      
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: 'content response'
      });
    });

    test('should handle content script errors and propagate to popup', async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      // Mock content script error
      chrome.tabs.sendMessage.mockImplementation((tabId, request, callback) => {
        chrome.runtime.lastError = { message: 'Content script not found' };
        if (callback) callback({ error: 'Content script not found' });
      });

      const popupMessage = {
        target: 'content',
        type: 'EXECUTE_ACTION',
        action: { type: 'click', selector: '#button' }
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content') {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                sendResponse(response);
              });
            } else {
              sendResponse({ error: 'No active tab' });
            }
          });
          return true;
        }
      };

      const sendResponse = jest.fn();
      backgroundHandler(popupMessage, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith({
        error: 'Content script not found'
      });
    });

    test('should handle multiple popup messages concurrently', async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      let responseCount = 0;
      chrome.tabs.sendMessage.mockImplementation((tabId, request, callback) => {
        setTimeout(() => {
          responseCount++;
          callback({ success: true, requestId: request.id, response: responseCount });
        }, Math.random() * 50);
      });

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content') {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                sendResponse(response);
              });
            }
          });
          return true;
        }
      };

      const messages = [
        { target: 'content', type: 'ACTION1', id: 1 },
        { target: 'content', type: 'ACTION2', id: 2 },
        { target: 'content', type: 'ACTION3', id: 3 }
      ];

      const responses = await Promise.all(
        messages.map(msg => 
          new Promise(resolve => {
            backgroundHandler(msg, {}, resolve);
          })
        )
      );

      expect(responses).toHaveLength(3);
      expect(responses.every(r => r.success)).toBe(true);
      expect(new Set(responses.map(r => r.responseId))).toHaveLength(3); // All unique
    });
  });

  describe('Content → Background → Popup Relay', () => {
    test('should relay messages from content to popup', async () => {
      // Mock popup response
      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: 'popup response'
      });

      const contentMessage = {
        target: 'popup',
        type: 'ACTION_COMPLETED',
        action: { type: 'click', selector: '#button' },
        result: { success: true }
      };

      // Mock background message handler
      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'popup') {
          chrome.runtime.sendMessage(request, (response) => {
            sendResponse(response);
          });
          return true;
        }
      };

      const sendResponse = jest.fn();
      const result = backgroundHandler(contentMessage, { tab: { id: 123 } }, sendResponse);

      expect(result).toBe(true);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        contentMessage,
        expect.any(Function)
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: 'popup response'
      });
    });

    test('should handle popup being closed gracefully', async () => {
      // Mock popup closed error
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        chrome.runtime.lastError = { message: 'Receiving end does not exist' };
        if (callback) callback();
      });

      const contentMessage = {
        target: 'popup',
        type: 'UPDATE_STATUS',
        status: 'running'
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'popup') {
          chrome.runtime.sendMessage(request, (response) => {
            sendResponse(response || { success: true }); // Default response
          });
          return true;
        }
      };

      const sendResponse = jest.fn();
      backgroundHandler(contentMessage, { tab: { id: 123 } }, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not throw error, should handle gracefully
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Async Message Handling', () => {
    test('should handle async responses correctly', async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      // Mock async content script response
      chrome.tabs.sendMessage.mockImplementation((tabId, request, callback) => {
        setTimeout(() => {
          callback({
            success: true,
            data: 'async response',
            processingTime: 100
          });
        }, 100);
      });

      const asyncMessage = {
        target: 'content',
        type: 'ASYNC_ACTION',
        action: { type: 'complex_operation' }
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content') {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                sendResponse(response);
              });
            }
          });
          return true; // Important for async
        }
      };

      const sendResponse = jest.fn();
      const startTime = Date.now();
      
      backgroundHandler(asyncMessage, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 150));
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: 'async response',
        processingTime: 100
      });
    });

    test('should timeout async responses', async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      // Mock slow content script that doesn't respond
      chrome.tabs.sendMessage.mockImplementation(() => {
        // Never calls callback
      });

      const timeoutMessage = {
        target: 'content',
        type: 'SLOW_ACTION',
        timeout: 50
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content') {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              const timeoutId = setTimeout(() => {
                sendResponse({ error: 'Request timeout' });
              }, request.timeout || 5000);

              chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                clearTimeout(timeoutId);
                sendResponse(response);
              });
            }
          });
          return true;
        }
      };

      const sendResponse = jest.fn();
      backgroundHandler(timeoutMessage, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 60));

      expect(sendResponse).toHaveBeenCalledWith({
        error: 'Request timeout'
      });
    });

    test('should handle Promise-based async responses', async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      // Mock Promise-based response
      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: 'promise response'
      });

      const promiseMessage = {
        target: 'content',
        type: 'PROMISE_ACTION'
      };

      const backgroundHandler = async (request, sender, sendResponse) => {
        if (request.target === 'content') {
          try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
              const response = await chrome.tabs.sendMessage(tabs[0].id, request);
              sendResponse(response);
            } else {
              sendResponse({ error: 'No active tab' });
            }
          } catch (error) {
            sendResponse({ error: error.message });
          }
        }
      };

      const sendResponse = jest.fn();
      await backgroundHandler(promiseMessage, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: 'promise response'
      });
    });
  });

  describe('Error Propagation', () => {
    test('should propagate Chrome API errors through the chain', async () => {
      // Mock Chrome API error
      chrome.runtime.lastError = { message: 'Permission denied' };
      chrome.tabs.sendMessage.mockImplementation((tabId, request, callback) => {
        if (callback) callback({ error: 'Permission denied' });
      });

      const errorMessage = {
        target: 'content',
        type: 'REQUIRE_PERMISSION',
        permission: 'tabs'
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content') {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                sendResponse(response);
              });
            } else {
              sendResponse({ error: 'No active tab' });
            }
          });
          return true;
        }
      };

      const sendResponse = jest.fn();
      backgroundHandler(errorMessage, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith({
        error: 'Permission denied'
      });
    });

    test('should add context to error messages', async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      chrome.tabs.sendMessage.mockImplementation((tabId, request, callback) => {
        callback({ error: 'Element not found' });
      });

      const actionMessage = {
        target: 'content',
        type: 'EXECUTE_ACTION',
        action: { type: 'click', selector: '#non-existent' }
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content') {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                if (response.error) {
                  // Add context
                  response.context = {
                    action: request.action,
                    tabId: tabs[0].id,
                    timestamp: Date.now()
                  };
                }
                sendResponse(response);
              });
            }
          });
          return true;
        }
      };

      const sendResponse = jest.fn();
      backgroundHandler(actionMessage, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Element not found',
          context: expect.objectContaining({
            action: { type: 'click', selector: '#non-existent' },
            tabId: 123,
            timestamp: expect.any(Number)
          })
        })
      );
    });

    test('should handle network errors in message passing', async () => {
      // Mock network error
      chrome.runtime.sendMessage.mockImplementation(() => {
        throw new Error('Network error');
      });

      const networkErrorMessage = {
        target: 'popup',
        type: 'NETWORK_INTENSIVE_ACTION'
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'popup') {
          try {
            chrome.runtime.sendMessage(request, (response) => {
              sendResponse(response);
            });
          } catch (error) {
            sendResponse({ 
              error: error.message,
              type: 'NETWORK_ERROR'
            });
          }
          return true;
        }
      };

      const sendResponse = jest.fn();
      backgroundHandler(networkErrorMessage, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith({
        error: 'Network error',
        type: 'NETWORK_ERROR'
      });
    });
  });

  describe('Message Validation and Security', () => {
    test('should validate message structure', async () => {
      const invalidMessage = {
        // Missing required fields
        type: 'TEST_ACTION'
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        // Validate message structure
        if (!request.target || !request.type) {
          sendResponse({
            error: 'Invalid message structure',
            required: ['target', 'type']
          });
          return false;
        }

        // Process valid message
        sendResponse({ success: true });
        return true;
      };

      const sendResponse = jest.fn();
      const result = backgroundHandler(invalidMessage, {}, sendResponse);

      expect(result).toBe(false);
      expect(sendResponse).toHaveBeenCalledWith({
        error: 'Invalid message structure',
        required: ['target', 'type']
      });
    });

    test('should sanitize message content', async () => {
      const maliciousMessage = {
        target: 'content',
        type: 'EXECUTE_SCRIPT',
        script: '<script>alert("xss")</script>',
        selector: '#button'
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content') {
          // Sanitize script content
          if (request.script) {
            request.script = request.script.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          }
          
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                sendResponse(response);
              });
            }
          });
          return true;
        }
      };

      const sendResponse = jest.fn();
      backgroundHandler(maliciousMessage, {}, sendResponse);

      // Verify script was sanitized
      expect(maliciousMessage.script).toBe('');
    });

    test('should limit message size', async () => {
      const largeMessage = {
        target: 'content',
        type: 'LARGE_DATA',
        data: 'x'.repeat(1000000) // 1MB of data
      };

      const backgroundHandler = (request, sender, sendResponse) => {
        const maxSize = 1024 * 1024; // 1MB limit
        const messageSize = JSON.stringify(request).length;

        if (messageSize > maxSize) {
          sendResponse({
            error: 'Message too large',
            size: messageSize,
            maxSize
          });
          return false;
        }

        sendResponse({ success: true });
        return true;
      };

      const sendResponse = jest.fn();
      const result = backgroundHandler(largeMessage, {}, sendResponse);

      expect(result).toBe(false);
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Message too large',
          size: expect.any(Number),
          maxSize: 1024 * 1024
        })
      );
    });
  });

  describe('Message Performance and Optimization', () => {
    test('should batch multiple messages when possible', async () => {
      const messages = [
        { target: 'content', type: 'ACTION1', data: 'data1' },
        { target: 'content', type: 'ACTION2', data: 'data2' },
        { target: 'content', type: 'ACTION3', data: 'data3' }
      ];

      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      let batchedMessages = [];
      chrome.tabs.sendMessage.mockImplementation((tabId, request, callback) => {
        if (request.batch) {
          batchedMessages = request.messages;
        } else {
          batchedMessages = [request];
        }
        callback({ success: true, batched: true });
      });

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content') {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              // Check if this is a batch request
              if (request.batch) {
                chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                  sendResponse(response);
                });
              } else {
                chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                  sendResponse(response);
                });
              }
            }
          });
          return true;
        }
      };

      // Test individual messages
      for (const message of messages) {
        const sendResponse = jest.fn();
        backgroundHandler(message, {}, sendResponse);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(batchedMessages).toHaveLength(1); // Individual messages

      // Test batched message
      const batchMessage = {
        target: 'content',
        type: 'BATCH_ACTIONS',
        batch: true,
        messages: messages
      };

      const sendResponse = jest.fn();
      backgroundHandler(batchMessage, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(batchedMessages).toHaveLength(3); // Batched messages
    });

    test('should cache responses for identical requests', async () => {
      const message = {
        target: 'content',
        type: 'GET_STATIC_INFO',
        cacheKey: 'page-info'
      };

      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      let callCount = 0;
      chrome.tabs.sendMessage.mockImplementation((tabId, request, callback) => {
        callCount++;
        setTimeout(() => {
          callback({ success: true, data: 'static info', callCount });
        }, 10);
      });

      const cache = new Map();

      const backgroundHandler = (request, sender, sendResponse) => {
        if (request.target === 'content' && request.cacheKey) {
          // Check cache first
          if (cache.has(request.cacheKey)) {
            sendResponse(cache.get(request.cacheKey));
            return true;
          }

          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
                // Cache the response
                cache.set(request.cacheKey, response);
                sendResponse(response);
              });
            }
          });
          return true;
        }
      };

      // First call
      const sendResponse1 = jest.fn();
      backgroundHandler(message, {}, sendResponse1);
      await new Promise(resolve => setTimeout(resolve, 20));

      // Second call (should use cache)
      const sendResponse2 = jest.fn();
      backgroundHandler(message, {}, sendResponse2);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(callCount).toBe(1); // Only one actual call
      expect(sendResponse1).toHaveBeenCalledWith(
        expect.objectContaining({ callCount: 1 })
      );
      expect(sendResponse2).toHaveBeenCalledWith(
        expect.objectContaining({ callCount: 1 })
      ); // Same response
    });
  });
});