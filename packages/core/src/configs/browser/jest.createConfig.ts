// used by cli `rw test` command

const path = require('path')

const { getPaths } = require('@redwoodjs/internal')

const redwoodPaths = getPaths()

const NODE_MODULES_PATH = path.join(redwoodPaths.base, 'node_modules')

export default function getBrowserJestConfig() {
  return {
    displayName: {
      color: 'blueBright',

      // TODO: Detect which side this is and name it that instead
      name: 'browser',
    },

    resolver: 'jest-directory-named-resolver',
    // NOTE: We run the tests with a `cwd` argument that's `getPaths().web.base`
    // testMatch,
    globals: {
      __REDWOOD__: true,
      __REDWOOD__API_PROXY_PATH: '/',
    },
    // transform: { '\\.js$': ['babel-jest', { rootMode: 'upward' }] },
    setupFilesAfterEnv: [path.resolve(__dirname, './jest.setup.js')],
    moduleNameMapper: {
      /**
       * Make sure modules that require different versions of these
       * dependencies end up using the same one.
       */
      '^react$': path.join(NODE_MODULES_PATH, 'react'),
      '^react-dom$': path.join(NODE_MODULES_PATH, 'react-dom'),
      '^@apollo/react-common$': path.join(
        NODE_MODULES_PATH,
        '@apollo/react-common'
      ),
      // We replace imports to "@redwoodjs/router" with our own implementation.
      '^@redwoodjs/router$': path.join(
        NODE_MODULES_PATH,
        '@redwoodjs/testing/dist/MockRouter.js'
      ),
      '^@redwoodjs/web$': path.join(NODE_MODULES_PATH, '@redwoodjs/web'),
      '^@redwoodjs/testing$': path.join(
        NODE_MODULES_PATH,
        '@redwoodjs/testing'
      ),
      '~__REDWOOD__USER_ROUTES_FOR_MOCK': getPaths().web.routes,
      /**
       * Mock out files that aren't particularly useful in tests. See fileMock.js for more info.
       */
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|css)$':
        '@redwoodjs/testing/dist/fileMock.js',
    },
  }
}
