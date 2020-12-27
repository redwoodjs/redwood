module.exports = {
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['fixtures'],
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
  },
  testTimeout: 15000,
}
