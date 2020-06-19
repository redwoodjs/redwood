import { graphql as originalGraphql, rest as originalRest } from 'msw'

import server from './mockServer'

// https://testing-library.com/docs/react-testing-library/setup#custom-render
export * from '@testing-library/react'
export { customRender as render } from './render'

export * from 'msw'
export { server }
export interface GraphQLMock {
  query(...args: Parameters<typeof originalGraphql['query']>): void
  mutation(...args: Parameters<typeof originalGraphql['mutation']>): void
}
export const graphql: GraphQLMock = {
  query: (...args) => server.use(originalGraphql.query(...args)),
  mutation: (...args) => server.use(originalGraphql.mutation(...args)),
}

export interface RestMock {
  get(...args: Parameters<typeof originalRest['get']>): void
  post(...args: Parameters<typeof originalRest['post']>): void
  delete(...args: Parameters<typeof originalRest['delete']>): void
  put(...args: Parameters<typeof originalRest['put']>): void
  patch(...args: Parameters<typeof originalRest['patch']>): void
  options(...args: Parameters<typeof originalRest['options']>): void
}
export const rest: RestMock = {
  get: (...args) => server.use(originalRest.get(...args)),
  post: (...args) => server.use(originalRest.post(...args)),
  delete: (...args) => server.use(originalRest.delete(...args)),
  put: (...args) => server.use(originalRest.put(...args)),
  patch: (...args) => server.use(originalRest.patch(...args)),
  options: (...args) => server.use(originalRest.options(...args)),
}
