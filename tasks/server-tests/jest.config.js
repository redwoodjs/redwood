/** @type {import('jest').Config} */
const config = {
  rootDir: '.',
  testMatch: ['<rootDir>/*.test.mjs'],
  testTimeout: 5_000 * 2,
  transform: {},
}

module.exports = config
