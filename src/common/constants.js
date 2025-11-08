/**
 * Global constants for the AI Autoclicker extension
 */

export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

export const ACTION_TYPES = {
  CLICK: 'click',
  INPUT: 'input',
  HOVER: 'hover',
  SCROLL: 'scroll',
  WAIT: 'wait',
  SELECT: 'select',
  DOUBLE_CLICK: 'double_click',
  RIGHT_CLICK: 'right_click',
};

export const STORAGE_KEYS = {
  RECORDED_ACTIONS: 'recordedActions',
  GEMINI_API_KEY: 'geminiApiKey',
  GEMINI_ENABLED: 'geminiEnabled',
  EXECUTION_HISTORY: 'executionHistory',
  USER_PREFERENCES: 'userPreferences',
};

export const API_CONFIG = {
  GEMINI_ENDPOINT:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  GEMINI_TIMEOUT: 30000,
  MAX_RETRIES: 3,
};

export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 250,
  POPUP_WIDTH: 400,
};

export const SELECTOR_STRATEGIES = {
  ID: 'id',
  CLASS: 'class',
  XPATH: 'xpath',
  CSS: 'css',
  TEXT: 'text',
  ARIA_LABEL: 'aria-label',
};

