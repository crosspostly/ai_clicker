# 👨‍💻 DEVELOPMENT GUIDE

**Версия:** 1.0.1  
**Дата:** 2025-11-08  
**Для:** Локальная разработка расширения

---

## 📑 СОДЕРЖАНИЕ

1. [Требования](#требования)
2. [Локальная разработка](#локальная-разработка)
3. [Настройка окружения](#настройка-окружения)
4. [Структура проекта для разработки](#структура-проекта-для-разработки)
5. [Горячая перезагрузка](#горячая-перезагрузка)
6. [Тестирование](#тестирование)
7. [Debug советы](#debug-советы)
8. [IDE конфигурация](#ide-конфигурация)
9. [Типичные задачи](#типичные-задачи)
10. [Git рабочий процесс](#git-рабочий-процесс)

---

## 📋 Требования

### Окружение

- **Node.js:** v14+ (опционально, для инструментов)
- **npm:** v6+ (опционально)
- **Chrome/Chromium:** v90+
- **Git:** для контроля версий
- **Текстовый редактор:** VSCode, WebStorm и т.д.

### Рекомендуемые инструменты

- **VSCode** — бесплатный, мощный редактор
- **Chrome DevTools** — встроенный инструмент отладки
- **Postman** — для тестирования API
- **Git GUI** — для работы с версиями

---

## 🛠️ Локальная разработка

### Клонирование репозитория

```bash
# Клонируйте репозиторий
git clone https://github.com/crosspostly/ai_clicker.git
cd ai_clicker

# Или скачайте ZIP архив и распакуйте
unzip ai-autoclicker.zip
cd ai-autoclicker
```

### Загрузка расширения в Chrome

#### Вариант 1: Режим разработчика (рекомендуется)

1. Откройте `chrome://extensions/`
2. Включите **"Developer Mode"** (переключатель вверху справа)
3. Нажмите **"Load unpacked"**
4. Выберите папку `ai-autoclicker`
5. ✅ Расширение загружено!

#### Вариант 2: Расширение по умолчанию

```bash
# Создайте shortcut для быстрого открытия
# Скопируйте путь к папке расширения
# Используйте --load-extension в Chrome

google-chrome \
  --load-extension=/path/to/ai-autoclicker \
  https://example.com
```

---

## ⚙️ Настройка окружения

### VSCode Extensions (рекомендуется)

Установите эти расширения для удобства:

```
1. Chrome DevTools
   - Для отладки прямо из VSCode
   - ID: msjsoldm.debugger-for-chrome

2. Prettier
   - Форматирование кода
   - ID: esbenp.prettier-vscode

3. ESLint
   - Проверка синтаксиса JS
   - ID: dbaeumer.vscode-eslint

4. JSON
   - Поддержка JSON с комментариями
   - ID: ZainChen.json

5. Markdown All in One
   - Для редактирования .md файлов
   - ID: yzhang.markdown-all-in-one
```

### .editorconfig файл

Создайте `.editorconfig` в корне проекта:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,css,html,json,md}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### ESLint конфигурация

Создайте `.eslintrc.json`:

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "webextensions": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": ["error", {"argsIgnorePattern": "^_"}],
    "semi": ["error", "always"],
    "quotes": ["error", "single"]
  }
}
```

---

## 📁 Структура проекта для разработки

### Рекомендуемый layout

```
ai-autoclicker/
│
├── 📁 src/                      # Исходный код (опционально)
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── scripts/
│   │   ├── enhanced-content.js
│   │   ├── gemini-api.js
│   │   ├── background.js
│   │   └── settings.js
│   ├── styles/
│   │   └── content.css
│   └── pages/
│       └── settings.html
│
├── 📁 images/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── manifest.json
├── .editorconfig
├── .eslintrc.json
└── .gitignore
```

---

## 🔄 Горячая перезагрузка

### Способ 1: Ручная перезагрузка (быстро)

После изменений в коде:

1. Откройте `chrome://extensions/`
2. Найдите ваше расширение
3. Нажмите кнопку **"Reload"** (или F5)
4. Обновите страницу в браузере (Ctrl+Shift+R)

### Способ 2: Автоматическая перезагрузка (с нотификацией)

Добавьте в `background.js`:

```javascript
// Auto-reload при изменении файлов (для локальной разработки)
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

// Слушаем сообщения об обновлении
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'RELOAD_EXTENSION') {
    chrome.runtime.reload();
    sendResponse({status: 'reloading'});
  }
});
```

### Способ 3: VSCode Task для автоматической перезагрузки

Создайте `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Watch and Reload Extension",
      "type": "shell",
      "command": "echo",
      "args": ["Manually reload extension in chrome://extensions"],
      "runOptions": {
        "runOn": "folderOpen"
      }
    }
  ]
}
```

---

## 🧪 Тестирование

### Unit тестирование

Создайте тестовый файл `gemini-api.test.js`:

```javascript
// Простые тесты для gemini-api.js
describe('GeminiAIAssistant', () => {
  let assistant;
  
  beforeEach(() => {
    assistant = new GeminiAIAssistant();
  });

  test('should parse Russian instructions', () => {
    const instructions = 'Кликни на кнопку Войти';
    const result = assistant._fallbackParse(instructions);
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully', async () => {
    const result = await assistant.analyzeInstructions(
      'test',
      'invalid-api-key'
    );
    
    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
  });
});
```

### Manual тестирование

#### Тест 1: Запись действий
```
1. Откройте любой сайт
2. Нажмите "Начать запись"
3. Кликните на кнопку
4. Введите текст
5. Прокрутитесь
6. Нажмите "Остановить запись"
7. Проверьте список действий
```

**Ожидается:** Все действия записаны корректно

#### Тест 2: Воспроизведение
```
1. Нажмите "Воспроизвести"
2. Смотрите выполнение действий
3. Измените скорость (0.5x, 1x, 2x, 3x)
4. Проверьте корректность выполнения
```

**Ожидается:** Действия выполняются в правильном порядке

#### Тест 3: ИИ режим
```
1. Перейдите на test сайт
2. Перейдите на вкладку "Автоматический"
3. Напишите инструкцию: "Кликни на кнопку Submit"
4. Нажмите "Запустить"
5. Наблюдайте выполнение в панели ИИ
```

**Ожидается:** ИИ находит элемент и кликает

#### Тест 4: API ключ
```
1. Откройте Settings
2. Введите неправильный ключ
3. Нажмите "Тестировать подключение"
4. Проверьте ошибку
5. Введите правильный ключ
6. Нажмите "Тестировать подключение"
7. Проверьте успех
```

**Ожидается:** Ошибка для неправильного ключа, успех для правильного

---

## 🐛 Debug советы

### 1️⃣ Chrome DevTools

#### Для content script:

```javascript
// Откройте DevTools на странице (F12)
// Перейдите на вкладку Sources
// Найдите enhanced-content.js
// Поставьте breakpoints
// Воспроизведите действие
```

#### Для background script:

```javascript
// Откройте chrome://extensions/
// Найдите ваше расширение
// Нажмите "Inspect views" → background page
// Откроется DevTools для background.js
```

#### Для popup:

```javascript
// Нажмите на иконку расширения
// Правый клик → "Inspect popup"
// Откроется DevTools для popup.js
```

### 2️⃣ Логирование

Добавьте debug функцию в начало файлов:

```javascript
// Debug helper
const DEBUG = true;
const log = (tag, message, data) => {
  if (DEBUG) {
    console.log(`[${tag}]`, message, data || '');
  }
};

// Использование:
log('RECORD', 'Action recorded:', action);
log('ERROR', 'API call failed:', error);
```

### 3️⃣ Проверка хранилища

В DevTools Console:

```javascript
// Проверить localStorage
localStorage

// Получить конкретное значение
localStorage.getItem('recordedActions')

// Проверить chrome.storage
chrome.storage.sync.get(null, (items) => {
  console.log('Stored items:', items);
});

// Сохранить значение
chrome.storage.sync.set({testKey: 'testValue'});
```

### 4️⃣ Network инспектор

```javascript
// Откройте DevTools → Network
// Смотрите запросы к Gemini API
// Проверьте:
// - Status код (200 = успех)
// - Headers (Authentication)
// - Response (JSON с действиями)
```

### 5️⃣ Консольные вызовы

```javascript
// В любом DevTools console:

// Отправить сообщение в popup
chrome.runtime.sendMessage({type: 'DEBUG', data: 'test'});

// Получить информацию о расширении
chrome.runtime.getManifest()

// Перезагрузить расширение
chrome.runtime.reload()
```

### 6️⃣ Ошибки и warnings

Искайте в:
1. DevTools Console (F12)
2. Extension Errors (chrome://extensions/ → Details → Errors)
3. Application tab (Chrome DevTools → Application → Storage)

---

## 🖥️ IDE конфигурация

### VSCode

#### launch.json для отладки

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Chrome",
      "type": "chrome",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/chrome",
      "runtimeArgs": [
        "--load-extension=${workspaceFolder}"
      ],
      "webRoot": "${workspaceFolder}",
      "sourceMapPathOverride": {}
    }
  ]
}
```

#### extensions.json

```json
{
  "recommendations": [
    "msjsoldm.debugger-for-chrome",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "yzhang.markdown-all-in-one"
  ]
}
```

### WebStorm

1. File → Settings → Languages & Frameworks → JavaScript
2. Выберите ECMAScript 6+
3. Включите Web Extensions support
4. Run → Edit Configurations → + New → Chrome
5. Установите URL: `chrome://extensions/`

---

## 🎯 Типичные задачи

### Задача 1: Добавить новое действие (новый тип)

**Файлы для изменения:**
1. `enhanced-content.js` — добавить handler
2. `popup.js` — добавить UI элемент
3. `gemini-api.js` — обновить промпт

**Шаги:**
```javascript
// 1. В enhanced-content.js добавить запись:
recordNewAction(event) {
  const action = {
    type: 'new_action',
    data: extractData(event),
    timestamp: Date.now()
  };
  recordAction(action);
}

// 2. В popup.js добавить отображение
case 'new_action':
  return `🆕 Новое действие: ${action.data}`;

// 3. В executeAction добавить выполнение:
case 'new_action':
  performNewAction(action.data);
  break;
```

### Задача 2: Изменить цветовую схему

**Файл:** `popup.css`

```css
/* Основные цвета */
:root {
  --primary: #667eea;      /* Фиолетовый */
  --secondary: #764ba2;    /* Темный фиолетовый */
  --success: #48bb78;      /* Зеленый */
  --error: #f56565;        /* Красный */
}

/* Изменить все на синий */
:root {
  --primary: #0066ff;
  --secondary: #0052cc;
  /* ... */
}
```

### Задача 3: Добавить горячую клавишу

**Файл:** `manifest.json`

```json
{
  "commands": {
    "record_toggle": {
      "suggested_key": {
        "default": "Ctrl+Shift+R",
        "mac": "Command+Shift+R"
      },
      "description": "Toggle recording"
    }
  }
}
```

**Файл:** `background.js`

```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'record_toggle') {
    chrome.runtime.sendMessage({type: 'TOGGLE_RECORD'});
  }
});
```

### Задача 4: Добавить интеграцию с другим API

**Шаги:**
1. Создать новый файл `src/scripts/new-api.js`
2. Добавить класс `NewAPIIntegration`
3. Импортировать в `gemini-api.js` или `popup.js`
4. Использовать в нужном месте

```javascript
// new-api.js
class NewAPIIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.example.com';
  }

  async analyze(text) {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({text})
    });
    return await response.json();
  }
}
```

---

## 📚 Git рабочий процесс

### Создание новой ветки

```bash
# Создать ветку для новой фичи
git checkout -b feature/description-of-feature

# Или для bug fix
git checkout -b fix/description-of-fix
```

### Commit сообщения

Используйте структуру:
```
type(scope): description

body (optional)
footer (optional)
```

**Примеры:**
```bash
# Новая фича
git commit -m "feat(ui): add dark mode support"

# Bug fix
git commit -m "fix(api): handle Gemini API errors correctly"

# Рефакторинг
git commit -m "refactor(content-script): optimize element finder"

# Документация
git commit -m "docs: update development guide"
```

### Отправка изменений

```bash
# Обновить ветку
git pull origin develop

# Отправить свою ветку
git push origin feature/your-feature

# Создать Pull Request через GitHub UI
```

### Слияние ветки

```bash
# Перейти на основную ветку
git checkout main

# Получить последние изменения
git pull origin main

# Слить вашу ветку
git merge feature/your-feature

# Отправить
git push origin main
```

---

## 🚀 Типичный процесс разработки

### День 1: Подготовка

```bash
# 1. Клонировать репо
git clone https://github.com/crosspostly/ai_clicker.git
cd ai_clicker

# 2. Создать ветку
git checkout -b feature/my-feature

# 3. Загрузить в Chrome (chrome://extensions/)
# Developer Mode → Load unpacked → выбрать папку
```

### День 2-N: Разработка

```bash
# 1. Открыть проект в VSCode
code .

# 2. Внести изменения в файлы

# 3. В Chrome: chrome://extensions/ → Reload

# 4. Тестировать в браузере (F12 → Console)

# 5. Повторять пока не работает ✅
```

### День финальный: Коммит и Push

```bash
# 1. Проверить изменения
git status

# 2. Добавить файлы
git add .

# 3. Создать commit
git commit -m "feat(your-feature): description"

# 4. Отправить на GitHub
git push origin feature/my-feature

# 5. Создать Pull Request через GitHub UI

# 6. Ждать review и merge
```

---

## 📝 Быстрая справка команд

| Команда | Описание |
|---------|---------|
| `git status` | Показать статус |
| `git add .` | Добавить все файлы |
| `git commit -m "msg"` | Создать commit |
| `git push` | Отправить на GitHub |
| `git pull` | Получить обновления |
| `git branch -a` | Все ветки |
| `git checkout -b name` | Создать новую ветку |

---

## 🆘 Частые проблемы и решения

### Проблема: "Расширение не загружается"
```
Решение:
1. Проверьте manifest.json синтаксис
2. Все ли файлы на месте?
3. Откройте DevTools → Errors
4. Попробуйте Reload
```

### Проблема: "Content script не работает"
```
Решение:
1. Обновите страницу браузера (Ctrl+Shift+R)
2. Проверьте content_scripts в manifest.json
3. Посмотрите консоль (F12)
```

### Проблема: "API ключ не работает"
```
Решение:
1. Проверьте что ключ полностью скопирован
2. Попробуйте создать новый ключ
3. Посмотрите Network tab при запросе
```

---

**Версия:** 1.0.1  
**Последнее обновление:** 2025-11-08  
**Статус:** ✅ Готово
