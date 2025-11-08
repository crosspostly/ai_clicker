const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Конфигурация
const CONFIG = {
  source: path.join(__dirname, 'src'),
  destination: path.join(__dirname, 'deploy'),
  manifestPath: 'manifest.json',
  excludePatterns: [
    '.DS_Store',
    'Thumbs.db',
    '*.map',
    '*.test.js',
    '__tests__',
    '*.spec.js'
  ]
};

// Определяем production режим
const isProduction = process.env.NODE_ENV === 'production';

// Утилиты
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  step: (msg) => console.log(`\n🔧 ${msg}...`)
};

/**
 * Очистка папки deploy/
 */
async function cleanDeploy() {
  log.step('Очистка папки deploy');
  await fs.remove(CONFIG.destination);
  await fs.ensureDir(CONFIG.destination);
  log.success('Папка deploy очищена');
}

/**
 * Копирование файлов с фильтрацией
 */
async function copyFiles() {
  log.step('Копирование файлов из src в deploy');
  
  await fs.copy(CONFIG.source, CONFIG.destination, {
    filter: (src) => {
      const relativePath = path.relative(CONFIG.source, src);
      
      // Исключаем по паттернам
      for (const pattern of CONFIG.excludePatterns) {
        if (relativePath.includes(pattern)) {
          return false;
        }
      }
      
      return true;
    }
  });
  
  log.success('Файлы скопированы');
}

/**
 * Обновление манифеста для production
 */
async function updateManifest() {
  if (!isProduction) {
    log.info('Development режим - манифест не изменяется');
    return;
  }
  
  log.step('Обновление manifest.json для production');
  
  const manifestPath = path.join(CONFIG.destination, CONFIG.manifestPath);
  const manifest = await fs.readJSON(manifestPath);
  
  // Убираем development-специфичные поля
  delete manifest.key;
  
  // Обновляем версию (опционально)
  if (process.env.VERSION) {
    manifest.version = process.env.VERSION;
  }
  
  // Убираем source maps из CSP
  if (manifest.content_security_policy) {
    manifest.content_security_policy = manifest.content_security_policy
      .replace(/unsafe-eval/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
  log.success('Манифест обновлён для production');
}

/**
 * Минификация CSS (опционально)
 */
async function minifyCSS() {
  if (!isProduction) {
    log.info('Development режим - CSS не минифицируется');
    return;
  }
  
  log.step('Минификация CSS файлов');
  
  try {
    const cssFiles = await glob('**/*.css', { 
      cwd: CONFIG.destination,
      absolute: true 
    });
    
    for (const cssFile of cssFiles) {
      const content = await fs.readFile(cssFile, 'utf8');
      
      // Простая минификация (удаление комментариев и лишних пробелов)
      const minified = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // удаляем комментарии
        .replace(/\s+/g, ' ')              // схлопываем пробелы
        .replace(/\s*([{}:;,])\s*/g, '$1') // удаляем пробелы вокруг спецсимволов
        .trim();
      
      await fs.writeFile(cssFile, minified);
    }
    
    log.success(`Минифицировано ${cssFiles.length} CSS файлов`);
  } catch (error) {
    log.warning('Ошибка минификации CSS (не критично): ' + error.message);
  }
}

/**
 * Создание ZIP архива для Chrome Web Store
 */
async function createZip() {
  if (!isProduction) {
    log.info('Development режим - ZIP не создаётся');
    return;
  }
  
  log.step('Создание ZIP архива для Chrome Web Store');
  
  const manifest = await fs.readJSON(
    path.join(CONFIG.destination, CONFIG.manifestPath)
  );
  
  const version = manifest.version;
  const zipName = `ai-autoclicker-v${version}.zip`;
  const zipPath = path.join(__dirname, zipName);
  
  try {
    // Используем системный zip
    execSync(
      `cd ${CONFIG.destination} && zip -r "${zipPath}" . -x "*.DS_Store" "*.map"`,
      { stdio: 'inherit' }
    );
    
    const stats = await fs.stat(zipPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    log.success(`ZIP создан: ${zipName} (${sizeMB} MB)`);
    
    // Предупреждение если размер > 5MB
    if (stats.size > 5 * 1024 * 1024) {
      log.warning('Размер архива превышает 5MB! Рекомендуется оптимизация.');
    }
  } catch (error) {
    log.error('Не удалось создать ZIP: ' + error.message);
    log.info('Установите zip: sudo apt-get install zip (Linux) или brew install zip (Mac)');
  }
}

/**
 * Проверка размера финальной сборки
 */
async function checkSize() {
  log.step('Проверка размера сборки');
  
  const getSize = async (dirPath) => {
    let totalSize = 0;
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += await getSize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  };
  
  const totalBytes = await getSize(CONFIG.destination);
  const totalMB = (totalBytes / 1024 / 1024).toFixed(2);
  
  log.info(`Общий размер: ${totalMB} MB`);
  
  if (totalBytes > 10 * 1024 * 1024) {
    log.warning('Размер превышает 10MB! Chrome Web Store может отклонить.');
  }
}

/**
 * Валидация сборки
 */
async function validateBuild() {
  log.step('Валидация сборки');
  
  const checks = [];
  
  // Проверка manifest.json
  try {
    const manifestPath = path.join(CONFIG.destination, CONFIG.manifestPath);
    const manifest = await fs.readJSON(manifestPath);
    
    if (!manifest.manifest_version) {
      checks.push('❌ manifest.json: отсутствует manifest_version');
    } else if (manifest.manifest_version !== 3) {
      checks.push('⚠️  manifest.json: рекомендуется Manifest V3');
    }
    
    if (!manifest.version) {
      checks.push('❌ manifest.json: отсутствует version');
    }
    
    if (!manifest.name) {
      checks.push('❌ manifest.json: отсутствует name');
    }
    
    // Проверка иконок
    const iconSizes = ['16', '48', '128'];
    for (const size of iconSizes) {
      if (manifest.icons && manifest.icons[size]) {
        const iconPath = path.join(CONFIG.destination, manifest.icons[size]);
        if (!(await fs.pathExists(iconPath))) {
          checks.push(`❌ Иконка ${size}x${size} не найдена: ${manifest.icons[size]}`);
        }
      } else {
        checks.push(`⚠️  Иконка ${size}x${size} не указана в манифесте`);
      }
    }
    
    // Проверка popup и settings
    if (manifest.action?.default_popup) {
      const popupPath = path.join(CONFIG.destination, manifest.action.default_popup);
      if (!(await fs.pathExists(popupPath))) {
        checks.push(`❌ Popup не найден: ${manifest.action.default_popup}`);
      }
    }
    
    if (manifest.options_page) {
      const optionsPath = path.join(CONFIG.destination, manifest.options_page);
      if (!(await fs.pathExists(optionsPath))) {
        checks.push(`❌ Settings не найдены: ${manifest.options_page}`);
      }
    }
    
    // Проверка background script
    if (manifest.background?.service_worker) {
      const bgPath = path.join(CONFIG.destination, manifest.background.service_worker);
      if (!(await fs.pathExists(bgPath))) {
        checks.push(`❌ Background script не найден: ${manifest.background.service_worker}`);
      }
    }
    
    // Проверка content scripts
    if (manifest.content_scripts) {
      for (const cs of manifest.content_scripts) {
        for (const jsFile of cs.js || []) {
          const jsPath = path.join(CONFIG.destination, jsFile);
          if (!(await fs.pathExists(jsPath))) {
            checks.push(`❌ Content script не найден: ${jsFile}`);
          }
        }
      }
    }
    
  } catch (error) {
    checks.push(`❌ Не удалось прочитать manifest.json: ${error.message}`);
  }
  
  // Вывод результатов
  if (checks.length === 0) {
    log.success('Валидация пройдена успешно');
  } else {
    log.warning('Обнаружены проблемы:');
    checks.forEach(check => console.log(`  ${check}`));
  }
}

/**
 * Главная функция сборки
 */
async function build() {
  const startTime = Date.now();
  
  console.log('\n🏗️  === Сборка AI-Autoclicker ===\n');
  log.info(`Режим: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  try {
    await cleanDeploy();
    await copyFiles();
    await updateManifest();
    await minifyCSS();
    await validateBuild();
    await checkSize();
    
    if (isProduction) {
      await createZip();
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ === Сборка завершена успешно ===');
    log.info(`Время сборки: ${duration}s`);
    log.info(`Результат: ${CONFIG.destination}`);
    
    if (isProduction) {
      console.log('\n📦 Готово для публикации в Chrome Web Store!');
    } else {
      console.log('\n🔧 Готово для локальной разработки!');
      console.log('   Загрузите папку deploy/ в chrome://extensions/');
    }
    
  } catch (error) {
    log.error('Сборка провалилась: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

// Запуск сборки
build();
