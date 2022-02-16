const { defaults } = require('jest-config');

module.exports = {
  ...require('@redwoodjs/testing/config/jest/web'),
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
}
