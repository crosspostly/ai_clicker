/**
 * Settings validation service with default values and rules
 */

import { DEFAULT_SETTINGS, LANGUAGES, THEMES, API_CONFIG } from '../common/constants.js';

export class SettingsValidator {
  constructor() {
    this.validationRules = this._initializeValidationRules();
  }

  /**
   * Initialize validation rules for different setting types
   */
  _initializeValidationRules() {
    return {
      gemini: {
        apiKey: {
          type: 'string',
          required: false,
          pattern: /^AIza[0-9A-Za-z_-]{35}$/,
          minLength: 39,
          maxLength: 39,
          message: 'API key must be a valid Google Gemini API key (39 characters starting with AIza)',
        },
        model: {
          type: 'string',
          required: true,
          enum: ['auto', ...API_CONFIG.GEMINI_LIVE_MODELS],
          default: 'auto',
          message: `Model must be 'auto' or one of: ${API_CONFIG.GEMINI_LIVE_MODELS.join(', ')}`,
        },
        timeout: {
          type: 'number',
          required: true,
          min: 5000,
          max: 600000,
          default: 120000,
          message: 'Timeout must be between 5 seconds and 10 minutes',
        },
        language: {
          type: 'string',
          required: true,
          enum: Object.values(LANGUAGES),
          default: 'auto',
          message: `Language must be one of: ${Object.values(LANGUAGES).join(', ')}`,
        },
      },
      ui: {
        theme: {
          type: 'string',
          required: true,
          enum: Object.values(THEMES),
          default: 'dark',
          message: `Theme must be one of: ${Object.values(THEMES).join(', ')}`,
        },
        compactMode: {
          type: 'boolean',
          required: true,
          default: false,
          message: 'Compact mode must be true or false',
        },
      },
      shortcuts: {
        toggleRecording: {
          type: 'string',
          required: true,
          pattern: /^(Ctrl|Alt|Shift|Meta)\+([A-Z]|[0-9]|\w)(\+([A-Z]|[0-9]|\w))*$/,
          default: 'Ctrl+Shift+R',
          message: 'Shortcut must be in format: Ctrl+Shift+R, Alt+F, Ctrl+1, etc.',
        },
        toggleVoice: {
          type: 'string',
          required: true,
          pattern: /^(Ctrl|Alt|Shift|Meta)\+([A-Z]|[0-9]|\w)(\+([A-Z]|[0-9]|\w))*$/,
          default: 'Ctrl+Shift+V',
          message: 'Shortcut must be in format: Ctrl+Shift+V, Alt+F, Ctrl+1, etc.',
        },
        playback: {
          type: 'string',
          required: true,
          pattern: /^(Ctrl|Alt|Shift|Meta)\+([A-Z]|[0-9]|\w)(\+([A-Z]|[0-9]|\w))*$/,
          default: 'Ctrl+Shift+P',
          message: 'Shortcut must be in format: Ctrl+Shift+P, Alt+F, Ctrl+1, etc.',
        },
      },
    };
  }

  /**
   * Validate complete settings object
   */
  validateSettings(settings) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedSettings: {},
    };

    try {
      // Validate each section
      for (const [sectionName, sectionRules] of Object.entries(this.validationRules)) {
        const sectionData = settings[sectionName] || {};
        const sectionResult = this._validateSection(sectionName, sectionData, sectionRules);
        
        result.sanitizedSettings[sectionName] = sectionResult.sanitizedData;
        result.errors.push(...sectionResult.errors);
        result.warnings.push(...sectionResult.warnings);
        
        if (!sectionResult.isValid) {
          result.isValid = false;
        }
      }

      // Cross-section validation
      const crossValidationResult = this._validateCrossSection(result.sanitizedSettings);
      result.errors.push(...crossValidationResult.errors);
      result.warnings.push(...crossValidationResult.warnings);
      
      if (!crossValidationResult.isValid) {
        result.isValid = false;
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate a specific section of settings
   */
  _validateSection(sectionName, sectionData, sectionRules) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedData: {},
    };

    for (const [fieldName, fieldRules] of Object.entries(sectionRules)) {
      const fieldValue = sectionData[fieldName];
      const fieldResult = this._validateField(fieldName, fieldValue, fieldRules);
      
      result.sanitizedData[fieldName] = fieldResult.sanitizedValue;
      result.errors.push(...fieldResult.errors);
      result.warnings.push(...fieldResult.warnings);
      
      if (!fieldResult.isValid) {
        result.isValid = false;
      }
    }

    // Check for unknown fields
    for (const fieldName of Object.keys(sectionData)) {
      if (!sectionRules[fieldName]) {
        result.warnings.push(`Unknown field in ${sectionName}: ${fieldName}`);
        result.sanitizedData[fieldName] = sectionData[fieldName];
      }
    }

    return result;
  }

  /**
   * Validate a single field
   */
  _validateField(fieldName, value, rules) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedValue: value,
    };

    // Use default value if field is missing and not required
    if (value === undefined || value === null) {
      if (rules.required) {
        result.isValid = false;
        result.errors.push(`${fieldName} is required`);
        result.sanitizedValue = rules.default;
      } else {
        result.sanitizedValue = rules.default;
      }
      return result;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      result.isValid = false;
      result.errors.push(`${fieldName} must be of type ${rules.type}`);
      
      // Try to coerce type
      result.sanitizedValue = this._coerceType(value, rules.type);
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(result.sanitizedValue)) {
      result.isValid = false;
      result.errors.push(`${fieldName}: ${rules.message}`);
      result.sanitizedValue = rules.default;
    }

    // Pattern validation
    if (rules.pattern && typeof result.sanitizedValue === 'string') {
      if (!rules.pattern.test(result.sanitizedValue)) {
        if (rules.required) {
          result.isValid = false;
          result.errors.push(`${fieldName}: ${rules.message}`);
        } else {
          result.warnings.push(`${fieldName}: ${rules.message}`);
        }
        result.sanitizedValue = rules.default;
      }
    }

    // Length validation
    if (typeof result.sanitizedValue === 'string') {
      if (rules.minLength && result.sanitizedValue.length < rules.minLength) {
        result.isValid = false;
        result.errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && result.sanitizedValue.length > rules.maxLength) {
        result.isValid = false;
        result.errors.push(`${fieldName} must be at most ${rules.maxLength} characters`);
      }
    }

    // Range validation
    if (typeof result.sanitizedValue === 'number') {
      if (rules.min !== undefined && result.sanitizedValue < rules.min) {
        result.isValid = false;
        result.errors.push(`${fieldName} must be at least ${rules.min}`);
        result.sanitizedValue = rules.min;
      }
      if (rules.max !== undefined && result.sanitizedValue > rules.max) {
        result.isValid = false;
        result.errors.push(`${fieldName} must be at most ${rules.max}`);
        result.sanitizedValue = rules.max;
      }
    }

    return result;
  }

  /**
   * Cross-section validation
   */
  _validateCrossSection(settings) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate that if API key is provided, it's valid
    if (settings.gemini && settings.gemini.apiKey && !settings.gemini.model) {
      result.warnings.push('API key provided but no model selected');
    }

    // Validate timeout vs model selection
    if (settings.gemini && settings.gemini.timeout && settings.gemini.model) {
      const isExperimentalModel = settings.gemini.model.includes('exp');
      if (isExperimentalModel && settings.gemini.timeout > 60000) {
        result.warnings.push('Experimental models may have lower timeouts for better reliability');
      }
    }

    return result;
  }

  /**
   * Coerce value to specified type
   */
  _coerceType(value, targetType) {
    try {
      switch (targetType) {
        case 'string':
          return String(value);
        case 'number': {
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        }
        case 'boolean':
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
          }
          return Boolean(value);
        default:
          return value;
      }
    } catch (error) {
      return value;
    }
  }

  /**
   * Get default settings
   */
  getDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  /**
   * Get merged settings with defaults
   */
  mergeWithDefaults(settings) {
    const defaults = this.getDefaults();
    return this._deepMerge(defaults, settings);
  }

  /**
   * Deep merge objects
   */
  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Validate and sanitize settings in one step
   */
  validateAndSanitize(settings) {
    const validation = this.validateSettings(settings);
    
    if (validation.isValid) {
      return {
        success: true,
        settings: validation.sanitizedSettings,
        warnings: validation.warnings,
      };
    } else {
      return {
        success: false,
        settings: validation.sanitizedSettings,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return { valid: false, message: 'API key is required' };
    }

    const rules = this.validationRules.gemini.apiKey;
    const result = this._validateField('apiKey', apiKey, rules);
    
    return {
      valid: result.isValid,
      message: result.isValid ? 'API key is valid' : result.errors[0],
      sanitized: result.sanitizedValue,
    };
  }

  /**
   * Validate timeout value
   */
  validateTimeout(timeout) {
    const rules = this.validationRules.gemini.timeout;
    const result = this._validateField('timeout', timeout, rules);
    
    return {
      valid: result.isValid,
      message: result.isValid ? 'Timeout is valid' : result.errors[0],
      sanitized: result.sanitizedValue,
    };
  }

  /**
   * Validate language code
   */
  validateLanguage(language) {
    const rules = this.validationRules.gemini.language;
    const result = this._validateField('language', language, rules);
    
    return {
      valid: result.isValid,
      message: result.isValid ? 'Language is valid' : result.errors[0],
      sanitized: result.sanitizedValue,
    };
  }

  /**
   * Validate theme
   */
  validateTheme(theme) {
    const rules = this.validationRules.ui.theme;
    const result = this._validateField('theme', theme, rules);
    
    return {
      valid: result.isValid,
      message: result.isValid ? 'Theme is valid' : result.errors[0],
      sanitized: result.sanitizedValue,
    };
  }

  /**
   * Validate keyboard shortcut
   */
  validateShortcut(shortcut) {
    const rules = {
      type: 'string',
      required: true,
      pattern: /^(Ctrl|Alt|Shift|Meta)\+\w( \+ (Ctrl|Alt|Shift|Meta)\+\w)*$/,
      message: 'Shortcut must be in format: Ctrl+Shift+R, Alt+F, etc.',
    };
    
    const result = this._validateField('shortcut', shortcut, rules);
    
    return {
      valid: result.isValid,
      message: result.isValid ? 'Shortcut is valid' : result.errors[0],
      sanitized: result.sanitizedValue,
    };
  }

  /**
   * Get validation rules for a specific field
   */
  getFieldRules(section, field) {
    return this.validationRules[section]?.[field] || null;
  }

  /**
   * Check if settings are migration-compatible
   */
  checkMigrationCompatibility(oldSettings, newSettings) {
    const result = {
      compatible: true,
      issues: [],
      migrations: [],
    };

    // Check for removed fields
    const checkRemoved = (old, newPath = '') => {
      for (const key in old) {
        const path = newPath ? `${newPath}.${key}` : key;
        const newSection = newPath ? newSettings[newPath]?.[key] : newSettings[key];
        
        if (newSection === undefined) {
          result.issues.push(`Removed field: ${path}`);
        } else if (typeof old[key] === 'object' && !Array.isArray(old[key])) {
          checkRemoved(old[key], path);
        }
      }
    };

    // Check for type changes
    const checkTypeChanges = (old, newVersion, newPath = '') => {
      for (const key in old) {
        const path = newPath ? `${newPath}.${key}` : key;
        const newValue = newPath ? newVersion[newPath]?.[key] : newVersion[key];
        
        if (newValue !== undefined && typeof old[key] !== typeof newValue) {
          result.migrations.push(`Type change for ${path}: ${typeof old[key]} → ${typeof newValue}`);
        }
        
        if (typeof old[key] === 'object' && !Array.isArray(old[key]) && typeof newValue === 'object') {
          checkTypeChanges(old[key], newValue, path);
        }
      }
    };

    checkRemoved(oldSettings);
    checkTypeChanges(oldSettings, newSettings);

    result.compatible = result.issues.length === 0;
    return result;
  }
}

// Singleton instance
export const settingsValidator = new SettingsValidator();