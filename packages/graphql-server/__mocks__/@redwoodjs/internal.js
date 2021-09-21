import path from 'path'

const BASE_PATH = path.resolve(__dirname, '../../src/__tests__/fixtures')

const originalInternal = require('@redwoodjs/internal')

const mockedGetPaths = () => ({
  base: BASE_PATH,
  api: {
    src: path.resolve(BASE_PATH, './api/src'),
    services: path.resolve(BASE_PATH, './api/src/services'),
    graphql: path.resolve(BASE_PATH, './api/src/graphql'),
  },
})

module.exports = {
  ...originalInternal,
  getPaths: mockedGetPaths,
}
