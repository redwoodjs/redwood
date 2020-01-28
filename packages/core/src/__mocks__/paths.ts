import path from 'path'

const BASE_PATH = path.resolve(__dirname, '../__tests__/fixtures')

export const getPaths = () => ({
  api: {
    services: path.resolve(BASE_PATH, './api/src/services'),
    graphql: path.resolve(BASE_PATH, './api/src/graphql'),
  }
})