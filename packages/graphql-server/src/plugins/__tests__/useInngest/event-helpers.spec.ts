import { makeExecutableSchema } from '@graphql-tools/schema'
import { parse } from 'graphql'

import {
  buildOperationId,
  buildOperationNameForEventName,
  buildEventPayload,
  buildEventName,
} from '../../useInngest/event-helpers'
import { buildLogger } from '../../useInngest/logger'

describe('event-helpers', () => {
  const schema = makeExecutableSchema({
    typeDefs: /* GraphQL */ `
      type Post {
        id: ID!
        title: String!
        comments: [Comment!]!
      }

      type Comment {
        id: ID!
        body: String!
      }

      type User {
        id: ID!
        name: String!
        email: String!
      }

      type Query {
        test: String!
        post: Post!
        posts: [Post!]!
      }

      type Mutation {
        updatePost(id: ID!, title: String!): Post!
      }
    `,
    resolvers: {
      Query: {
        test: () => 'hello',
        post: () => ({
          id: '1',
          title: 'hello',
          comments: [{ id: 1, body: 'message' }],
        }),
        posts: () => [
          { id: '1', title: 'hello' },
          { id: '2', title: 'world' },
        ],
      },
      Mutation: {
        updatePost: ({ id, title }) => ({ id, title }),
      },
    },
  })

  describe('buildOperationId', () => {
    it('builds operation id hash based on the document attributes', async () => {
      const result = await buildOperationId({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query TestQuery { test }`),
            contextValue: {},
          },
        },
        logger: buildLogger({ logging: false }),
      })

      expect(result).toEqual(
        'd784eb70fa8312fe840e189dade6d2d7065aefec2bb973d651016df6f5d09ecb'
      )
    })
  })

  describe('buildOperationNameForEventName', () => {
    it('builds operation name used when constructing the event name', async () => {
      const result = await buildOperationNameForEventName({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query TestQuery { test }`),
            contextValue: {},
          },
        },
        logger: buildLogger({ logging: false }),
      })

      expect(result).toEqual('test-query')
    })

    it('builds operation name using a hash when the operation is anonymous', async () => {
      const result = await buildOperationNameForEventName({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query { test }`),
            contextValue: {},
          },
        },
        logger: buildLogger({ logging: false }),
      })

      expect(result).toEqual(
        'anonymous-d32327f2ad0fef67462baf2b8410a2b4b2cc8db57e67bb5b3c95efa595b39f30'
      )
    })
  })

  describe('buildEventName', () => {
    it('builds an event name from parsed document ast', async () => {
      const result = await buildEventName({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query TestQuery { test }`),
            contextValue: {},
          },
        },
        eventNamePrefix: 'graphql-test',
        logger: buildLogger({ logging: false }),
      })

      expect(result).toEqual('graphql-test/test-query.query')
    })

    it('builds an event name from a given operation name', async () => {
      const result = await buildEventName({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            operationName: 'TestQuery',
            schema,
            document: parse(`query TestQuery { test }`),
            contextValue: {},
          },
        },
        eventNamePrefix: 'graphql-test',
        logger: buildLogger({ logging: false }),
      })

      expect(result).toEqual('graphql-test/test-query.query')
    })

    it('builds an event name for an anonymous query', async () => {
      const result = await buildEventName({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query { test }`),
            contextValue: {},
          },
        },
        eventNamePrefix: 'graphql-test',
        logger: buildLogger({ logging: false }),
      })

      expect(result).toEqual(
        'graphql-test/anonymous-d32327f2ad0fef67462baf2b8410a2b4b2cc8db57e67bb5b3c95efa595b39f30.query'
      )
    })
  })

  describe('buildEventPayload', () => {
    it('builds named query with data', async () => {
      const payload = await buildEventPayload({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query TestQuery { test }`),
            contextValue: {},
          },
        },
        eventName: 'graphql-test/test-query.query',
        result: { errors: [], data: { test: 'hello' } },
        logger: buildLogger({ logging: false }),
        includeRawResult: true,
      })

      expect(payload).toEqual({
        operation: { type: 'query', id: 'test-query', name: 'TestQuery' },
        result: { data: { test: 'hello' }, errors: [] },
        identifiers: [],
        types: [],
        variables: {},
      })
    })

    it('builds named query with just types and identifiers', async () => {
      const payload = await buildEventPayload({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query FindPosts { posts { id } }`),
            contextValue: {},
          },
        },
        eventName: 'graphql-test/test-query.query',
        result: {
          data: {
            posts: [
              { id: 5, __typename: 'Post' },
              { id: 7, __typename: 'Post' },
              { id: 11, __typename: 'Post' },
            ],
          },
        },
        logger: buildLogger({ logging: false }),
      })

      expect(payload).toEqual({
        operation: { type: 'query', id: 'find-posts', name: 'FindPosts' },
        result: {},
        identifiers: [
          { typename: 'Post', id: 5 },
          { typename: 'Post', id: 7 },
          { typename: 'Post', id: 11 },
        ],
        types: ['Post'],
        variables: {},
      })
    })

    it('builds named query with data and types and identifiers', async () => {
      const payload = await buildEventPayload({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query FindPosts { posts { id } }`),
            contextValue: {},
          },
        },
        eventName: 'graphql-test/test-query.query',
        result: {
          errors: [],
          data: {
            posts: [
              { id: 5, __typename: 'Post' },
              { id: 7, __typename: 'Post' },
              { id: 11, __typename: 'Post' },
            ],
          },
        },
        logger: buildLogger({ logging: false }),
        includeRawResult: true,
      })

      expect(payload).toEqual({
        operation: { type: 'query', id: 'find-posts', name: 'FindPosts' },
        result: {
          data: {
            posts: [
              { id: 5, __typename: 'Post' },
              { id: 7, __typename: 'Post' },
              { id: 11, __typename: 'Post' },
            ],
          },
          errors: [],
        },
        identifiers: [
          { typename: 'Post', id: 5 },
          { typename: 'Post', id: 7 },
          { typename: 'Post', id: 11 },
        ],
        types: ['Post'],
        variables: {},
      })
    })

    it('builds payload for a mutation', async () => {
      const payload = await buildEventPayload({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(
              `mutation UpdatePost($id: Int!, $title: String!) { updatePost(id: $id, title: $title) { id title } }`
            ),
            variableValues: { id: 1, title: 'updated title' },
            contextValue: {},
          },
        },
        eventName: 'graphql-test/update-post.mutation',
        result: {
          errors: [],
          data: {
            updatePost: { id: 1, title: 'updated title', __typename: 'Post' },
          },
        },
        logger: buildLogger({ logging: false }),
      })

      expect(payload).toEqual({
        operation: {
          type: 'mutation',
          id: 'update-post',
          name: 'UpdatePost',
        },
        result: {},
        identifiers: [{ typename: 'Post', id: 1 }],
        types: ['Post'],
        variables: { id: 1, title: 'updated title' },
      })
    })

    it('builds anonymous query', async () => {
      const payload = await buildEventPayload({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query { test }`),
            contextValue: {},
          },
        },
        sendAnonymousOperations: true,
        includeRawResult: true,
        eventName: 'graphql-test/test-query.query',
        result: { errors: [], data: { test: 'hello' } },
        logger: buildLogger({ logging: false }),
      })

      expect(payload).toEqual({
        operation: {
          type: 'query',
          id: 'anonymous-d32327f2ad0fef67462baf2b8410a2b4b2cc8db57e67bb5b3c95efa595b39f30',
          name: '',
        },
        result: {
          data: { test: 'hello' },
          errors: [],
        },
        identifiers: [],
        types: [],
        variables: {},
      })
    })
  })

  describe('redaction', () => {
    it('builds payload for a redacted query', async () => {
      const payload = await buildEventPayload({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query TestRedactedQuery { test }`),
            contextValue: {},
          },
        },
        redactRawResultOptions: { paths: ['*.test'], censor: '***' },
        eventName: 'graphql-test/test-query.query',
        result: { errors: [], data: { test: 'hello' } },
        logger: buildLogger({ logging: false }),
        includeRawResult: true,
      })

      expect(payload).toEqual({
        operation: {
          type: 'query',
          id: 'test-redacted-query',
          name: 'TestRedactedQuery',
        },
        result: {
          data: { test: '***' },
          errors: [],
        },
        identifiers: [],
        types: [],
        variables: {},
      })
    })

    it('builds payload for a redacted mutation', async () => {
      const payload = await buildEventPayload({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(
              `mutation UpdatePost($id: Int!, $title: String!) { updatePost(id: $id, title: $title) { id title } }`
            ),
            variableValues: { id: 1, title: 'updated title' },
            contextValue: {},
          },
        },
        redactRawResultOptions: { paths: ['title'], censor: '***' },
        eventName: 'graphql-test/update-post.mutation',
        result: {
          errors: [],
          data: {
            updatePost: { id: 1, title: 'updated title', __typename: 'Post' },
          },
        },
        logger: buildLogger({ logging: false }),
      })

      expect(payload).toEqual({
        operation: {
          type: 'mutation',
          id: 'update-post',
          name: 'UpdatePost',
        },
        result: {},
        identifiers: [{ typename: 'Post', id: 1 }],
        types: ['Post'],
        variables: { id: 1, title: '***' },
      })
    })
  })
})
