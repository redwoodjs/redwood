/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  projects: [
    {
      displayName: 'code',
      setupFilesAfterEnv: ['./jest.setup.js'],
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['**/*.test.+(ts|tsx|js)', '!**/__typetests__/*.ts'],
    },
    {
      displayName: {
        color: 'blue',
        name: 'types',
      },
      runner: 'jest-runner-tsd',
      testMatch: ['**/__typetests__/*.test.ts'],
    },
  ],
}
