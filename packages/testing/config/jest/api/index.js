const path = require('path')

const {
  getPaths,
  getApiSideDefaultBabelConfig,
} = require('@redwoodjs/internal')

const rwjsPaths = getPaths()
const NODE_MODULES_PATH = path.join(rwjsPaths.base, 'node_modules')
const { configFile, babelrc } = getApiSideDefaultBabelConfig()

module.exports = {
  roots: ['<rootDir>/src/'],
  testEnvironment: path.join(__dirname, './RedwoodApiJestEnv.js'),
  displayName: {
    color: 'redBright',
    name: 'api',
  },
  setupFilesAfterEnv: [path.join(__dirname, './jest.setup.js')],
  moduleNameMapper: {
    // @NOTE: Import @redwoodjs/testing in api tests, and it automatically remaps to the api side only
    // This is to prevent web stuff leaking into api, and vice versa
    '^@redwoodjs/testing$': path.join(
      NODE_MODULES_PATH,
      '@redwoodjs/testing/api'
    ),
  },
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      // When jest runs tests in parallel, it serializes the config before passing down options to babel
      // that's why these must be serializable. So ideally, we should just pass reference to a
      // configFile or "extends" a config. But we need a few other option only at root level, so we'll pass
      //  here and remove those keys inside "extend"ed config.
      {
        configFile, // configFile must be at root level
        babelrc, // babelrc can not reside inside "extend"ed config, that's why we have it here
        extends: path.resolve(__dirname, './apiBabelConfig.js'),
      },
    ],
  },
}
