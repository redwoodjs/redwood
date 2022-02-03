const { defaults } = require('jest-config');

module.exports = {
  rootDir: '../',
  preset: '@redwoodjs/testing/config/jest/web',
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
}
