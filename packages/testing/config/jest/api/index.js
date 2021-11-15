const path = require('path')

const {
  getPaths,
  getApiSideDefaultBabelConfig,
  getApiSideBabelPresets,
} = require('@redwoodjs/internal')

const rwjsPaths = getPaths()
const NODE_MODULES_PATH = path.join(rwjsPaths.base, 'node_modules')

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
      {
        ...getApiSideDefaultBabelConfig(),
        presets: getApiSideBabelPresets({
          presetEnv: true, // jest needs code transpiled
        }),
      },
    ],
  },
}
