#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');
const deployDir = path.join(__dirname, 'deploy');

const htmlFiles = [
  { src: 'popup/index.html', dest: 'popup.html' },
  { src: 'settings/index.html', dest: 'settings.html' },
];

const cssFiles = [
  { src: 'popup/popup.css', dest: 'popup.css' },
  { src: 'settings/settings.css', dest: 'settings.css' },
  { src: 'content/content.css', dest: 'content.css' },
];

const iconFiles = ['icon16.png', 'icon48.png', 'icon128.png'];

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function cleanDeployDirectory() {
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }

  ensureDirectory(deployDir);
}

cleanDeployDirectory();

function resolvePath(relativePath) {
  return path.join(srcDir, relativePath);
}

function copyFilePair({ src, dest }) {
  const sourcePath = resolvePath(src);
  const destinationPath = path.join(deployDir, dest);

  if (fs.existsSync(sourcePath)) {
    ensureDirectory(path.dirname(destinationPath));
    fs.copyFileSync(sourcePath, destinationPath);
    console.log(`✅ Copied ${src} -> ${dest}`);
  }
}

function copyStaticFiles() {
  console.log('📋 Copying static files...');

  htmlFiles.forEach(copyFilePair);
  cssFiles.forEach(copyFilePair);

  const manifestSrc = resolvePath('manifest.json');
  const manifestDest = path.join(deployDir, 'manifest.json');
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log('✅ Copied manifest.json');
  }

  // FIXED: Icon path updated from common/assets to images
  const imagesSrcDir = resolvePath('images');
  const imagesDestDir = path.join(deployDir, 'images');
  
  if (fs.existsSync(imagesSrcDir)) {
    ensureDirectory(imagesDestDir);
    iconFiles.forEach(file => {
      const srcFile = path.join(imagesSrcDir, file);
      const destFile = path.join(imagesDestDir, file);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`✅ Copied icon ${file}`);
      }
    });
  } else {
    console.warn('⚠️  images/ directory not found, trying fallback to common/assets/');
    // Fallback for backward compatibility
    const assetsSrcDir = resolvePath('common/assets');
    const assetsDestDir = path.join(deployDir, 'images');
    if (fs.existsSync(assetsSrcDir)) {
      ensureDirectory(assetsDestDir);
      iconFiles.forEach(file => {
        const srcFile = path.join(assetsSrcDir, file);
        const destFile = path.join(assetsDestDir, file);
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`✅ Copied icon ${file} (from common/assets fallback)`);
        }
      });
    }
  }
}

function getRollupBin() {
  const binName = process.platform === 'win32' ? 'rollup.cmd' : 'rollup';
  const localBin = path.join(__dirname, 'node_modules', '.bin', binName);
  return fs.existsSync(localBin) ? localBin : binName;
}

function bundleWithRollup(mode) {
  try {
    console.log('🔨 Running Rollup bundler...');
    const rollupBin = getRollupBin();
    const command = `"${rollupBin}" -c src/rollup.config.js`;

    execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: mode,
      },
    });

    console.log('✅ Rollup bundling complete!');
  } catch (error) {
    console.error('❌ Rollup bundling failed:', error.message);
    process.exit(1);
  }
}

function verifyBuild() {
  console.log('🔍 Verifying build...');
  const requiredFiles = [
    'manifest.json',
    'content.js',
    'popup.js',
    'settings.js',
    'background.js',
    'popup.html',
    'settings.html',
  ];

  let allFilesExist = true;
  requiredFiles.forEach(file => {
    const filePath = path.join(deployDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing: ${file}`);
      allFilesExist = false;
    } else {
      console.log(`✅ Found: ${file}`);
    }
  });

  const optionalFiles = ['content.css', 'popup.css', 'settings.css'];
  optionalFiles.forEach(file => {
    const filePath = path.join(deployDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Found: ${file}`);
    }
  });

  iconFiles.forEach(file => {
    const filePath = path.join(deployDir, 'images', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Found: images/${file}`);
    } else {
      console.error(`❌ Missing icon: images/${file}`);
      allFilesExist = false;
    }
  });

  if (allFilesExist) {
    console.log('✅ All required files present in deploy/');
  } else {
    console.error('❌ Build verification failed!');
    process.exit(1);
  }
}

function checkBundleSizes() {
  console.log('📊 Checking bundle sizes...');
  const bundles = ['content.js', 'popup.js', 'settings.js', 'background.js'];

  bundles.forEach(bundle => {
    const filePath = path.join(deployDir, bundle);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`📦 ${bundle}: ${sizeKB} KB`);
    }
  });
}

function build() {
  try {
    console.log('🚀 Starting build process...');
    const startTime = Date.now();

    const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production';
    process.env.NODE_ENV = mode;

    bundleWithRollup(mode);
    copyStaticFiles();
    verifyBuild();
    checkBundleSizes();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Build complete! Extension ready in deploy/ (${duration}s)`);
    console.log('\n📋 Next steps:');
    console.log('1. Load deploy/ folder in Chrome (chrome://extensions/)');
    console.log('2. Test popup, settings, and content script functionality');
    console.log('3. Check DevTools console for any errors');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();
