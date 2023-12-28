/** @type {import('jest').Config} */
const config = {
  testPathIgnorePatterns: ['/node_modules/', '/fixtures/'],
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/__tests__/'],
}

module.exports = config
