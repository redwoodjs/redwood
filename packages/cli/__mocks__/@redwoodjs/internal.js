import path from 'path'

const BASE_PATH = '.'

export const getPaths = () => ({
  base: BASE_PATH,
  api: {
    src: path.resolve(BASE_PATH, './api/src'),
    services: path.resolve(BASE_PATH, './api/src/services'),
    graphql: path.resolve(BASE_PATH, './api/src/graphql'),
  },
  web: {
    routes: './web/src/Routes.js',
  },
})
