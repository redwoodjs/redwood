import { graphql as originalGraphql } from 'msw'

import server from './mockServer'

// https://testing-library.com/docs/react-testing-library/setup#custom-render
export * from '@testing-library/react'
export { customRender as render } from './render'

export * from 'msw'

interface GraphQLMock {
  query(...args: Parameters<typeof originalGraphql['query']>): void
  mutation(...args: Parameters<typeof originalGraphql['mutation']>): void
}

const graphql: GraphQLMock = {
  query: (...args) => server.use(originalGraphql.query(...args)),
  mutation: (...args) => server.use(originalGraphql.mutation(...args)),
}

export { server, graphql }
