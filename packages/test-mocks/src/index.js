const mockfs = require('mock-fs')

const DEFAULT_CONFIG = ''
const DEFAULT_PATHS = (config) => ({
  '/path/to/project': {
    'redwood.toml': config,
    web: {
      src: {
        pages: {
          HomePage: { 'HomePage.js': '' },
          AboutPage: { 'AboutPage.js': '' },
          Admin: { UsersPage: { 'UsersPage.js': '' } },
        },
      },
    },
  },
})

jest.mock('findup-sync', () => {
  // TODO: Make this configurable.
  return () => '/path/to/project/redwood.toml'
})

exports.mockProject = (config = DEFAULT_CONFIG, paths) => {
  if (!paths) {
    paths = DEFAULT_PATHS(config)
  }
  mockfs(paths)
}

exports.restore = () => {
  mockfs.restore()
  jest.clearAllMocks()
}
