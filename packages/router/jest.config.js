/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  projects: [
    {
      setupFilesAfterEnv: ['./jest.setup.js'],
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['**/*.test.+(ts|tsx|js|jsx)', '!**/__typetests__/*.ts'],
    },
  ],
}
