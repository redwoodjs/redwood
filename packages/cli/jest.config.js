/** @type {import('jest').Config} */
module.exports = {
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['fixtures', 'dist'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^src/(.*)': '<rootDir>/src/$1',
  },
  testTimeout: 60000,
  setupFilesAfterEnv: ['./jest.setup.js'],
}
