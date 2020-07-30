module.exports = {
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['fixtures', '__fixtures__', '__snapshots__'],
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
  },
  testTimeout: 15000,
  setupFilesAfterEnv: ['./jest.setup.js'],
}
