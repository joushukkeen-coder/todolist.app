module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/env.js',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 },
    'src/services/': { branches: 80, functions: 90, lines: 90, statements: 90 },
  },
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  testTimeout: 15000,
  maxWorkers: 1,
};
