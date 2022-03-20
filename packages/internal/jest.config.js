module.exports = {
  testMatch: [
    '**/src/**/__tests__/**/*.[jt]s(x)?',
    '**/src/**/*.test.[jt]s(x)?',
  ],
  testPathIgnorePatterns: ['fixtures'],
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
  },
  testTimeout: 15000,
}
