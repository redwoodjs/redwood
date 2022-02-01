const path = require('path')

const {
  getPaths,
  getApiSideDefaultBabelConfig,
} = require('@redwoodjs/internal')

const rwjsPaths = getPaths()
const NODE_MODULES_PATH = path.join(rwjsPaths.base, 'node_modules')
const { babelrc } = getApiSideDefaultBabelConfig()

// @NOTE: is there a better way we could implmenet this?
if (process.env.SKIP_DB_PUSH !== '1') {
  const process = require('process')
  const path = require('path')
  // Load dotenvs
  require('dotenv-defaults/config')

  const cacheDirDb = `file:${path.join(__dirname, '.redwood', 'test.db')}`
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || cacheDirDb

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

  // If its been reset once, we don't need to re-run it for every test
  process.env.SKIP_DB_PUSH = '1'
}

module.exports = {
  // To make sure other config option which depends on rootDir use
  // correct path, for example, coverageDirectory
  rootDir: rwjsPaths.base,
  roots: [path.join(rwjsPaths.api.src)],
  runner: path.join(__dirname, '../jest-serial-runner.js'),
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
      // When jest runs tests in parallel, it serializes the config before passing down options to babel
      // that's why these must be serializable. So ideally, we should just pass reference to a
      // configFile or "extends" a config. But we need a few other option only at root level, so we'll pass
      //  here and remove those keys inside "extend"ed config.
      {
        babelrc, // babelrc can not reside inside "extend"ed config, that's why we have it here
        configFile: path.resolve(__dirname, './apiBabelConfig.js'),
      },
    ],
  },
}
