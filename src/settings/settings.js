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
  const form = document.getElementById('settings-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveSettings();
    });
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await StorageManager.get([
      'geminiApiKey',
      'geminiEnabled',
      'logLevel',
      'maxRetries',
      'timeout',
      'showHints',
      'saveHistory',
    ], 'sync');

    document.getElementById('gemini-api-key').value = result.geminiApiKey || '';
    document.getElementById('gemini-enabled').checked = result.geminiEnabled !== false;
    document.getElementById('log-level').value = result.logLevel || 'INFO';
    document.getElementById('max-retries').value = result.maxRetries || 3;
    document.getElementById('timeout').value = result.timeout || 30000;
    document.getElementById('show-hints').checked = result.showHints !== false;
    document.getElementById('save-history').checked = result.saveHistory !== false;
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('error', 'main-status', 'Ошибка загрузки настроек');
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  try {
    // Validate API key if provided
    const apiKey = document.getElementById('gemini-api-key').value.trim();
    if (apiKey && apiKey.length > 0) {
      try {
        Validator.validateApiKey(apiKey);
      } catch (error) {
        showStatus('error', 'gemini-status', `✗ ${error.message}`);
        return;
      }
    }

    const settings = {
      geminiApiKey: apiKey,
      geminiEnabled: document.getElementById('gemini-enabled').checked,
      logLevel: document.getElementById('log-level').value,
      maxRetries: parseInt(document.getElementById('max-retries').value),
      timeout: parseInt(document.getElementById('timeout').value),
      showHints: document.getElementById('show-hints').checked,
      saveHistory: document.getElementById('save-history').checked,
    };

    await StorageManager.set(settings, 'sync');
    showStatus('success', 'main-status', '✓ Настройки сохранены успешно!');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('error', 'main-status', `✗ Ошибка: ${error.message}`);
  }
}

/**
 * Test Gemini API connection
 */
async function testGeminiAPI() {
  const apiKey = document.getElementById('gemini-api-key').value.trim();
  const statusEl = document.getElementById('gemini-status');

  if (!apiKey) {
    showStatus('error', 'gemini-status', '✗ Пожалуйста, введите API ключ');
    return;
  }

  try {
    Validator.validateApiKey(apiKey);
  } catch (error) {
    showStatus('error', 'gemini-status', `✗ ${error.message}`);
    return;
  }

  showStatus('info', 'gemini-status', '⏳ Тестирование подключения...');

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Скажи одно слово на русском',
                },
              ],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        showStatus('success', 'gemini-status', '✓ Подключение успешно! Gemini готов к работе.');
        // Save the validated key
        await StorageManager.set({ geminiApiKey: apiKey }, 'sync');
      } else {
        showStatus('error', 'gemini-status', '✗ Неожиданный ответ от API');
      }
    } else {
      const error = await response.json();
      showStatus(
        'error',
        'gemini-status',
        `✗ Ошибка: ${error.error?.message || response.statusText}`
      );
    }
  } catch (error) {
    showStatus('error', 'gemini-status', `✗ Ошибка подключения: ${error.message}`);
  }
}

/**
 * Clear Gemini API key
 */
async function clearGeminiKey() {
  if (confirm('Вы уверены? API ключ будет удален.')) {
    try {
      document.getElementById('gemini-api-key').value = '';
      await StorageManager.set({ geminiApiKey: '' }, 'sync');
      showStatus('success', 'gemini-status', '✓ API ключ удален');
    } catch (error) {
      showStatus('error', 'gemini-status', `✗ Ошибка: ${error.message}`);
    }
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (confirm('Восстановить настройки по умолчанию? Это удалит все текущие данные.')) {
    try {
      await StorageManager.clear('sync');
      await loadSettings();
      showStatus('success', 'main-status', '✓ Настройки восстановлены');
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
