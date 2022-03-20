module.exports = {
  testMatch: ['**/src/__tests__/*.test.ts'],
  testPathIgnorePatterns: [],
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
  },
  testTimeout: 15000,
}
