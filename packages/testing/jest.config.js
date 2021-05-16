/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  rootDir: './',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

module.exports = config
