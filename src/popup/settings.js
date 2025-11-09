/**
 * Settings management functionality
 */

import { storageService } from '../services/storageService.js';
import { settingsValidator } from '../services/settingsValidator.js';
import { DEFAULT_SETTINGS, THEMES, LANGUAGES, API_CONFIG } from '../common/constants.js';

class SettingsController {
  constructor() {
    this.settings = null;
    this.originalSettings = null;
    this.isDirty = false;
    this.autoSave = true;
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadSettings();
    this.initializeTabs();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    // Tab elements
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    
    // Form elements
    this.apiKeyInput = document.getElementById('apiKey');
    this.apiTimeoutInput = document.getElementById('apiTimeout');
    this.maxRetriesInput = document.getElementById('maxRetries');
    this.modelSelectionSelect = document.getElementById('modelSelection');
    this.languageSelect = document.getElementById('language');
    this.confidenceThresholdInput = document.getElementById('confidenceThreshold');
    this.themeSelect = document.getElementById('theme');
    this.compactModeCheckbox = document.getElementById('compactMode');
    this.autoSaveCheckbox = document.getElementById('autoSave');
    this.showNotificationsCheckbox = document.getElementById('showNotifications');
    
    // Shortcut elements
    this.toggleRecordingInput = document.getElementById('toggleRecording');
    this.toggleVoiceInput = document.getElementById('toggleVoice');
    this.playbackInput = document.getElementById('playback');
    
    // Action buttons
    this.saveBtn = document.getElementById('saveBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.importBtn = document.getElementById('importBtn');
    this.importFileInput = document.getElementById('importFile');
    this.testApiBtn = document.getElementById('testApiBtn');
    
    // Dialog elements
    this.importDialog = document.getElementById('importDialog');
    this.importConfirmBtn = document.getElementById('importConfirmBtn');
    this.importCancelBtn = document.getElementById('importCancelBtn');
    
    // Status elements
    this.statusMessage = document.getElementById('statusMessage');
    this.modelStatusList = document.getElementById('modelStatusList');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab switching
    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.switchTab(button.dataset.tab);
      });
    });

    // Form change detection
    const formInputs = document.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.addEventListener('change', () => {
        this.markDirty();
        if (this.autoSave) {
          this.debounce(() => this.saveSettings(), 1000);
        }
      });
    });

    // Confidence threshold slider
    this.confidenceThresholdInput?.addEventListener('input', (e) => {
      const value = e.target.value;
      const valueDisplay = e.target.nextElementSibling;
      if (valueDisplay && valueDisplay.classList.contains('range-value')) {
        valueDisplay.textContent = `${value}%`;
      }
    });

    // Action buttons
    this.saveBtn?.addEventListener('click', () => this.saveSettings());
    this.resetBtn?.addEventListener('click', () => this.resetSettings());
    this.exportBtn?.addEventListener('click', () => this.exportSettings());
    this.importBtn?.addEventListener('click', () => this.importFileInput.click());
    this.importFileInput?.addEventListener('change', (e) => this.handleImportFile(e));
    this.testApiBtn?.addEventListener('click', () => this.testApiKey());

    // Dialog buttons
    this.importConfirmBtn?.addEventListener('click', () => this.confirmImport());
    this.importCancelBtn?.addEventListener('click', () => this.closeImportDialog());

    // Shortcut buttons
    document.querySelectorAll('[data-shortcut]').forEach(button => {
      button.addEventListener('click', () => {
        const shortcutId = button.dataset.shortcut;
        this.editShortcut(shortcutId);
      });
    });

    // Theme preview
    this.themeSelect?.addEventListener('change', () => this.updateThemePreview());

    // Auto save toggle
    this.autoSaveCheckbox?.addEventListener('change', (e) => {
      this.autoSave = e.target.checked;
    });
  }

  /**
   * Initialize tabs
   */
  initializeTabs() {
    // Set first tab as active
    if (this.tabButtons.length > 0) {
      this.switchTab(this.tabButtons[0].dataset.tab);
    }
  }

  /**
   * Switch to a specific tab
   */
  switchTab(tabName) {
    // Update button states
    this.tabButtons.forEach(button => {
      if (button.dataset.tab === tabName) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // Update pane visibility
    this.tabPanes.forEach(pane => {
      if (pane.id === `${tabName}-tab`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Load model status when models tab is opened
    if (tabName === 'models') {
      this.checkModelStatus();
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const storedSettings = await storageService.getSync('settings');
      this.settings = storedSettings || DEFAULT_SETTINGS;
      this.originalSettings = JSON.parse(JSON.stringify(this.settings));
      
      this.populateForm();
      this.applyTheme(this.settings.ui.theme);
      this.isDirty = false;
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showStatus('Ошибка загрузки настроек', 'error');
      this.settings = DEFAULT_SETTINGS;
      this.originalSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      this.populateForm();
    }
  }

  /**
   * Populate form with settings
   */
  populateForm() {
    // API settings
    if (this.apiKeyInput) this.apiKeyInput.value = this.settings.gemini.apiKey || '';
    if (this.apiTimeoutInput) this.apiTimeoutInput.value = (this.settings.gemini.timeout || 120000) / 1000;
    if (this.maxRetriesInput) this.maxRetriesInput.value = this.settings.gemini.maxRetries || 3;
    
    // Model settings
    if (this.modelSelectionSelect) this.modelSelectionSelect.value = this.settings.gemini.model || 'auto';
    
    // Language settings
    if (this.languageSelect) this.languageSelect.value = this.settings.gemini.language || 'auto';
    if (this.confidenceThresholdInput) {
      this.confidenceThresholdInput.value = this.settings.gemini.confidenceThreshold || 70;
      const valueDisplay = this.confidenceThresholdInput.nextElementSibling;
      if (valueDisplay && valueDisplay.classList.contains('range-value')) {
        valueDisplay.textContent = `${this.settings.gemini.confidenceThreshold || 70}%`;
      }
    }
    
    // UI settings
    if (this.themeSelect) this.themeSelect.value = this.settings.ui.theme || 'dark';
    if (this.compactModeCheckbox) this.compactModeCheckbox.checked = this.settings.ui.compactMode || false;
    if (this.autoSaveCheckbox) this.autoSaveCheckbox.checked = this.autoSave;
    if (this.showNotificationsCheckbox) this.showNotificationsCheckbox.checked = this.settings.ui.showNotifications !== false;
    
    // Shortcut settings
    if (this.toggleRecordingInput) this.toggleRecordingInput.value = this.settings.shortcuts.toggleRecording || 'Ctrl+Shift+R';
    if (this.toggleVoiceInput) this.toggleVoiceInput.value = this.settings.shortcuts.toggleVoice || 'Ctrl+Shift+V';
    if (this.playbackInput) this.playbackInput.value = this.settings.shortcuts.playback || 'Ctrl+Shift+P';
  }

  /**
   * Collect settings from form
   */
  collectSettings() {
    return {
      gemini: {
        apiKey: this.apiKeyInput?.value || '',
        model: this.modelSelectionSelect?.value || 'auto',
        timeout: (parseInt(this.apiTimeoutInput?.value) || 120) * 1000,
        maxRetries: parseInt(this.maxRetriesInput?.value) || 3,
        language: this.languageSelect?.value || 'auto',
        confidenceThreshold: parseInt(this.confidenceThresholdInput?.value) || 70,
      },
      ui: {
        theme: this.themeSelect?.value || 'dark',
        compactMode: this.compactModeCheckbox?.checked || false,
        showNotifications: this.showNotificationsCheckbox?.checked !== false,
      },
      shortcuts: {
        toggleRecording: this.toggleRecordingInput?.value || 'Ctrl+Shift+R',
        toggleVoice: this.toggleVoiceInput?.value || 'Ctrl+Shift+V',
        playback: this.playbackInput?.value || 'Ctrl+Shift+P',
      },
    };
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      const newSettings = this.collectSettings();
      
      // Validate settings
      const validation = settingsValidator.validateAndSanitize(newSettings);
      
      if (!validation.success) {
        this.showStatus(`Ошибка валидации: ${validation.errors.join(', ')}`, 'error');
        return;
      }
      
      // Save to storage
      await storageService.setSync('settings', validation.settings);
      
      this.settings = validation.settings;
      this.originalSettings = JSON.parse(JSON.stringify(validation.settings));
      this.isDirty = false;
      
      // Apply theme
      this.applyTheme(this.settings.ui.theme);
      
      this.showStatus('Настройки сохранены', 'success');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatus('Ошибка сохранения настроек', 'error');
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
      try {
        await storageService.setSync('settings', DEFAULT_SETTINGS);
        this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        this.originalSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        this.isDirty = false;
        
        this.populateForm();
        this.applyTheme(DEFAULT_SETTINGS.ui.theme);
        
        this.showStatus('Настройки сброшены', 'success');
        
      } catch (error) {
        console.error('Failed to reset settings:', error);
        this.showStatus('Ошибка сброса настроек', 'error');
      }
    }
  }

  /**
   * Export settings
   */
  async exportSettings() {
    try {
      const exportData = await storageService.exportSettings('settings');
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-autoclicker-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showStatus('Настройки экспортированы', 'success');
      
    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showStatus('Ошибка экспорта настроек', 'error');
    }
  }

  /**
   * Handle import file selection
   */
  handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.importData = e.target.result;
      this.showImportDialog();
    };
    reader.readAsText(file);
  }

  /**
   * Show import confirmation dialog
   */
  showImportDialog() {
    if (this.importDialog) {
      this.importDialog.style.display = 'flex';
    }
  }

  /**
   * Close import dialog
   */
  closeImportDialog() {
    if (this.importDialog) {
      this.importDialog.style.display = 'none';
    }
    this.importData = null;
    this.importFileInput.value = '';
  }

  /**
   * Confirm import
   */
  async confirmImport() {
    if (!this.importData) return;
    
    try {
      const result = await storageService.importSettings(this.importData);
      
      if (result.success) {
        await this.loadSettings();
        this.showStatus(`Настройки импортированы (${result.importedKeys.length} ключей)`, 'success');
      } else {
        this.showStatus(`Ошибка импорта: ${result.errors.join(', ')}`, 'error');
      }
      
    } catch (error) {
      console.error('Failed to import settings:', error);
      this.showStatus('Ошибка импорта настроек', 'error');
    }
    
    this.closeImportDialog();
  }

  /**
   * Test API key
   */
  async testApiKey() {
    const apiKey = this.apiKeyInput?.value;
    if (!apiKey) {
      this.showStatus('Введите API ключ для проверки', 'error');
      return;
    }
    
    this.testApiBtn.disabled = true;
    this.testApiBtn.textContent = '🔄 Проверка...';
    
    try {
      // Mock API key validation (replace with actual API call)
      const validation = settingsValidator.validateApiKey(apiKey);
      
      if (validation.valid) {
        this.showStatus('API ключ действителен', 'success');
      } else {
        this.showStatus(`Недействительный API ключ: ${validation.message}`, 'error');
      }
      
    } catch (error) {
      console.error('API key test failed:', error);
      this.showStatus('Ошибка проверки API ключа', 'error');
    }
    
    this.testApiBtn.disabled = false;
    this.testApiBtn.textContent = '🔍 Проверить ключ';
  }

  /**
   * Check model status
   */
  async checkModelStatus() {
    if (!this.modelStatusList) return;
    
    const statusItems = this.modelStatusList.querySelectorAll('.model-status-item');
    
    for (let i = 0; i < API_CONFIG.GEMINI_LIVE_MODELS.length; i++) {
      const model = API_CONFIG.GEMINI_LIVE_MODELS[i];
      const statusItem = statusItems[i];
      if (!statusItem) continue;
      
      const indicator = statusItem.querySelector('.model-status-indicator');
      if (!indicator) continue;
      
      indicator.textContent = '🔄 Проверка...';
      indicator.className = 'model-status-indicator testing';
      
      try {
        // Mock model status check (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate random status for demo
        const isAvailable = Math.random() > 0.3;
        
        if (isAvailable) {
          indicator.textContent = '✅ Доступна';
          indicator.className = 'model-status-indicator available';
        } else {
          indicator.textContent = '❌ Недоступна';
          indicator.className = 'model-status-indicator unavailable';
        }
        
      } catch (error) {
        indicator.textContent = '❌ Ошибка';
        indicator.className = 'model-status-indicator error';
      }
    }
  }

  /**
   * Edit shortcut
   */
  editShortcut(shortcutId) {
    const input = document.getElementById(shortcutId);
    if (!input) return;
    
    const currentValue = input.value;
    const newValue = prompt('Введите новое сочетание клавиш (например, Ctrl+Shift+R):', currentValue);
    
    if (newValue && newValue !== currentValue) {
      const validation = settingsValidator.validateShortcut(newValue);
      
      if (validation.valid) {
        input.value = validation.sanitized;
        this.markDirty();
        if (this.autoSave) {
          this.debounce(() => this.saveSettings(), 1000);
        }
      } else {
        this.showStatus(`Недействительное сочетание: ${validation.message}`, 'error');
      }
    }
  }

  /**
   * Apply theme to page
   */
  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
    
    // Update theme preview
    this.updateThemePreview();
  }

  /**
   * Update theme preview
   */
  updateThemePreview() {
    const theme = this.themeSelect?.value || 'dark';
    const previewContainer = document.querySelector('.preview-container');
    
    if (previewContainer) {
      if (theme === 'dark') {
        previewContainer.setAttribute('data-theme', 'dark');
      } else {
        previewContainer.removeAttribute('data-theme');
      }
    }
  }

  /**
   * Mark settings as dirty
   */
  markDirty() {
    this.isDirty = true;
    this.updateSaveButton();
  }

  /**
   * Update save button state
   */
  updateSaveButton() {
    if (this.saveBtn) {
      if (this.isDirty) {
        this.saveBtn.textContent = '💾 Сохранить*';
        this.saveBtn.classList.add('dirty');
      } else {
        this.saveBtn.textContent = '💾 Сохранить';
        this.saveBtn.classList.remove('dirty');
      }
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    if (this.statusMessage) {
      this.statusMessage.textContent = message;
      this.statusMessage.className = `status-message ${type}`;
      this.statusMessage.style.display = 'block';
      
      setTimeout(() => {
        this.statusMessage.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Debounce function calls
   */
  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }
}

// Initialize settings controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SettingsController();
});

export { SettingsController };