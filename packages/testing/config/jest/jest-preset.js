// used by cli `rw test` command as --configFile
// and as `preset` for api and web site jest config
// Ref: (./api/jest.config.js and ./web/jest.config.js)

const path = require('path')

const { getPaths } = require('@redwoodjs/internal')

const redwoodPaths = getPaths()

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: path.join(redwoodPaths.base, 'coverage'),
  rootDir: redwoodPaths.base,
  projects: ['<rootDir>/{,!(node_modules)/**/}jest.config.js'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}
