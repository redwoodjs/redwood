const path = require('path')

const {
  getPaths,
  getApiSideDefaultBabelConfig,
  getApiSideBabelPresets,
  getApiSideBabelPlugins,
} = require('@redwoodjs/internal')

const rwjsPaths = getPaths()
const NODE_MODULES_PATH = path.join(rwjsPaths.base, 'node_modules')

// @TODO
// @TODO Not sure this logic is super solid, also needs the db push code removed from the cli
// @TODO
if (!process.env.DATABASE_URL) {
  const process = require('process')
  const path = require('path')
  const cacheDirDb = `file:${path.join(__dirname, '.redwood', 'test.db')}`
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || cacheDirDb


  console.log('~~~~~~~~~~~~~ CALLLED ~~~~~~~~~~~~~~~~~~~')
  console.log(Date.now())

  const execa = require('execa')
  execa.sync(
    `yarn rw`,
    ['prisma db push', '--force-reset', '--accept-data-loss'],
    {
      cwd: rwjsPaths.api.base,
      stdio: 'inherit',
      shell: true,
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
      },
    }
  )
}

module.exports = {
  // To make sure other config option which depends on rootDir use
  // correct path, for example, coverageDirectory
  rootDir: rwjsPaths.base,
  roots: [path.join(rwjsPaths.api.base, 'src')],
  testEnvironment: path.join(__dirname, './RedwoodApiJestEnv.js'),
  displayName: {
    color: 'redBright',
    name: 'api',
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: path.join(rwjsPaths.base, 'coverage'),
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
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
        plugins: getApiSideBabelPlugins({ forJest: true }),
        presets: getApiSideBabelPresets({
          presetEnv: true, // jest needs code transpiled
        }),
      },
    ],
  },
}
