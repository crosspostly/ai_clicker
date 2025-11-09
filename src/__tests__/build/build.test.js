/**
 * Build System Integration Tests
 * 
 * Tests for Rollup-based bundling system (Phase 2)
 * Validates build output, file structure, and Chrome extension compatibility
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const deployDir = path.join(__dirname, '..', '..', '..', 'deploy');

describe('Build System Tests', () => {
  describe('Deploy Directory Structure', () => {
    test('deploy/ directory exists', () => {
      expect(fs.existsSync(deployDir)).toBe(true);
    });

    test('manifest.json exists in deploy/', () => {
      const manifestPath = path.join(deployDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
    });

    test('all bundled JS files exist', () => {
      const requiredBundles = ['content.js', 'popup.js', 'settings.js', 'background.js'];
      
      requiredBundles.forEach(bundle => {
        const bundlePath = path.join(deployDir, bundle);
        expect(fs.existsSync(bundlePath)).toBe(true);
      });
    });

    test('all HTML files exist', () => {
      const htmlFiles = ['popup.html', 'settings.html'];
      
      htmlFiles.forEach(file => {
        const filePath = path.join(deployDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('all CSS files exist', () => {
      const cssFiles = ['popup.css', 'settings.css', 'content.css'];
      
      cssFiles.forEach(file => {
        const filePath = path.join(deployDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('icon files exist in images/', () => {
      const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
      
      icons.forEach(icon => {
        const iconPath = path.join(deployDir, 'images', icon);
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });
  });

  describe('Manifest Validation', () => {
    let manifest;

    beforeAll(() => {
      const manifestPath = path.join(deployDir, 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      manifest = JSON.parse(manifestContent);
    });

    test('manifest has correct version', () => {
      expect(manifest.version).toBe('2.0.0');
    });

    test('manifest uses Manifest V3', () => {
      expect(manifest.manifest_version).toBe(3);
    });

    test('popup.html path is correct', () => {
      expect(manifest.action.default_popup).toBe('popup.html');
    });

    test('background.js path is correct', () => {
      expect(manifest.background.service_worker).toBe('background.js');
    });

    test('content.js path is correct', () => {
      expect(manifest.content_scripts[0].js[0]).toBe('content.js');
    });

    test('settings.html path is correct', () => {
      expect(manifest.options_page).toBe('settings.html');
    });

    test('icon paths use images/ directory', () => {
      expect(manifest.icons['16']).toBe('images/icon16.png');
      expect(manifest.icons['48']).toBe('images/icon48.png');
      expect(manifest.icons['128']).toBe('images/icon128.png');
      expect(manifest.action.default_icon['16']).toBe('images/icon16.png');
      expect(manifest.action.default_icon['48']).toBe('images/icon48.png');
      expect(manifest.action.default_icon['128']).toBe('images/icon128.png');
    });

    test('manifest has required permissions', () => {
      expect(manifest.permissions).toContain('activeTab');
      expect(manifest.permissions).toContain('scripting');
      expect(manifest.permissions).toContain('storage');
    });

    test('background script type is module', () => {
      expect(manifest.background.type).toBe('module');
    });

    test('content script type is module', () => {
      expect(manifest.content_scripts[0].type).toBe('module');
    });
  });

  describe('Bundle File Validation', () => {
    test('content.js is not empty', () => {
      const contentPath = path.join(deployDir, 'content.js');
      const content = fs.readFileSync(contentPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('popup.js is not empty', () => {
      const popupPath = path.join(deployDir, 'popup.js');
      const content = fs.readFileSync(popupPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('settings.js is not empty', () => {
      const settingsPath = path.join(deployDir, 'settings.js');
      const content = fs.readFileSync(settingsPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('background.js is not empty', () => {
      const backgroundPath = path.join(deployDir, 'background.js');
      const content = fs.readFileSync(backgroundPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('bundles are reasonably sized', () => {
      const bundles = ['content.js', 'popup.js', 'settings.js', 'background.js'];
      
      bundles.forEach(bundle => {
        const bundlePath = path.join(deployDir, bundle);
        const stats = fs.statSync(bundlePath);
        const sizeKB = stats.size / 1024;
        
        expect(sizeKB).toBeGreaterThan(0.5);
        expect(sizeKB).toBeLessThan(5000);
      });
    });
  });

  describe('HTML File Validation', () => {
    test('popup.html references popup.js', () => {
      const popupPath = path.join(deployDir, 'popup.html');
      const content = fs.readFileSync(popupPath, 'utf8');
      expect(content).toContain('popup.js');
    });

    test('popup.html references popup.css', () => {
      const popupPath = path.join(deployDir, 'popup.html');
      const content = fs.readFileSync(popupPath, 'utf8');
      expect(content).toContain('popup.css');
    });

    test('settings.html references settings.js', () => {
      const settingsPath = path.join(deployDir, 'settings.html');
      const content = fs.readFileSync(settingsPath, 'utf8');
      expect(content).toContain('settings.js');
    });

    test('settings.html references settings.css', () => {
      const settingsPath = path.join(deployDir, 'settings.html');
      const content = fs.readFileSync(settingsPath, 'utf8');
      expect(content).toContain('settings.css');
    });
  });

  describe('Chrome Extension Compatibility', () => {
    test('no Node.js require in bundles', () => {
      const bundles = ['content.js', 'popup.js', 'settings.js', 'background.js'];
      
      bundles.forEach(bundle => {
        const bundlePath = path.join(deployDir, bundle);
        const content = fs.readFileSync(bundlePath, 'utf8');
        expect(content).not.toContain('require(');
      });
    });

    test('CSS content type is correct', () => {
      const contentCssPath = path.join(deployDir, 'content.css');
      expect(fs.existsSync(contentCssPath)).toBe(true);
      
      const manifest = JSON.parse(
        fs.readFileSync(path.join(deployDir, 'manifest.json'), 'utf8')
      );
      expect(manifest.content_scripts[0].css[0]).toBe('content.css');
    });
  });

  describe('Image Assets', () => {
    test('all icon files have reasonable size', () => {
      const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
      
      icons.forEach(file => {
        const iconPath = path.join(deployDir, 'images', file);
        expect(fs.existsSync(iconPath)).toBe(true);
        
        const stats = fs.statSync(iconPath);
        expect(stats.size).toBeGreaterThan(100);
        expect(stats.size).toBeLessThan(100000);
      });
    });
  });
});

describe('Rollup Configuration Tests', () => {
  test('rollup.config.js exists', () => {
    const configPath = path.join(__dirname, '..', '..', 'rollup.config.js');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  test('rollup.config.js is valid ESM', () => {
    const configPath = path.join(__dirname, '..', '..', 'rollup.config.js');
    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('export default');
  });
});

describe('Build Script Tests', () => {
  test('build.js exists', () => {
    const buildPath = path.join(__dirname, '..', '..', '..', 'build.js');
    expect(fs.existsSync(buildPath)).toBe(true);
  });

  test('build.js has correct shebang', () => {
    const buildPath = path.join(__dirname, '..', '..', '..', 'build.js');
    const content = fs.readFileSync(buildPath, 'utf8');
    expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
  });

  test('build.js uses ESM imports', () => {
    const buildPath = path.join(__dirname, '..', '..', '..', 'build.js');
    const content = fs.readFileSync(buildPath, 'utf8');
    expect(content).toContain('import fs from');
    expect(content).toContain('import path from');
  });
});
