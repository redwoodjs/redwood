// MSW is shared by Jest (NodeJS) and Storybook (Webpack)
import * as msw from 'msw'

export const start = async () => {
  if (SERVER) {
    return SERVER
  }
  if (typeof global.process === 'undefined') {
    const { setupWorker } = require('msw')
    SERVER = setupWorker()
  } else {
    const { setupServer } = require('msw/node')
    SERVER = setupServer()
  }

  await SERVER.start()
  return SERVER
}

let SERVER: any
export const getServer = () => {
  if (!SERVER) {
    throw new Error(
      'You must start MSW by calling `msw.start` (from @redwoodjs/testing) and waiting for the execution to complete.'
    )
  }
  return SERVER
}

export interface GraphQLMock {
  query(...args: Parameters<typeof msw.graphql.query>): void
  mutation(...args: Parameters<typeof msw.graphql.mutation>): void
}
export const graphql: GraphQLMock = {
  query: (...args) => getServer().use(msw.graphql.query(...args)),
  mutation: (...args) => getServer().use(msw.graphql.mutation(...args)),
}

export interface RestMock {
  get(...args: Parameters<typeof msw.rest.get>): void
  post(...args: Parameters<typeof msw.rest.post>): void
  delete(...args: Parameters<typeof msw.rest.delete>): void
  put(...args: Parameters<typeof msw.rest.put>): void
  patch(...args: Parameters<typeof msw.rest.patch>): void
  options(...args: Parameters<typeof msw.rest.options>): void
}
export const rest: RestMock = {
  get: (...args) => getServer().use(msw.rest.get(...args)),
  post: (...args) => getServer().use(msw.rest.post(...args)),
  delete: (...args) => getServer().use(msw.rest.delete(...args)),
  put: (...args) => getServer().use(msw.rest.put(...args)),
  patch: (...args) => getServer().use(msw.rest.patch(...args)),
  options: (...args) => getServer().use(msw.rest.options(...args)),
}
