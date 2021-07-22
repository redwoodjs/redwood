/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  rootDir: './',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = config
