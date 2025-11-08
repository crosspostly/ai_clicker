/**
 * Jest configuration for AI-Autoclicker
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },

  // Module transformation
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Module path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/deploy/'
  ],

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000
};
