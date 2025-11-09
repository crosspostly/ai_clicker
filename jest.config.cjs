module.exports = {
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.js',
    '<rootDir>/tests/setup.js'
  ],
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/deploy/'
  ],
  
  // Module resolution
  // Remove moduleNameMapper to let Jest handle imports naturally
  // moduleNameMapper removed as it was causing module resolution issues
  
  // Transform
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.config.js',
    '!src/rollup.config.js',
    '!**/node_modules/**'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40
    }
  },
  
  // CI optimization
  maxWorkers: process.env.CI ? 2 : '50%',
  testTimeout: 10000,
  verbose: true
};