/**
 * Settings page logic
 */

/**
 * Initialize settings page
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadSettings();
    setupEventListeners();
  } catch (error) {
    console.error('Settings initialization error:', error);
    showStatus('error', 'main-status', 'Ошибка инициализации страницы настроек');
  }
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const saveBtn = document.getElementById('save-settings');
  const clearBtn = document.getElementById('clear-storage');

  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearStorage);
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const settings = await StorageManager.get(['geminiApiKey', 'geminiEnabled'], 'sync');
    
    if (settings.geminiApiKey) {
      document.getElementById('gemini-api-key').value = settings.geminiApiKey;
    }

    if (settings.geminiEnabled !== undefined) {
      document.getElementById('gemini-enabled').checked = settings.geminiEnabled;
    }

    showStatus('info', 'main-status', '✓ Настройки загружены');
  } catch (error) {
    showStatus('error', 'main-status', `✗ Ошибка загрузки: ${error.message}`);
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  try {
    const apiKey = document.getElementById('gemini-api-key').value.trim();
    const enabled = document.getElementById('gemini-enabled').checked;

    if (apiKey) {
      Validator.validateApiKey(apiKey);
    }

    await StorageManager.set({
      geminiApiKey: apiKey,
      geminiEnabled: enabled,
    }, 'sync');

    showStatus('success', 'main-status', '✓ Настройки сохранены');
  } catch (error) {
    showStatus('error', 'main-status', `✗ Ошибка сохранения: ${error.message}`);
  }
}

/**
 * Clear all storage
 */
async function clearStorage() {
  if (confirm('Вы уверены? Все данные будут удалены.')) {
    try {
      await StorageManager.clear();
      showStatus('success', 'main-status', '✓ Данные удалены');
      await loadSettings();
    } catch (error) {
      showStatus('error', 'main-status', `✗ Ошибка: ${error.message}`);
    }
  }
}

/**
 * Show status message
 */
function showStatus(type, elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.className = `status-message ${type}`;
  el.textContent = message;

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      el.className = 'status-message';
    }, 4000);
  }
}