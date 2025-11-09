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
  SETTINGS: 'settings',
};

export const API_CONFIG = {
  GEMINI_ENDPOINT:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  GEMINI_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  GEMINI_LIVE_MODELS: [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ],
  VOICE_TIMEOUT: 120000,
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

export const VOICE_MESSAGE_TYPES = {
  VOICE_START: 'VOICE_START',
  VOICE_STOP: 'VOICE_STOP',
  VOICE_DATA: 'VOICE_DATA',
  VOICE_TRANSCRIPTION: 'VOICE_TRANSCRIPTION',
  VOICE_COMMAND: 'VOICE_COMMAND',
  VOICE_ERROR: 'VOICE_ERROR',
};

export const SETTINGS_MESSAGE_TYPES = {
  SETTINGS_GET: 'SETTINGS_GET',
  SETTINGS_SET: 'SETTINGS_SET',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
  SETTINGS_EXPORT: 'SETTINGS_EXPORT',
  SETTINGS_IMPORT: 'SETTINGS_IMPORT',
};

export const LANGUAGES = {
  AUTO: 'auto',
  ENGLISH: 'en',
  RUSSIAN: 'ru',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

export const DEFAULT_SETTINGS = {
  gemini: {
    apiKey: '',
    model: 'auto',
    timeout: 120000,
    language: 'auto',
  },
  ui: {
    theme: 'dark',
    compactMode: false,
  },
  shortcuts: {
    toggleRecording: 'Ctrl+Shift+R',
    toggleVoice: 'Ctrl+Shift+V',
    playback: 'Ctrl+Shift+P',
  },
};

