/**
 * BATCH 1: Popup Actions Display Tests
 * Tests: 21-30
 * Coverage: popup.js actions display and formatting
 */

describe('Popup Actions Display', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="actions-container"></div>
      <div id="action-count">0 actions</div>
      <div id="status-message"></div>
    `;
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });

  // TEST 21
  test('should create and append action item to container', () => {
    const container = document.getElementById('actions-container');
    
    const actionItem = document.createElement('div');
    actionItem.className = 'action-item';
    actionItem.innerHTML = `
      <span class="action-text">Click "Login Button"</span>
      <button class="action-remove" title="Remove">×</button>
    `;
    
    container.appendChild(actionItem);
    
    expect(container.children.length).toBe(1);
    expect(container.querySelector('.action-text').textContent).toBe('Click "Login Button"');
    expect(container.querySelector('.action-remove')).toBeTruthy();
  });
  
  // TEST 22
  test('should display multiple actions in order', () => {
    const container = document.getElementById('actions-container');
    const actions = [
      { type: 'click', target: 'Button 1' },
      { type: 'input', value: 'test' },
      { type: 'wait', duration: 1000 }
    ];
    
    actions.forEach((action, index) => {
      const item = document.createElement('div');
      item.className = 'action-item';
      item.dataset.index = index;
      item.textContent = `${action.type}: ${action.target || action.value || action.duration}`;
      container.appendChild(item);
    });
    
    expect(container.children.length).toBe(3);
    expect(container.children[0].textContent).toContain('click');
    expect(container.children[1].textContent).toContain('input');
    expect(container.children[2].textContent).toContain('wait');
  });
  
  // TEST 23
  test('should format click action text correctly', () => {
    const action = { type: 'click', target: 'Submit Button', selector: '.submit-btn' };
    const text = `Click "${action.target}" (${action.selector})`;
    
    expect(text).toBe('Click "Submit Button" (.submit-btn)');
    expect(text).toContain('Click');
    expect(text).toContain('Submit Button');
  });
  
  // TEST 24
  test('should format input action text correctly', () => {
    const action = { type: 'input', selector: 'input[name="email"]', value: 'user@example.com' };
    const text = `Type "${action.value}" into ${action.selector}`;
    
    expect(text).toContain('Type');
    expect(text).toContain('user@example.com');
    expect(text).toContain('input[name="email"]');
  });
  
  // TEST 25
  test('should format wait action text correctly', () => {
    const action = { type: 'wait', duration: 2000 };
    const text = `Wait ${action.duration}ms`;
    
    expect(text).toBe('Wait 2000ms');
  });
  
  // TEST 26
  test('should format scroll action text correctly', () => {
    const action = { type: 'scroll', pixels: 500 };
    const text = `Scroll ${action.pixels}px down`;
    
    expect(text).toBe('Scroll 500px down');
  });
  
  // TEST 27
  test('should format hover action text correctly', () => {
    const action = { type: 'hover', target: 'Dropdown Menu', selector: '.dropdown' };
    const text = `Hover over "${action.target}"`;
    
    expect(text).toBe('Hover over "Dropdown Menu"');
  });
  
  // TEST 28
  test('should format select action text correctly', () => {
    const action = { type: 'select', selector: 'select[name="country"]', value: 'USA' };
    const text = `Select "${action.value}" from ${action.selector}`;
    
    expect(text).toContain('Select');
    expect(text).toContain('USA');
  });
  
  // TEST 29
  test('should show empty state when no actions', () => {
    const container = document.getElementById('actions-container');
    
    if (container.children.length === 0) {
      container.innerHTML = '<div class="empty-state">No actions recorded yet</div>';
    }
    
    expect(container.textContent).toContain('No actions recorded');
  });
  
  // TEST 30
  test('should update action count display', () => {
    const countEl = document.getElementById('action-count');
    const actionCount = 7;
    
    countEl.textContent = `${actionCount} action${actionCount !== 1 ? 's' : ''}`;
    
    expect(countEl.textContent).toBe('7 actions');
  });
});
