import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

import { createLogger } from '@redwoodjs/api/logger'

import { createGraphQLHandler } from '../functions/graphql'

jest.mock('../makeMergedSchema/makeMergedSchema', () => {
  const { makeExecutableSchema } = require('@graphql-tools/schema')
  // Return executable schema
  return {
    makeMergedSchema: () =>
      makeExecutableSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            me: User!
          }

          type Query {
            forbiddenUser: User!
            getUser(id: Int!): User!
          }

          type User {
            id: ID!
            name: String!
          }
        `,
        resolvers: {
          Query: {
            me: () => {
              return { _id: 1, firstName: 'Ba', lastName: 'Zinga' }
            },
            forbiddenUser: () => {
              throw Error('You are forbidden')
            },
            getUser: (id) => {
              return { id, firstName: 'Ba', lastName: 'Zinga' }
            },
          },
          User: {
            id: (u) => u._id,
            name: (u) => `${u.firstName} ${u.lastName}`,
          },
        },
      }),
  }
})

jest.mock('../directives/makeDirectives', () => {
  return {
    makeDirectivesForPlugin: () => [],
  }
})

describe('CORS', () => {
  it('does stuff', async () => {
    const handler = createGraphQLHandler({
      loggerConfig: { logger: createLogger({}), options: {} },
      sdls: {},
      directives: {},
      services: {},
      cors: {
        origin: 'https://redwoodjs.com',
      },
      onException: () => {},
    })

    // We don't need to fully mock out a lambda event for these tests
    const mockedEvent = {
      headers: {
        origin: 'https://redwoodjs.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '{ me { id, name } }' }),
      httpMethod: 'POST',
      multiValueQueryStringParameters: null,
    } as unknown as APIGatewayProxyEvent

    const response = await handler(mockedEvent, {} as Context) //?

    expect(response.statusCode).toBe(200)
    expect(response.multiValueHeaders['access-control-allow-origin']).toBe(null)
  })
})
