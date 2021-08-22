import path from 'path'

const BASE_PATH = path.resolve(__dirname, '../../src/__tests__/fixtures')

export const getPaths = () => ({
  base: BASE_PATH,
  api: {
    src: path.resolve(BASE_PATH, './api/src'),
    services: path.resolve(BASE_PATH, './api/src/services'),
    graphql: path.resolve(BASE_PATH, './api/src/graphql'),
  },
})
