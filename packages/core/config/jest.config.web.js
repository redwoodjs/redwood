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
  setupFilesAfterEnv: [path.resolve(__dirname, './jest.setup.web.js')],
  moduleNameMapper: {
    '^react$': path.resolve(redwoodPaths.base, 'node_modules', 'react'),
    '^react-dom$': path.resolve(redwoodPaths.base, 'node_modules', 'react-dom'),
    '^@apollo/react-common': path.resolve(
      redwoodPaths.base,
      'node_modules',
      '@apollo/react-common'
    ),
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|css)$': path.resolve(
      __dirname,
      'fileMock.js'
    ),
    '~/web/Routes': '<rootDir>/src/Routes',
  },
}
