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
  it('Returns the origin correctly when configured in handler', async () => {
    const handler = createGraphQLHandler({
      loggerConfig: { logger: createLogger({}), options: {} },
      sdls: {},
      directives: {},
      services: {},
      cors: {
        origin: 'https://web.redwoodjs.com',
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

    const response = await handler(mockedEvent, {} as Context)

    expect(response.statusCode).toBe(200)
    expect(response.multiValueHeaders['access-control-allow-origin']).toEqual([
      'https://web.redwoodjs.com',
    ])
  })

  it('Returns requestOrigin if cors origin set to true', async () => {
    const handler = createGraphQLHandler({
      loggerConfig: { logger: createLogger({}), options: {} },
      sdls: {},
      directives: {},
      services: {},
      cors: {
        origin: true,
      },
      onException: () => {},
    })

    // We don't need to fully mock out a lambda event for these tests
    const mockedEvent = {
      headers: {
        origin: 'https://someothersite.newjsframework.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '{ me { id, name } }' }),
      httpMethod: 'POST',
      multiValueQueryStringParameters: null,
    } as unknown as APIGatewayProxyEvent

    const response = await handler(mockedEvent, {} as Context)

    expect(response.statusCode).toBe(200)
    expect(response.multiValueHeaders['access-control-allow-origin']).toEqual([
      'https://someothersite.newjsframework.com',
    ])
  })

  it('Returns the origin for OPTIONS requests', async () => {
    const handler = createGraphQLHandler({
      loggerConfig: { logger: createLogger({}), options: {} },
      sdls: {},
      directives: {},
      services: {},
      cors: {
        origin: 'https://mycrossdomainsite.co.uk',
      },
      onException: () => {},
    })

    // We don't need to fully mock out a lambda event for these tests
    const mockedEvent = {
      headers: {
        origin: 'https://someothersite.newjsframework.com',
        'Content-Type': 'application/json',
      },
      httpMethod: 'OPTIONS',
      multiValueQueryStringParameters: null,
    } as unknown as APIGatewayProxyEvent

    const response = await handler(mockedEvent, {} as Context)

    expect(response.statusCode).toBe(204)
    expect(response.multiValueHeaders['access-control-allow-origin']).toEqual([
      'https://mycrossdomainsite.co.uk',
    ])
  })

  it('Returns the requestOrigin when moore than one origin supplied in config', async () => {
    const handler = createGraphQLHandler({
      loggerConfig: { logger: createLogger({}), options: {} },
      sdls: {},
      directives: {},
      services: {},
      cors: {
        origin: ['https://site1.one', 'https://site2.two'],
      },
      onException: () => {},
    })

    // We don't need to fully mock out a lambda event for these tests
    const mockedEvent = {
      headers: {
        origin: 'https://site2.two',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '{ me { id, name } }' }),
      httpMethod: 'POST',
      multiValueQueryStringParameters: null,
    } as unknown as APIGatewayProxyEvent

    const response = await handler(mockedEvent, {} as Context) //?

    expect(response.statusCode).toBe(200)
    expect(response.multiValueHeaders['access-control-allow-origin']).toEqual([
      'https://site2.two',
    ])
  })
})
