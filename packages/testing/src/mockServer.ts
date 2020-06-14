// @ts-nocheck

import path from 'path'

import gql from 'graphql-tag'
import { setupServer } from 'msw/node'
import { graphqlContext } from 'msw'
import {
  createGraphQLServer,
  makeMergedSchema,
  makeServices,
} from '@redwoodjs/api'
import { createTestClient } from 'apollo-server-testing'

import { RequestInterceptor } from './RequestInterceptor'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getPaths } = require('@redwoodjs/internal')

const redwoodPaths = getPaths()

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

const schemas = [
  require(path.join(redwoodPaths.api.base, 'dist', 'graphql', 'posts.sdl.js')),
]

const services = [
  require(path.join(
    redwoodPaths.api.base,
    'dist',
    'services',
    'posts',
    'posts.js'
  )),
]

export const graphQLServer = createGraphQLServer({
  context: {},
  schema: makeMergedSchema({
    schemas,
    services: makeServices({ services }),
  }),
  db,
})

const testClient = createTestClient(graphQLServer)

const interceptor = new RequestInterceptor()

interceptor.use(async (req) => {
  const body = JSON.parse(req.body)

  if (!body.query) return

  const result = await testClient.query({
    query: body.query,
    variables: body.variables,
  })

  return {
    status: 200,
    body: JSON.stringify({ data: result.data }),
  }
})

// function withApi(resolver) {
//   return {
//     resolver
//   }
// }

export default {}
