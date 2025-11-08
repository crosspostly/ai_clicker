const fs = require('fs-extra');
const path = require('path');

const source = path.join(__dirname, 'src');
const destination = path.join(__dirname, 'deploy');

async function build() {
  try {
    console.log('🏗️  Building extension...');

    // Clean deploy/
    await fs.remove(destination);

    // Copy all from src/ to deploy/
    await fs.copy(source, destination);

    console.log('✅ Расширение собрано в папку deploy/');
  } catch (err) {
    console.error('❌ Ошибка при сборке:', err);
    process.exit(1);
  }
}

build();
