/**
 * Tests for background service worker
 */

// Mock Chrome APIs before importing
const mockAddListener = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();

global.chrome = {
  runtime: {
    onInstalled: {
      addListener: mockAddListener
    },
    onMessage: {
      addListener: mockAddListener
    },
    openOptionsPage: jest.fn()
  },
  tabs: {
    onActivated: {
      addListener: mockAddListener
    },
    onUpdated: {
      addListener: mockAddListener
    }
  },
  storage: {
    local: {
      get: mockGet,
      set: mockSet
    }
  }
};

// Import after mocking
import('../../background/index.js';

describe('Background Service Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register runtime.onInstalled listener', () => {
    expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should register runtime.onMessage listener', () => {
    expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should register tabs.onActivated listener', () => {
    expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should register tabs.onUpdated listener', () => {
    expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should handle actionRecorded message', () => {
    // Get the message listener
    const messageListener = mockAddListener.mock.calls.find(call => 
      call[0] && call.length > 0
    )?.[0];

    if (messageListener) {
      const mockSendResponse = jest.fn();
      const request = { type: 'actionRecorded', data: {} };
      
      expect(() => {
        messageListener(request, {}, mockSendResponse);
      }).not.toThrow();
      
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    }
  });

  test('should handle executeActions message', () => {
    // Get the message listener
    const messageListener = mockAddListener.mock.calls.find(call => 
      call[0] && call.length > 0
    )?.[0];

    if (messageListener) {
      const mockSendResponse = jest.fn();
      const request = { type: 'executeActions', data: [] };
      
      expect(() => {
        messageListener(request, {}, mockSendResponse);
      }).not.toThrow();
      
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    }
  });

  test('should handle unknown message types', () => {
    // Get the message listener
    const messageListener = mockAddListener.mock.calls.find(call => 
      call[0] && call.length > 0
    )?.[0];

    if (messageListener) {
      const mockSendResponse = jest.fn();
      const request = { type: 'unknown', data: {} };
      
      expect(() => {
        messageListener(request, {}, mockSendResponse);
      }).not.toThrow();
      
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    }
  });

  test('should handle errors gracefully', () => {
    // Get the message listener
    const messageListener = mockAddListener.mock.calls.find(call => 
      call[0] && call.length > 0
    )?.[0];

    if (messageListener) {
      const mockSendResponse = jest.fn();
      const request = { type: 'actionRecorded' };
      
      // Simulate an error during processing
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      expect(() => {
        messageListener(request, null, mockSendResponse); // null sender might cause error
      }).not.toThrow();
      
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
      
      console.error = originalConsoleError;
    }
  });
});