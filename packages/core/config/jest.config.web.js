// used by cli `rw test` command

const path = require('path')

const { getPaths } = require('@redwoodjs/internal')

const redwoodPaths = getPaths()

module.exports = {
  resolver: 'jest-directory-named-resolver',
  rootDir: process.cwd(),
  globals: {
    __REDWOOD__API_PROXY_PATH: '/',
  },
  // TODO: use getPaths().web.base instead.
  setupFilesAfterEnv: [path.resolve(__dirname, './jest.setup.web.js')],
  moduleNameMapper: {
    /**
     * Make sure modules that require different versions of these
     * dependencies end up using the same one.
     */
    '^react$': path.resolve(redwoodPaths.base, 'node_modules', 'react'),
    '^react-dom$': path.resolve(redwoodPaths.base, 'node_modules', 'react-dom'),
    '^@apollo/react-common': path.resolve(
      redwoodPaths.base,
      'node_modules',
      '@apollo/react-common'
    ),

    /**
     * Mock out files that aren't particularly useful in tests. See fileMock.js for more info.
     */
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|css)$': path.resolve(
      __dirname,
      'fileMock.js'
    ),
  },
}
