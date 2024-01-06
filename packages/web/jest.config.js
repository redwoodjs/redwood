/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '**/*.test.+(ts|tsx|js|jsx)',
    '!**/__typetests__/*.+(ts|tsx|js|jsx)',
  ],
  globals: {
    // Required for code that use experimental flags
    RWJS_ENV: {},
  },
  moduleNameMapper: {
    'virtual-possibleTypes': '@redwoodjs/testing/dist/web/possibleTypes',
  },
}
