// used by cli `rw test` command

const path = require('path')

const { getPaths } = require('@redwoodjs/internal')
const jestConfig = require('jest-config')

jestConfig.readConfigs = require('./jest-config-override').readConfigs

const createBrowserConfig = require('../browser/config/jest.config.browser')
const createNodeConfig = require('../node/config/jest.config.node')

const redwoodPaths = getPaths()

// TODO: Get from redwood.toml/config
const allSides = {
  web: {
    target: 'browser',
    rootDir: redwoodPaths.web.base,
    createConfig: createBrowserConfig,
    color: 'blue',
  },
  api: {
    target: 'node',
    rootDir: redwoodPaths.api.base,
    createConfig: createNodeConfig,
    color: 'red',
  },
}

module.exports = function createJestConfig({ sides }) {
  return {
    collectCoverageFrom: [
      '**/*.{js,jsx,ts,tsx}',
      '!**/node_modules/**',
      '!**/dist/**',
    ],
    coverageDirectory: path.join(redwoodPaths.base, 'coverage'),
    projects: sides.map((key) => {
      const { target: _target, createConfig, color, ...opts } = allSides[key]

      return createConfig({
        displayName: {
          name: key,
          color,
        },
        ...opts,
      })
    }),
  }
}
