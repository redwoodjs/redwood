const { defaults } = require('jest-config');

const config = {
  rootDir: '../',
  preset: '@redwoodjs/testing/config/jest/web',
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
}

module.exports = config
