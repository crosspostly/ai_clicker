# Разработка ИИ-Автокликер

## Локальная разработка

### Требования
- Node.js 16+
- npm

### Установка
```bash
git clone https://github.com/crosspostly/ai_clicker.git
cd ai_clicker
npm install
```

### Сборка расширения
```bash
npm run build
```
Это скопирует файлы из `src/` в `deploy/`

### Загрузка в Chrome
1. Откройте `chrome://extensions/`
2. Включите "Режим разработчика" (вверху справа)
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `deploy/`

### Разработка
- Редактируйте файлы в папке `src/`
- Запустите `npm run build`
- Обновите страницу в Chrome (кнопка обновления на странице расширения)

## Структура проекта

```
src/                          # Исходные файлы
├── manifest.json             # Конфигурация
├── popup.html / popup.css / popup.js
├── content.js                # Главный скрипт страницы
├── background.js             # Service worker
├── settings.html / settings.js
├── ActionExecutor.js         # Выполнение действий
├── ActionRecorder.js        # Запись действий
├── ElementFinder.js         # Поиск элементов
├── InstructionParser.js     # ИИ парсинг
├── logger.js                # Логирование
├── storage.js                # Хранилище
├── validator.js             # Валидация
├── helpers.js               # Вспомогательные функции
├── constants.js             # Константы
└── content.css              # Стили на странице

deploy/                        # Готовое расширение (не редактировать)
```

## API Gemini

Получите ключ: https://makersuite.google.com/app/apikey (бесплатно, 1000 запросов/день)

## Где что находится

- **Логика записи**: content.js → ActionRecorder.js → recordClick, recordInput, recordChange
- **Выполнение действий**: content.js → ActionExecutor.js → executeAction
- **Парсинг инструкций**: content.js → InstructionParser.js → parseInstructions
- **Поиск элементов**: ElementFinder.js → find, findBySelector, findByText
- **UI логика**: popup.js
- **Настройки**: settings.js
- **Логирование**: logger.js
- **Хранилище**: storage.js

## NPM скрипты

```bash
npm run build       # Копирование src/ в deploy/
npm run lint        # ESLint с авто-исправлением
npm run test        # Jest тесты
npm run format      # Prettier форматирование
```

## Отладка

### 1. Popup отладка
1. Откройте popup расширения
2. Правый клик → "Просмотреть код" или F12
3. Откроется DevTools для popup

### 2. Content script отладка
1. Откройте любую веб-страницу
2. F12 → Console tab
3. Используйте глобальные переменные:
   ```javascript
   // Доступ к компонентам
   elementFinder.find('Кнопка')
   actionRecorder.getActions()
   ```

### 3. Background отладка
1. chrome://extensions/
2. Найти расширение
3. "Просмотреть сервис-воркер: background.js"

## Добавление нового функционала

### 1. Новый тип действия
1. Добавить тип в constants.js
2. Реализовать в ActionExecutor.js
3. Добавить в InstructionParser.js
4. Обновить UI если нужно

### 2. Новая настройка
1. Добавить в settings.html
2. Обработать в settings.js
3. Использовать через storage.js

### 3. Новый метод поиска элементов
1. Добавить метод в ElementFinder.js
2. Обновить find() метод
3. Добавить тесты

## Тестирование

### Запуск тестов
```bash
npm test
```

### Покрытие
```bash
npm run test:coverage
```

### Ручное тестирование
1. Собрать: `npm run build`
2. Загрузить в Chrome
3. Протестировать функционал
4. Проверить консоль на ошибки

## Стиль кода

### ESLint правила
- Используются строгие правила
- Авто-исправление: `npm run lint`

### Форматирование
- Prettier для форматирования
- Запуск: `npm run format`

### Конвенции
- ES6+ синтаксис
- async/await вместо Promise.then()
- const по умолчанию, let когда нужно
- Никогда не использовать var
- JSDoc для всех функций и классов

## Обработка ошибок

### Структура ошибок
```javascript
try {
  // код
} catch (error) {
  logger.error('Operation failed', error);
  // Показать пользователю понятное сообщение
}
```

### Типы ошибок
- ValidationError - ошибки валидации
- ElementNotFoundError - элемент не найден
- ActionExecutionError - ошибка выполнения действия
- GeminiAPIError - ошибка API Gemini

## Безопасность

### Валидация
Все входные данные проходят через validator.js:
```javascript
validator.validateSelector(selector);
validator.validateAction(action);
```

### Защита от XSS
- Использовать textContent вместо innerHTML
- Санитизация пользовательского ввода
- Валидация URL и селекторов

## Производительность

### Оптимизации
- Кэширование элементов в ElementFinder
- Асинхронные операции
- Лимиты на количество данных
- Периодическая очистка хранилища

### Профилирование
- Использовать Chrome DevTools Performance
- Проверять memory leaks
- Оптимизировать горячие пути

## Релиз

### Версионирование
- Semantic versioning: MAJOR.MINOR.PATCH
- Обновить версию в manifest.json
- Обновить в package.json

### Сборка
```bash
npm run build
```

### Публикация
1. Заархивировать папку deploy/
2. Загрузить в Chrome Web Store
3. Создать release tag в git