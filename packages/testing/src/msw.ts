// MSW is shared by Jest (NodeJS) and Storybook (Webpack).
import * as msw from 'msw'

export const start = async () => {
  if (SERVER) {
    console.log('it returns the server')
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

// export interface RestMock {
//   get(...args: Parameters<typeof originalRest['get']>): void
//   post(...args: Parameters<typeof originalRest['post']>): void
//   delete(...args: Parameters<typeof originalRest['delete']>): void
//   put(...args: Parameters<typeof originalRest['put']>): void
//   patch(...args: Parameters<typeof originalRest['patch']>): void
//   options(...args: Parameters<typeof originalRest['options']>): void
// }
// export const rest: RestMock = {
//   get: (...args) => server.use(originalRest.get(...args)),
//   post: (...args) => server.use(originalRest.post(...args)),
//   delete: (...args) => server.use(originalRest.delete(...args)),
//   put: (...args) => server.use(originalRest.put(...args)),
//   patch: (...args) => server.use(originalRest.patch(...args)),
//   options: (...args) => server.use(originalRest.options(...args)),
// }
