import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

import { createLogger } from '@redwoodjs/api/logger'

import { createGraphQLHandler } from '../../functions/graphql'

jest.mock('../../makeMergedSchema/makeMergedSchema', () => {
  const { makeExecutableSchema } = require('@graphql-tools/schema')
  // const { ForbiddenError } = require('@redwoodjs/graphql-server/dist/errors')
  // const { EmailValidationError, RedwoodError } = require('@redwoodjs/api')

  // const { CurrencyResolver } = require('graphql-scalars')

  // class WeatherError extends RedwoodError {
  //   constructor(message: string, extensions?: Record<string, any>) {
  //     super(message, extensions)
  //   }
  // }

  // Return executable schema
  return {
    makeMergedSchema: () =>
      makeExecutableSchema({
        typeDefs: /* GraphQL */ `
          type Post {
            id: Int!
            title: String!
            body: String!
          }

          type Query {
            posts: [Post!]!
            post(id: Int!): Post
          }
        `,
        resolvers: {
          Query: {
            posts: () => {
              return [{ id: 1, title: 'Ba', body: 'Zinga' }]
            },
            post: (id) => {
              return {
                id,
                title: 'Ba',
                body: 'Zinga',
              }
            },
          },
        },
      }),
  }
})

jest.mock('../../directives/makeDirectives', () => {
  return {
    makeDirectivesForPlugin: () => [],
  }
})

interface MockLambdaParams {
  headers?: { [key: string]: string }
  body?: string | null
  httpMethod: string
  [key: string]: any
}

const mockLambdaEvent = ({
  headers,
  body = null,
  httpMethod,
  ...others
}: MockLambdaParams): APIGatewayProxyEvent => {
  return {
    headers: headers || {},
    body,
    httpMethod,
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    multiValueHeaders: {}, // this is silly - the types require a value. It definitely can be undefined, e.g. on Vercel.
    path: '/graphql',
    pathParameters: null,
    stageVariables: null,
    queryStringParameters: null,
    requestContext: null as any,
    resource: null as any,
    ...others,
  }
}

describe('useGraphQLArmor', () => {
  describe('when blocking field suggestions', () => {
    it('returns the field suggestion masked', async () => {
      const handler = createGraphQLHandler({
        loggerConfig: { logger: createLogger({}), options: {} },
        sdls: {},
        directives: {},
        services: {},
        onException: () => {},
      })

      const mockedEvent = mockLambdaEvent({
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '{ posts { id, toootle } }' }),
        httpMethod: 'POST',
      })

      const response = await handler(mockedEvent, {} as Context)
      const { data, errors } = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(data).toBeUndefined()
      expect(errors[0].message).toEqual(
        'Cannot query field "toootle" on type "Post". [Suggestion hidden]?'
      )
    })
  })
})
