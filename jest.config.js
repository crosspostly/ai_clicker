/**
 * Jest configuration for AI-Autoclicker
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  
  // Test file patterns (добавлена поддержка tests/)
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.test.js',      // Новая папка для книги тестов!
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
      branches: 45,
      functions: 45,
      lines: 45,
      statements: 45
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
