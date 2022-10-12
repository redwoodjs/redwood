const path = require('path')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['fixtures', 'dist'],
  resolver: path.resolve(__dirname, './resolver.js'),
}
