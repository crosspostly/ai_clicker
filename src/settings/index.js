// settings.js - НОВОЕ СОДЕРЖАНИЕ

document.addEventListener('DOMContentLoaded', async () => {
  // Загрузить текущие настройки
  await loadSettings();

  // === Привязка событий к кнопкам ===

  // Кнопка тестирования Gemini API
  document
    .getElementById('test-gemini-btn')
    ?.addEventListener('click', testGeminiAPI);

  // Кнопка удаления API ключа
  document
    .getElementById('clear-gemini-btn')
    ?.addEventListener('click', clearGeminiKey);

  // Кнопка сброса настроек
  document
    .getElementById('reset-settings-btn')
    ?.addEventListener('click', resetSettings);

  // Форма сохранения настроек
  document
    .getElementById('settings-form')
    ?.addEventListener('submit', saveSettings);
});

// === Функция загрузки настроек ===
async function loadSettings() {
  const settings = await chrome.storage.sync.get([
    'geminiApiKey',
    'geminiEnabled',
    'logLevel',
    'maxRetries',
    'timeout',
    'showHints',
    'saveHistory',
  ]);

  if (settings.geminiApiKey) {
    document.getElementById('gemini-api-key').value = settings.geminiApiKey;
  }
  document.getElementById('gemini-enabled').checked =
    settings.geminiEnabled !== false;
  document.getElementById('log-level').value = settings.logLevel || 'INFO';
  document.getElementById('max-retries').value = settings.maxRetries || 3;
  document.getElementById('timeout').value = settings.timeout || 30000;
  document.getElementById('show-hints').checked = settings.showHints !== false;
  document.getElementById('save-history').checked =
    settings.saveHistory !== false;
}

// === Функция сохранения настроек ===
async function saveSettings(e) {
  e.preventDefault();
  const statusEl = document.getElementById('main-status');

  try {
    const settings = {
      geminiApiKey: document.getElementById('gemini-api-key').value.trim(),
      geminiEnabled: document.getElementById('gemini-enabled').checked,
      logLevel: document.getElementById('log-level').value,
      maxRetries: parseInt(document.getElementById('max-retries').value),
      timeout: parseInt(document.getElementById('timeout').value),
      showHints: document.getElementById('show-hints').checked,
      saveHistory: document.getElementById('save-history').checked,
    };

    // Валидация API ключа если включена Gemini
    if (settings.geminiEnabled && settings.geminiApiKey.length !== 39) {
      showStatus(statusEl, '⚠️ API ключ должен содержать 39 символов', 'error');
      return;
    }

    await chrome.storage.sync.set(settings);
    showStatus(statusEl, '✅ Настройки сохранены!', 'success');
  } catch (error) {
    showStatus(statusEl, `❌ Ошибка: ${error.message}`, 'error');
  }
}

// === Функция тестирования Gemini API ===
async function testGeminiAPI() {
  const statusEl = document.getElementById('gemini-status');
  const apiKey = document.getElementById('gemini-api-key').value.trim();
  const btn = document.getElementById('test-gemini-btn');

  if (!apiKey) {
    showStatus(statusEl, '⚠️ Введите API ключ перед тестированием', 'error');
    return;
  }

  if (apiKey.length !== 39) {
    showStatus(statusEl, '⚠️ API ключ должен содержать 39 символов', 'error');
    return;
  }

  // Показать прогресс
  btn.disabled = true;
  btn.textContent = '⏳ Тестирую...';
  showStatus(statusEl, '🔄 Проверка подключения...', 'info');

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' +
        apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Test' }],
            },
          ],
        }),
      },
    );

    if (response.ok) {
      showStatus(
        statusEl,
        '✅ API ключ работает! Gemini готов к использованию.',
        'success',
      );
      // Сохранить ключ если тест пройден
      await chrome.storage.sync.set({ geminiApiKey: apiKey });
    } else {
      const error = await response.json();
      showStatus(
        statusEl,
        `❌ Ошибка: ${error.error?.message || 'Невалидный API ключ'}`,
        'error',
      );
    }
  } catch (error) {
    showStatus(statusEl, `❌ Ошибка сети: ${error.message}`, 'error');
  } finally {
    // Восстановить кнопку
    btn.disabled = false;
    btn.textContent = '🧪 Тест';
  }
}

// === Функция удаления API ключа ===
async function clearGeminiKey() {
  if (!confirm('Удалить сохранённый API ключ?')) {
    return;
  }

  try {
    document.getElementById('gemini-api-key').value = '';
    await chrome.storage.sync.remove('geminiApiKey');
    showStatus(
      document.getElementById('gemini-status'),
      '✅ API ключ удалён',
      'success',
    );
  } catch (error) {
    showStatus(
      document.getElementById('gemini-status'),
      `❌ Ошибка: ${error.message}`,
      'error',
    );
  }
}

// === Функция сброса всех настроек ===
async function resetSettings() {
  if (
    !confirm(
      'Сбросить ВСЕ настройки к значениям по умолчанию? Это нельзя отменить!',
    )
  ) {
    return;
  }

  try {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    showStatus(
      document.getElementById('main-status'),
      '✅ Настройки сброшены. Перезагружаю...',
      'success',
    );

    // Перезагрузить страницу через 1 сек
    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    showStatus(
      document.getElementById('main-status'),
      `❌ Ошибка: ${error.message}`,
      'error',
    );
  }
}

// === Вспомогательная функция показа статуса ===
function showStatus(element, message, type = 'info') {
  if (!element) return;

  element.textContent = message;
  element.className = `status-message status-${type}`;

  // Автоскрыть через 3 сек для success/error
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      element.textContent = '';
      element.className = 'status-message';
    }, 3000);
  }
}
