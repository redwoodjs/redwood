/** @type {import('jest').Config} */
const config = {
  testMatch: ['<rootDir>/tests/*.test.mjs'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/templates/'],
  transform: {},
}

module.exports = config
