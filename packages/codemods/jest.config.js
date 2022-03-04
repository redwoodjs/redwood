/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: [
    '__fixtures__',
    '__tests__/utils/*',
    '.d.ts',
    'dist',
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 20_000,
}
