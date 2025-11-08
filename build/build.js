/**
 * Simple build script to copy files to dist directory
 * Prepares the extension for installation
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

/**
 * Recursively copy files
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);

  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${destPath}`);
    }
  });
}

/**
 * Main build function
 */
function build() {
  try {
    console.log('🏗️  Building extension...');

    // Clean dist directory
    if (fs.existsSync(DIST_DIR)) {
      fs.rmSync(DIST_DIR, { recursive: true });
    }

    // Create dist directory
    fs.mkdirSync(DIST_DIR, { recursive: true });

    // Copy all source files
    copyDir(SRC_DIR, DIST_DIR);

    console.log('✓ Build complete! Extension ready in ./dist');
  } catch (error) {
    console.error('✗ Build error:', error);
    process.exit(1);
  }
}

build();
