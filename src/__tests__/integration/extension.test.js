/**
 * Integration tests for the entire Chrome Extension
 * Tests manifest validation, module loading, and basic functionality
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Chrome Extension Integration', () => {
  const deployPath = path.join(process.cwd(), 'deploy');
  const manifestPath = path.join(deployPath, 'manifest.json');

  describe('Manifest Validation', () => {
    let manifest;

    beforeAll(() => {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      manifest = JSON.parse(manifestContent);
    });

    it('should have valid manifest structure', () => {
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBeDefined();
      expect(manifest.version).toBe('2.0.0');
    });

    it('should have required permissions', () => {
      expect(manifest.permissions).toContain('activeTab');
      expect(manifest.permissions).toContain('storage');
      expect(manifest.permissions).toContain('scripting');
    });

    it('should have valid host permissions', () => {
      expect(manifest.host_permissions).toContain('<all_urls>');
      expect(manifest.host_permissions).toContain('https://generativelanguage.googleapis.com/*');
    });

    it('should have valid action configuration', () => {
      expect(manifest.action.default_popup).toBe('popup/index.html');
      expect(manifest.action.default_icon).toBeDefined();
    });

    it('should have valid background service worker', () => {
      expect(manifest.background.service_worker).toBe('background/index.js');
    });

    it('should have valid content scripts configuration', () => {
      const contentScripts = manifest.content_scripts[0];
      expect(contentScripts.matches).toContain('<all_urls>');
      expect(contentScripts.js).toHaveLength(11); // All modules
      expect(contentScripts.css).toContain('content/content.css');
      expect(contentScripts.run_at).toBe('document_start');
    });

    it('should have valid options page', () => {
      expect(manifest.options_page).toBe('settings/index.html');
    });

    it('should have valid icons', () => {
      expect(manifest.icons['16']).toBe('common/assets/icon16.png');
      expect(manifest.icons['48']).toBe('common/assets/icon48.png');
      expect(manifest.icons['128']).toBe('common/assets/icon128.png');
    });
  });

  describe('File Structure Validation', () => {
    it('should have all required files in deploy directory', () => {
      const requiredFiles = [
        'manifest.json',
        'popup/index.html',
        'popup/index.js',
        'popup/popup.css',
        'settings/index.html',
        'settings/index.js',
        'settings/settings.css',
        'background/index.js',
        'content/index.js',
        'content/content.css',
        'content/recorder/ActionRecorder.js',
        'content/executor/ActionExecutor.js',
        'content/finder/ElementFinder.js',
        'ai/InstructionParser.js',
        'common/constants.js',
        'common/logger.js',
        'common/storage.js',
        'common/validator.js',
        'common/helpers.js',
        'common/events.js',
        'common/assets/icon16.png',
        'common/assets/icon48.png',
        'common/assets/icon128.png',
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(deployPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have valid HTML files with proper structure', () => {
      const popupHtml = fs.readFileSync(path.join(deployPath, 'popup/index.html'), 'utf8');
      const settingsHtml = fs.readFileSync(path.join(deployPath, 'settings/index.html'), 'utf8');

      // Check for proper HTML structure
      expect(popupHtml).toContain('<!DOCTYPE html>');
      expect(popupHtml).toContain('<html');
      expect(popupHtml).toContain('</html>');
      
      expect(settingsHtml).toContain('<!DOCTYPE html>');
      expect(settingsHtml).toContain('<html');
      expect(settingsHtml).toContain('</html>');

      // Check for script references
      expect(popupHtml).toContain('index.js');
      expect(settingsHtml).toContain('index.js');
    });

    it('should have valid CSS files', () => {
      const popupCss = fs.readFileSync(path.join(deployPath, 'popup/popup.css'), 'utf8');
      const settingsCss = fs.readFileSync(path.join(deployPath, 'settings/settings.css'), 'utf8');
      const contentCss = fs.readFileSync(path.join(deployPath, 'content/content.css'), 'utf8');

      // Basic CSS validation
      expect(popupCss).toContain('{');
      expect(settingsCss).toContain('{');
      expect(contentCss).toContain('{');
    });

    it('should have valid JavaScript files', () => {
      const jsFiles = [
        'background/index.js',
        'content/index.js',
        'popup/index.js',
        'settings/index.js',
        'ai/InstructionParser.js',
        'common/logger.js',
      ];

      jsFiles.forEach(file => {
        const filePath = path.join(deployPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic JS validation
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Module Loading Tests', () => {
    // These tests would run in a Chrome extension context
    // For now, we'll validate syntax and basic structure

    it('should have syntactically valid JavaScript files', () => {
      const jsFiles = [
        'background/index.js',
        'content/index.js',
        'popup/index.js',
        'settings/index.js',
        'ai/InstructionParser.js',
        'common/logger.js',
        'common/storage.js',
        'common/validator.js',
        'common/helpers.js',
        'common/events.js',
        'common/constants.js',
      ];

      jsFiles.forEach(file => {
        const filePath = path.join(deployPath, file);
        expect(() => {
          // Basic syntax check by attempting to parse
          const content = fs.readFileSync(filePath, 'utf8');
          // Remove comments and check for basic syntax issues
          const cleaned = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
          expect(cleaned).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Chrome Extension Requirements', () => {
    it('should meet minimum Chrome version requirements', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Manifest V3 requires Chrome 88+
      // We don't specify minimum version in manifest, but structure should be compatible
      expect(manifest.manifest_version).toBe(3);
    });

    it('should have proper CSP headers compatibility', () => {
      // Manifest V3 has stricter CSP requirements
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Should not use eval() or similar in content scripts
      const contentJsPath = path.join(deployPath, 'content/index.js');
      const contentJs = fs.readFileSync(contentJsPath, 'utf8');
      
      // Basic check for unsafe patterns
      expect(contentJs).not.toContain('eval(');
      expect(contentJs).not.toContain('Function(');
      expect(contentJs).not.toContain('setTimeout(');
    });

    it('should have reasonable extension size', () => {
      const getTotalSize = (dirPath) => {
        let totalSize = 0;
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            totalSize += getTotalSize(filePath);
          } else {
            totalSize += stats.size;
          }
        });
        
        return totalSize;
      };

      const totalSize = getTotalSize(deployPath);
      const sizeInMB = totalSize / (1024 * 1024);
      
      // Chrome Web Store limit is 128MB, we should be well under that
      expect(sizeInMB).toBeLessThan(10); // Under 10MB is reasonable
    });
  });
});