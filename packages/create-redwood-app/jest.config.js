/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['fixtures', 'api/src', 'web/src'],
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
  },
  testTimeout: 15000,
}
