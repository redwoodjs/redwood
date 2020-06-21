// @ts-nocheck

import path from 'path'

import { setupServer } from 'msw/node'
import { restContext } from 'msw'
import {
  createGraphQLServer,
  makeMergedSchema,
  makeServices,
} from '@redwoodjs/api'
import { createTestClient } from 'apollo-server-testing'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getPaths } = require('@redwoodjs/internal')

const redwoodPaths = getPaths()

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client')
export const db = new PrismaClient()

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

const withApi = (resolver) => {
  return {
    predicate: () => true,
    resolver,
    defineContext() {
      return restContext
    },
  }
}

export const server = setupServer(
  withApi(async (req, res, ctx) => {
    const { body } = req

    if (!body.query) return

    const result = await testClient.query({
      query: body.query,
      variables: body.variables,
    })

    return res(ctx.json({ data: result.data }))
  })
)
