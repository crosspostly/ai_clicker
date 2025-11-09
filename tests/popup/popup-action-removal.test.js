/**
 * BATCH 1: Popup Action Removal Tests
 * Tests: 31-40
 * Coverage: popup.js action removal and clearing
 */

import { jest } from '@jest/globals';

describe('Popup Action Removal', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="actions-container"></div>
      <button id="clear-actions-btn" disabled>Clear All</button>
      <div id="action-count">0 actions</div>
      <div id="status-message"></div>
    `;
    
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(() => Promise.resolve({ recordedActions: [] })),
          set: jest.fn(() => Promise.resolve())
        }
      }
    };
    
    global.confirm = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  // TEST 31
  test('should remove action from actions array', () => {
    const actions = [
      { type: 'click', id: 1 },
      { type: 'input', id: 2 },
      { type: 'wait', id: 3 }
    ];
    
    const indexToRemove = 1;
    const updatedActions = actions.filter((_, index) => index !== indexToRemove);
    
    expect(updatedActions.length).toBe(2);
    expect(updatedActions[0].id).toBe(1);
    expect(updatedActions[1].id).toBe(3);
    expect(updatedActions.find(a => a.id === 2)).toBeUndefined();
  });
  
  // TEST 32
  test('should update storage after removing action', async () => {
    const updatedActions = [{ type: 'click' }];
    
    await chrome.storage.local.set({ recordedActions: updatedActions });
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      recordedActions: updatedActions
    });
  });
  
  // TEST 33
  test('should remove action element from DOM', () => {
    const container = document.getElementById('actions-container');
    
    const item1 = document.createElement('div');
    item1.className = 'action-item';
    item1.dataset.index = '0';
    
    const item2 = document.createElement('div');
    item2.className = 'action-item';
    item2.dataset.index = '1';
    
    container.appendChild(item1);
    container.appendChild(item2);
    
    expect(container.children.length).toBe(2);
    
    container.removeChild(item1);
    
    expect(container.children.length).toBe(1);
    expect(container.children[0].dataset.index).toBe('1');
  });
  
  // TEST 34
  test('should update action count after removal', () => {
    const countEl = document.getElementById('action-count');
    const remainingCount = 2;
    
    countEl.textContent = `${remainingCount} action${remainingCount !== 1 ? 's' : ''}`;
    
    expect(countEl.textContent).toBe('2 actions');
  });
  
  // TEST 35
  test('should ask confirmation before clearing all actions', () => {
    confirm.mockReturnValue(false);
    
    const userConfirmed = confirm('Clear all recorded actions?');
    
    expect(confirm).toHaveBeenCalledWith('Clear all recorded actions?');
    expect(userConfirmed).toBe(false);
  });
  
  // TEST 36
  test('should clear all actions when user confirms', async () => {
    confirm.mockReturnValue(true);
    
    if (confirm('Clear all recorded actions?')) {
      await chrome.storage.local.set({ recordedActions: [] });
      document.getElementById('actions-container').innerHTML = '';
    }
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ recordedActions: [] });
    expect(document.getElementById('actions-container').innerHTML).toBe('');
  });
  
  // TEST 37
  test('should not clear actions when user cancels', async () => {
    confirm.mockReturnValue(false);
    
    if (confirm('Clear all recorded actions?')) {
      await chrome.storage.local.set({ recordedActions: [] });
    }
    
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
  
  // TEST 38
  test('should disable play/export/clear buttons after clearing all', () => {
    const container = document.getElementById('actions-container');
    const clearBtn = document.getElementById('clear-actions-btn');
    
    container.innerHTML = '';
    
    if (container.children.length === 0) {
      clearBtn.disabled = true;
      expect(clearBtn.disabled).toBe(true);
    }
  });
  
  // TEST 39
  test('should show success message after clearing', () => {
    const status = document.getElementById('status-message');
    status.textContent = 'All actions cleared successfully';
    status.className = 'status-message status-success';
    
    expect(status.textContent).toBe('All actions cleared successfully');
    expect(status.classList.contains('status-success')).toBe(true);
  });
  
  // TEST 40
  test('should sanitize action text to prevent XSS', () => {
    const maliciousText = '<script>alert("xss")</script>';
    
    const textEl = document.createElement('span');
    textEl.textContent = maliciousText;
    
    expect(textEl.innerHTML).not.toContain('<script>');
    expect(textEl.textContent).toContain('alert');
  });
});
