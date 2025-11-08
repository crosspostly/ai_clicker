/**
 * Settings Page Controller
 */

class SettingsPage {
  constructor() {
    this.elements = {};
    this.defaults = {
      geminiApiKey: '',
      geminiEnabled: true,
      logLevel: 'INFO',
      maxRetries: 3,
      timeout: 30000,
      showHints: true,
      saveHistory: true,
    };
  }

  /**
   * Initialize settings page
   */
  async init() {
    this.cacheElements();
    this.attachEventListeners();
    await this.loadSettings();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      geminiApiKey: document.getElementById('gemini-api-key'),
      geminiEnabled: document.getElementById('gemini-enabled'),
      logLevel: document.getElementById('log-level'),
      maxRetries: document.getElementById('max-retries'),
      timeout: document.getElementById('timeout'),
      showHints: document.getElementById('show-hints'),
      saveHistory: document.getElementById('save-history'),
      saveSettings: document.getElementById('save-settings'),
      resetSettings: document.getElementById('reset-settings'),
      exportSettings: document.getElementById('export-settings'),
      clearStorage: document.getElementById('clear-storage'),
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
    this.elements.resetSettings.addEventListener('click', () => this.resetSettings());
    this.elements.exportSettings.addEventListener('click', () => this.exportSettings());
    this.elements.clearStorage.addEventListener('click', () => this.clearStorage());
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(this.defaults);

      this.elements.geminiApiKey.value = settings.geminiApiKey || '';
      this.elements.geminiEnabled.checked = settings.geminiEnabled !== false;
      this.elements.logLevel.value = settings.logLevel || 'INFO';
      this.elements.maxRetries.value = settings.maxRetries || 3;
      this.elements.timeout.value = settings.timeout || 30000;
      this.elements.showHints.checked = settings.showHints !== false;
      this.elements.saveHistory.checked = settings.saveHistory !== false;
    } catch (error) {
      console.error('Failed to load settings', error);
      this.showMessage('Ошибка загрузки настроек', 'error');
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      const settings = {
        geminiApiKey: this.elements.geminiApiKey.value.trim(),
        geminiEnabled: this.elements.geminiEnabled.checked,
        logLevel: this.elements.logLevel.value,
        maxRetries: parseInt(this.elements.maxRetries.value),
        timeout: parseInt(this.elements.timeout.value),
        showHints: this.elements.showHints.checked,
        saveHistory: this.elements.saveHistory.checked,
      };

      if (settings.geminiApiKey && !this.validateGeminiKey(settings.geminiApiKey)) {
        this.showMessage(
          'Ошибка: Неверный формат API ключа (должен быть 39 символов, начинаться с AIza)',
          'error',
        );
        return;
      }

      await chrome.storage.sync.set(settings);
      this.showMessage('Настройки успешно сохранены', 'success');
    } catch (error) {
      console.error('Failed to save settings', error);
      this.showMessage('Ошибка сохранения настроек', 'error');
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    if (!confirm('Вы уверены, что хотите сбросить настройки на значения по умолчанию?')) {
      return;
    }

    try {
      await chrome.storage.sync.set(this.defaults);
      await this.loadSettings();
      this.showMessage('Настройки сброшены на значения по умолчанию', 'success');
    } catch (error) {
      console.error('Failed to reset settings', error);
      this.showMessage('Ошибка сброса настроек', 'error');
    }
  }

  /**
   * Export settings as JSON
   */
  async exportSettings() {
    try {
      const settings = await chrome.storage.sync.get(this.defaults);
      const json = JSON.stringify(settings, null, 2);

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-autoclicker-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.showMessage('Настройки экспортированы', 'success');
    } catch (error) {
      console.error('Failed to export settings', error);
      this.showMessage('Ошибка экспорта настроек', 'error');
    }
  }

  /**
   * Clear all storage
   */
  async clearStorage() {
    if (
      !confirm(
        'Это удалит все данные (записанные действия, историю, настройки). Это невозможно отменить. Вы уверены?',
      )
    ) {
      return;
    }

    try {
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();
      await this.loadSettings();
      this.showMessage('Все данные удалены', 'success');
    } catch (error) {
      console.error('Failed to clear storage', error);
      this.showMessage('Ошибка очистки данных', 'error');
    }
  }

  /**
   * Validate Gemini API key format
   * @param {string} key - API key
   * @returns {boolean}
   */
  validateGeminiKey(key) {
    return key.length === 39 && key.startsWith('AIza');
  }

  /**
   * Show message to user
   * @param {string} text - Message text
   * @param {string} type - Message type (success, error, info)
   */
  showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `settings__message settings__message--${type}`;
    messageDiv.textContent = text;

    const content = document.querySelector('.settings__content');
    content.insertBefore(messageDiv, content.firstChild);

    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }
}

const settingsPage = new SettingsPage();
document.addEventListener('DOMContentLoaded', () => {
  settingsPage.init();
});
