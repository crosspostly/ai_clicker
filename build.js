#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, 'src');
const deployDir = path.join(__dirname, 'deploy');

// Ensure deploy directory exists
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir, { recursive: true });
}

// Copy static files
function copyStaticFiles() {
  console.log('📋 Copying static files...');
  
  // Copy HTML files
  ['popup/index.html', 'settings/index.html'].forEach(file => {
    const src = path.join(srcDir, file);
    const dest = path.join(deployDir, path.basename(file));
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied ${file} -> ${path.basename(file)}`);
    }
  });

  // Copy CSS files
  ['popup/popup.css', 'settings/settings.css', 'content/content.css'].forEach(file => {
    const src = path.join(srcDir, file);
    const dest = path.join(deployDir, path.basename(file));
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied ${file} -> ${path.basename(file)}`);
    }
  });

  // Copy manifest
  const manifestSrc = path.join(srcDir, 'manifest.json');
  const manifestDest = path.join(deployDir, 'manifest.json');
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log('✅ Copied manifest.json');
  }

  // Copy icons from common/assets/
  const srcAssetsDir = path.join(srcDir, 'common/assets');
  if (fs.existsSync(srcAssetsDir)) {
    fs.readdirSync(srcAssetsDir).forEach(file => {
      if (file.endsWith('.png')) {
        fs.copyFileSync(
          path.join(srcAssetsDir, file),
          path.join(deployDir, file)
        );
        console.log(`✅ Copied icon ${file}`);
      }
    });
  }
}

// Run Rollup
function bundleWithRollup() {
  try {
    console.log('🔨 Running Rollup bundler...');
    const isProduction = process.env.NODE_ENV === 'production';
    const command = isProduction ? 'npm run rollup:prod' : 'npm run rollup:dev';
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Rollup bundling complete!');
  } catch (error) {
    console.error('❌ Rollup bundling failed:', error.message);
    process.exit(1);
  }
}

// Verify build
function verifyBuild() {
  console.log('🔍 Verifying build...');
  const requiredFiles = [
    'manifest.json',
    'content.js',
    'popup.js',
    'settings.js',
    'background.js',
    'popup.html',
    'settings.html'
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

  // Check for optional files
  const optionalFiles = ['content.css', 'popup.css', 'settings.css'];
  optionalFiles.forEach(file => {
    const filePath = path.join(deployDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Found: ${file}`);
    }
  });

  // Check for icons
  const iconFiles = ['icon16.png', 'icon48.png', 'icon128.png'];
  iconFiles.forEach(file => {
    const filePath = path.join(deployDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Found: ${file}`);
    }
  });

  if (allFilesExist) {
    console.log('✅ All required files present in deploy/');
  } else {
    console.error('❌ Build verification failed!');
    process.exit(1);
  }
}

// Check bundle sizes
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

// Main build process
async function build() {
  try {
    console.log('🚀 Starting build process...');
    const startTime = Date.now();
    
    bundleWithRollup();
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
