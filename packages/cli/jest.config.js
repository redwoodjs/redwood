module.exports = {
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['fixtures', 'dist'],
  moduleNameMapper: {
    '^src/(.*)': '<rootDir>/src/$1',
  },
  testTimeout: 15000,
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
}
