/**
 * Global constants for the AI Autoclicker extension
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const ACTION_TYPES = {
  CLICK: 'click',
  INPUT: 'input',
  HOVER: 'hover',
  SCROLL: 'scroll',
  WAIT: 'wait',
  SELECT: 'select',
  DOUBLE_CLICK: 'double_click',
  RIGHT_CLICK: 'right_click',
};

const STORAGE_KEYS = {
  RECORDED_ACTIONS: 'recordedActions',
  GEMINI_API_KEY: 'geminiApiKey',
  GEMINI_ENABLED: 'geminiEnabled',
  EXECUTION_HISTORY: 'executionHistory',
  USER_PREFERENCES: 'userPreferences',
};

const API_CONFIG = {
  GEMINI_ENDPOINT:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  GEMINI_TIMEOUT: 30000,
  MAX_RETRIES: 3,
};

const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 250,
  POPUP_WIDTH: 400,
};

const SELECTOR_STRATEGIES = {
  ID: 'id',
  CLASS: 'class',
  XPATH: 'xpath',
  CSS: 'css',
  TEXT: 'text',
  ARIA_LABEL: 'aria-label',
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LOG_LEVELS,
    ACTION_TYPES,
    STORAGE_KEYS,
    API_CONFIG,
    UI_CONFIG,
    SELECTOR_STRATEGIES,
  };
}
