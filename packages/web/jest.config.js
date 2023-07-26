/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  projects: [
    {
      displayName: 'code',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: [
        '**/*.test.+(ts|tsx|js|jsx)',
        '!**/__typetests__/*.+(ts|tsx|js|jsx)',
      ],
    },
    {
      displayName: {
        color: 'blue',
        name: 'types',
      },
      runner: 'jest-runner-tsd',
      testMatch: ['**/__typetests__/*.test.+(ts|tsx|js|jsx)'],
    },
  ],
}
