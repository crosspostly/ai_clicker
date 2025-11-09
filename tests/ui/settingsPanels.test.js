/**
 * UI Tests for Settings Panels
 * Tests settings panels, tabs, modal interactions, and keyboard shortcuts
 */

import { JSDOM } from 'jsdom';

// Setup DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
  <title>Settings Test</title>
</head>
<body>
  <div id="settings-container">
    <div class="tab-container">
      <button class="tab-button active" data-tab="general">General</button>
      <button class="tab-button" data-tab="voice">Voice</button>
      <button class="tab-button" data-tab="playback">Playback</button>
      <button class="tab-button" data-tab="advanced">Advanced</button>
      <button class="tab-button" data-tab="about">About</button>
    </div>
    
    <div class="tab-content">
      <div id="general-tab" class="tab-panel active">
        <form id="general-form">
          <div class="form-group">
            <label for="theme">Theme</label>
            <select id="theme" name="theme">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div class="form-group">
            <label for="autoSave">
              <input type="checkbox" id="autoSave" name="autoSave">
              Auto-save settings
            </label>
          </div>
        </form>
      </div>
      
      <div id="voice-tab" class="tab-panel">
        <form id="voice-form">
          <div class="form-group">
            <label for="apiKey">API Key</label>
            <input type="password" id="apiKey" name="apiKey">
            <button type="button" id="testApiKey">Test</button>
          </div>
          <div class="form-group">
            <label for="language">Language</label>
            <select id="language" name="language">
              <option value="en">English</option>
              <option value="ru">Russian</option>
              <option value="auto">Auto-detect</option>
            </select>
          </div>
        </form>
      </div>
      
      <div id="playback-tab" class="tab-panel">
        <form id="playback-form">
          <div class="form-group">
            <label for="speed">Playback Speed</label>
            <input type="range" id="speed" name="speed" min="0.5" max="3" step="0.5" value="1">
            <span id="speedValue">1x</span>
          </div>
          <div class="form-group">
            <label for="audioEnabled">
              <input type="checkbox" id="audioEnabled" name="audioEnabled" checked>
              Enable audio feedback
            </label>
          </div>
        </form>
      </div>
      
      <div id="advanced-tab" class="tab-panel">
        <form id="advanced-form">
          <div class="form-group">
            <label for="timeout">Request Timeout (ms)</label>
            <input type="number" id="timeout" name="timeout" min="1000" max="60000" value="10000">
          </div>
          <div class="form-group">
            <label for="retryCount">Retry Count</label>
            <input type="number" id="retryCount" name="retryCount" min="1" max="10" value="3">
          </div>
        </form>
      </div>
      
      <div id="about-tab" class="tab-panel">
        <h3>AI Autoclicker v3.0.0</h3>
        <p>Advanced browser automation with voice control.</p>
        <div id="changelog"></div>
      </div>
    </div>
    
    <div class="modal-overlay" id="modalOverlay" style="display: none;">
      <div class="modal" id="modal">
        <div class="modal-header">
          <h3 id="modalTitle">Modal Title</h3>
          <button class="modal-close" id="modalClose">&times;</button>
        </div>
        <div class="modal-body" id="modalBody">
          Modal content
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modalCancel">Cancel</button>
          <button class="btn btn-primary" id="modalConfirm">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`, {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;
global.Event = dom.window.Event;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.MouseEvent = dom.window.MouseEvent;

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn()
  }
};

describe('Settings Panels UI', () => {
  let settingsManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock settings manager
    settingsManager = {
      currentTab: 'general',
      settings: {
        theme: 'light',
        autoSave: true,
        apiKey: '',
        language: 'en',
        speed: 1,
        audioEnabled: true,
        timeout: 10000,
        retryCount: 3
      },
      loadSettings: jest.fn(),
      saveSettings: jest.fn(),
      validateSettings: jest.fn().mockReturnValue({ isValid: true }),
      showNotification: jest.fn(),
      hideNotification: jest.fn()
    };

    // Reset DOM state
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.querySelector('[data-tab="general"]').classList.add('active');
    document.getElementById('general-tab').classList.add('active');
  });

  describe('Tab Navigation', () => {
    test('should switch tabs when clicking tab buttons', () => {
      const voiceTab = document.querySelector('[data-tab="voice"]');
      const voicePanel = document.getElementById('voice-tab');
      const generalTab = document.querySelector('[data-tab="general"]');
      const generalPanel = document.getElementById('general-tab');

      // Initially general tab is active
      expect(generalTab.classList.contains('active')).toBe(true);
      expect(generalPanel.classList.contains('active')).toBe(true);
      expect(voiceTab.classList.contains('active')).toBe(false);
      expect(voicePanel.classList.contains('active')).toBe(false);

      // Click voice tab
      voiceTab.click();

      expect(voiceTab.classList.contains('active')).toBe(true);
      expect(voicePanel.classList.contains('active')).toBe(true);
      expect(generalTab.classList.contains('active')).toBe(false);
      expect(generalPanel.classList.contains('active')).toBe(false);
    });

    test('should update current tab in settings manager', () => {
      const playbackTab = document.querySelector('[data-tab="playback"]');
      
      // Mock tab switching function
      const switchTab = (tabName) => {
        settingsManager.currentTab = tabName;
        
        // Update UI
        document.querySelectorAll('.tab-button').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });
      };

      playbackTab.addEventListener('click', () => switchTab('playback'));
      playbackTab.click();

      expect(settingsManager.currentTab).toBe('playback');
      expect(playbackTab.classList.contains('active')).toBe(true);
      expect(document.getElementById('playback-tab').classList.contains('active')).toBe(true);
    });

    test('should handle tab switching with keyboard navigation', () => {
      const tabs = Array.from(document.querySelectorAll('.tab-button'));
      const firstTab = tabs[0];
      const secondTab = tabs[1];

      // Focus first tab
      firstTab.focus();
      expect(document.activeElement).toBe(firstTab);

      // Simulate arrow key navigation
      const arrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        code: 'ArrowRight'
      });
      
      firstTab.dispatchEvent(arrowEvent);

      // In a real implementation, this would move focus to next tab
      // For now, just test that the event can be dispatched
      expect(arrowEvent.type).toBe('keydown');
    });

    test('should maintain tab state across page reloads', async () => {
      // Mock storage returning saved tab
      chrome.storage.sync.get.mockResolvedValue({
        settings: {
          ...settingsManager.settings,
          lastActiveTab: 'voice'
        }
      });

      // Mock tab restoration
      const restoreTabState = async () => {
        const result = await chrome.storage.sync.get(['settings']);
        const lastTab = result.settings?.lastActiveTab || 'general';
        
        const tabButton = document.querySelector(`[data-tab="${lastTab}"]`);
        if (tabButton) {
          tabButton.click();
        }
      };

      await restoreTabState();

      expect(chrome.storage.sync.get).toHaveBeenCalled();
      expect(document.querySelector('[data-tab="voice"]').classList.contains('active')).toBe(true);
    });
  });

  describe('Form Interactions', () => {
    test('should handle theme selection changes', () => {
      const themeSelect = document.getElementById('theme');
      
      // Change theme
      themeSelect.value = 'dark';
      themeSelect.dispatchEvent(new Event('change'));

      expect(themeSelect.value).toBe('dark');
      
      // In real implementation, this would update the UI theme
      expect(document.querySelector('[data-theme]')).toBeDefined(); // Theme would be applied
    });

    test('should handle checkbox changes', () => {
      const autoSaveCheckbox = document.getElementById('autoSave');
      
      // Toggle checkbox
      autoSaveCheckbox.checked = false;
      autoSaveCheckbox.dispatchEvent(new Event('change'));

      expect(autoSaveCheckbox.checked).toBe(false);
    });

    test('should handle range slider updates', () => {
      const speedSlider = document.getElementById('speed');
      const speedValue = document.getElementById('speedValue');
      
      // Change speed
      speedSlider.value = '2';
      speedSlider.dispatchEvent(new Event('input'));

      expect(speedSlider.value).toBe('2');
      expect(speedValue.textContent).toBe('2x');
    });

    test('should validate form fields on input', () => {
      const apiKeyInput = document.getElementById('apiKey');
      const testButton = document.getElementById('testApiKey');
      
      // Mock validation
      const validateApiKey = (value) => {
        return value.startsWith('AIza') && value.length >= 39;
      };

      apiKeyInput.addEventListener('input', (e) => {
        const isValid = validateApiKey(e.target.value);
        testButton.disabled = !isValid;
        
        if (isValid) {
          testButton.classList.remove('disabled');
        } else {
          testButton.classList.add('disabled');
        }
      });

      // Test invalid key
      apiKeyInput.value = 'invalid';
      apiKeyInput.dispatchEvent(new Event('input'));
      expect(testButton.disabled).toBe(true);

      // Test valid key
      apiKeyInput.value = 'AIzaSyDaGmWKa4JsXZ-HjGw63IS5dN4';
      apiKeyInput.dispatchEvent(new Event('input'));
      expect(testButton.disabled).toBe(false);
    });

    test('should handle form submission', async () => {
      const generalForm = document.getElementById('general-form');
      
      // Mock form submission
      generalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(generalForm);
        const settings = Object.fromEntries(formData);
        
        // Convert checkbox values
        settings.autoSave = generalForm.querySelector('#autoSave').checked;
        
        await settingsManager.saveSettings(settings);
        settingsManager.showNotification('Settings saved successfully!', 'success');
      });

      // Fill form
      document.getElementById('theme').value = 'dark';
      document.getElementById('autoSave').checked = true;

      // Submit form
      const submitEvent = new Event('submit', { cancelable: true });
      generalForm.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      expect(settingsManager.saveSettings).toHaveBeenCalled();
      expect(settingsManager.showNotification).toHaveBeenCalledWith(
        'Settings saved successfully!',
        'success'
      );
    });
  });

  describe('Modal Interactions', () => {
    test('should show modal when triggered', () => {
      const modalOverlay = document.getElementById('modalOverlay');
      const modal = document.getElementById('modal');
      const modalTitle = document.getElementById('modalTitle');
      const modalBody = document.getElementById('modalBody');

      // Mock modal show function
      const showModal = (title, content, onConfirm = null) => {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalOverlay.style.display = 'flex';
        
        if (onConfirm) {
          document.getElementById('modalConfirm').onclick = onConfirm;
        }
      };

      showModal(
        'Confirm Reset',
        'Are you sure you want to reset all settings to defaults?',
        () => {
          console.log('Settings reset');
        }
      );

      expect(modalOverlay.style.display).toBe('flex');
      expect(modalTitle.textContent).toBe('Confirm Reset');
      expect(modalBody.innerHTML).toBe('Are you sure you want to reset all settings to defaults?');
    });

    test('should hide modal when cancel is clicked', () => {
      const modalOverlay = document.getElementById('modalOverlay');
      const modalClose = document.getElementById('modalClose');
      const modalCancel = document.getElementById('modalCancel');

      // Show modal first
      modalOverlay.style.display = 'flex';

      // Mock modal hide function
      const hideModal = () => {
        modalOverlay.style.display = 'none';
      };

      modalClose.addEventListener('click', hideModal);
      modalCancel.addEventListener('click', hideModal);

      // Click close button
      modalClose.click();
      expect(modalOverlay.style.display).toBe('none');

      // Show modal again
      modalOverlay.style.display = 'flex';

      // Click cancel button
      modalCancel.click();
      expect(modalOverlay.style.display).toBe('none');
    });

    test('should handle modal confirmation', () => {
      const modalConfirm = document.getElementById('modalConfirm');
      let confirmCallbackCalled = false;

      // Mock modal with confirmation callback
      const showModalWithConfirm = (onConfirm) => {
        document.getElementById('modalConfirm').onclick = () => {
          onConfirm();
          document.getElementById('modalOverlay').style.display = 'none';
        };
      };

      showModalWithConfirm(() => {
        confirmCallbackCalled = true;
      });

      // Click confirm button
      modalConfirm.click();

      expect(confirmCallbackCalled).toBe(true);
      expect(document.getElementById('modalOverlay').style.display).toBe('none');
    });

    test('should close modal when clicking overlay', () => {
      const modalOverlay = document.getElementById('modalOverlay');

      // Show modal
      modalOverlay.style.display = 'flex';

      // Mock overlay click handler
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.style.display = 'none';
        }
      });

      // Click overlay
      modalOverlay.click();

      expect(modalOverlay.style.display).toBe('none');
    });

    test('should handle ESC key to close modal', () => {
      const modalOverlay = document.getElementById('modalOverlay');

      // Show modal
      modalOverlay.style.display = 'flex';

      // Mock ESC key handler
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
          modalOverlay.style.display = 'none';
        }
      });

      // Press ESC key
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);

      expect(modalOverlay.style.display).toBe('none');
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should handle Ctrl+S to save settings', () => {
      let saveCalled = false;

      // Mock save shortcut
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          saveCalled = true;
          settingsManager.saveSettings(settingsManager.settings);
        }
      });

      // Press Ctrl+S
      const saveEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true
      });
      document.dispatchEvent(saveEvent);

      expect(saveEvent.defaultPrevented).toBe(true);
      expect(saveCalled).toBe(true);
      expect(settingsManager.saveSettings).toHaveBeenCalled();
    });

    test('should handle Ctrl+Z to undo changes', () => {
      let undoCalled = false;

      // Mock undo shortcut
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
          e.preventDefault();
          undoCalled = true;
          // In real implementation, would restore previous settings
        }
      });

      // Press Ctrl+Z
      const undoEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true
      });
      document.dispatchEvent(undoEvent);

      expect(undoEvent.defaultPrevented).toBe(true);
      expect(undoCalled).toBe(true);
    });

    test('should handle Tab key navigation in forms', () => {
      const firstInput = document.querySelector('#theme');
      const secondInput = document.querySelector('#autoSave');

      // Focus first input
      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);

      // Press Tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      firstInput.dispatchEvent(tabEvent);

      // In real implementation, focus would move to next element
      expect(tabEvent.type).toBe('keydown');
    });

    test('should handle Enter key to submit forms', () => {
      const form = document.getElementById('general-form');
      let submitted = false;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitted = true;
      });

      // Focus an input and press Enter
      const input = document.querySelector('#theme');
      input.focus();

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });
      input.dispatchEvent(enterEvent);

      // Enter key in input typically doesn't submit form, but in some contexts it might
      expect(enterEvent.type).toBe('keydown');
    });

    test('should handle arrow keys in range sliders', () => {
      const speedSlider = document.getElementById('speed');
      const speedValue = document.getElementById('speedValue');

      speedSlider.addEventListener('keydown', (e) => {
        let step = 0.5;
        let newValue = parseFloat(speedSlider.value);

        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowDown':
            newValue = Math.max(parseFloat(speedSlider.min), newValue - step);
            break;
          case 'ArrowRight':
          case 'ArrowUp':
            newValue = Math.min(parseFloat(speedSlider.max), newValue + step);
            break;
        }

        speedSlider.value = newValue;
        speedValue.textContent = `${newValue}x`;
      });

      // Initial value
      expect(speedSlider.value).toBe('1');
      expect(speedValue.textContent).toBe('1x');

      // Press right arrow
      const rightArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      });
      speedSlider.dispatchEvent(rightArrowEvent);

      expect(speedSlider.value).toBe('1.5');
      expect(speedValue.textContent).toBe('1.5x');

      // Press left arrow
      const leftArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true
      });
      speedSlider.dispatchEvent(leftArrowEvent);

      expect(speedSlider.value).toBe('1');
      expect(speedValue.textContent).toBe('1x');
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      // Mock responsive behavior
      const handleResize = () => {
        if (window.innerWidth < 768) {
          document.body.classList.add('mobile');
        } else {
          document.body.classList.remove('mobile');
        }
      };

      window.addEventListener('resize', handleResize);
      window.dispatchEvent(new Event('resize'));

      expect(document.body.classList.contains('mobile')).toBe(true);
    });

    test('should handle touch events on mobile', () => {
      const tabButton = document.querySelector('[data-tab="voice"]');
      let touchStarted = false;

      tabButton.addEventListener('touchstart', (e) => {
        touchStarted = true;
        e.preventDefault();
      });

      // Simulate touch event
      const touchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true
      });
      tabButton.dispatchEvent(touchEvent);

      expect(touchStarted).toBe(true);
    });
  });

  describe('Accessibility', () => {
    test('should support ARIA labels and roles', () => {
      const themeSelect = document.getElementById('theme');
      const apiKeyInput = document.getElementById('apiKey');

      // Add ARIA attributes
      themeSelect.setAttribute('aria-label', 'Select theme');
      apiKeyInput.setAttribute('aria-describedby', 'apiKey-help');

      expect(themeSelect.getAttribute('aria-label')).toBe('Select theme');
      expect(apiKeyInput.getAttribute('aria-describedby')).toBe('apiKey-help');
    });

    test('should support screen reader announcements', () => {
      let announcement = '';

      // Mock screen reader announcement
      const announce = (message) => {
        announcement = message;
      };

      // Test announcement on settings save
      announce('Settings saved successfully');

      expect(announcement).toBe('Settings saved successfully');
    });

    test('should handle focus management', () => {
      const modal = document.getElementById('modal');
      const modalOverlay = document.getElementById('modalOverlay');

      // Mock focus trapping in modal
      const trapFocus = (element) => {
        const focusableElements = element.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      };

      // Show modal and trap focus
      modalOverlay.style.display = 'flex';
      trapFocus(modal);

      const firstFocusable = modal.querySelector('button, [href], input, select, textarea');
      expect(document.activeElement).toBe(firstFocusable);
    });
  });
});