import { makeExecutableSchema } from '@graphql-tools/schema'
import { parse } from 'graphql'

import { buildLogger } from '../../useInngest/logger'
import { shouldSendEvent } from '../../useInngest/should-send-event'

describe('shouldSendEvent', () => {
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
    },
  })

  describe('when deriving the operation name', () => {
    it('should send event', async () => {
      const should = await shouldSendEvent({
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
        sendOperations: ['query', 'mutation'],
        eventName: 'graphql-test/test-query.query',
        result: { errors: [], data: { test: 'hello' } },
        logger: buildLogger({ logging: false }),
      })

      expect(should).toBe(true)
    })
  })

  describe('when given an operation name', () => {
    describe('and the name matches', () => {
      it('should send event', async () => {
        const should = await shouldSendEvent({
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
          sendOperations: ['query', 'mutation'],
          eventName: 'graphql-test/test-query.query',
          result: { errors: [], data: { test: 'hello' } },
          logger: buildLogger({ logging: false }),
        })

        expect(should).toBe(true)
      })
    })
  })

  describe('anonymous events', () => {
    it('should not send anonymous events', async () => {
      const should = await shouldSendEvent({
        sendAnonymousOperations: false,
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
        sendOperations: ['query', 'mutation'],
        result: { errors: [], data: { test: 'hello' } },
        eventName: 'graphql-test/test-query.query',
        logger: buildLogger({ logging: false }),
      })

      expect(should).toBe(false)
    })

    it('should send anonymous events when configured', async () => {
      const should = await shouldSendEvent({
        sendAnonymousOperations: true,
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
        sendOperations: ['query', 'mutation'],
        result: { errors: [], data: { test: 'hello' } },
        eventName: 'graphql-test/test-query.query',
        logger: buildLogger({ logging: false }),
      })

      expect(should).toBe(true)
    })
  })

  describe('introspection events', () => {
    it('should not send introspection events', async () => {
      const should = await shouldSendEvent({
        sendIntrospection: false,
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`{
            __schema {
              types {
                name
              }
            }
          }`),
            contextValue: {},
          },
        },
        sendOperations: ['query', 'mutation'],
        result: { errors: [], data: {} },
        eventName: '',
        logger: buildLogger({ logging: false }),
      })

      expect(should).toBe(false)
    })

    it('should send introspection events when configured', async () => {
      const should = await shouldSendEvent({
        sendIntrospection: true,
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`{
            __schema {
              types {
                name
              }
            }
          }`),
            contextValue: {},
          },
        },
        sendOperations: ['query', 'mutation'],
        result: { errors: [], data: {} },
        eventName: '',
        logger: buildLogger({ logging: false }),
      })

      expect(should).toBe(true)
    })
  })

  describe('with a denylist', () => {
    describe('denies', () => {
      it('should deny when it matches a denied type', async () => {
        const should = await shouldSendEvent({
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
          denylist: { types: ['Post'] },
          sendOperations: ['query', 'mutation'],
          eventName: 'graphql-test/test-query.query',
          result: {
            errors: [],
            data: { posts: [{ id: 1, __typename: 'Post' }] },
          },
          logger: buildLogger({ logging: false }),
        })

        expect(should).toBe(false)
      })

      it('should deny when it matches a denied schemaCoordinate', async () => {
        const should = await shouldSendEvent({
          params: {
            executeFn: () => {},
            setExecuteFn: () => {},
            setResultAndStopExecution: () => {},
            extendContext: () => {},
            args: {
              // operationName: 'foo',
              schema,
              document: parse(`query FindPosts { posts { id } }`),
              contextValue: {},
            },
          },
          denylist: { schemaCoordinates: ['Query.posts'] },
          sendOperations: ['query', 'mutation'],
          eventName: 'graphql-test/test-query.query',
          result: {
            errors: [],
            data: { posts: [{ id: 1, __typename: 'Post' }] },
          },
          logger: buildLogger({ logging: false }),
        })

        expect(should).toBe(false)
      })
    })

    describe('allows', () => {
      it('should deny when it matches a denied type', async () => {
        const should = await shouldSendEvent({
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
          denylist: { types: ['Comment'] },
          sendOperations: ['query', 'mutation'],
          eventName: 'graphql-test/test-query.query',
          result: {
            errors: [],
            data: { posts: [{ id: 1, __typename: 'Post' }] },
          },
          logger: buildLogger({ logging: false }),
        })

        expect(should).toBe(true)
      })

      it('should deny when it matches a denied schemaCoordinate', async () => {
        const should = await shouldSendEvent({
          params: {
            executeFn: () => {},
            setExecuteFn: () => {},
            setResultAndStopExecution: () => {},
            extendContext: () => {},
            args: {
              // operationName: 'foo',
              schema,
              document: parse(`query FindPosts { posts { id } }`),
              contextValue: {},
            },
          },
          denylist: { schemaCoordinates: ['Query.findPost'] },
          sendOperations: ['query', 'mutation'],
          eventName: 'graphql-test/test-query.query',
          result: {
            errors: [],
            data: { posts: [{ id: 1, __typename: 'Post' }] },
          },
          logger: buildLogger({ logging: false }),
        })

        expect(should).toBe(true)
      })
    })
  })

  describe('errors', () => {
    it('should not send when has errors', async () => {
      const should = await shouldSendEvent({
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
        sendOperations: ['query', 'mutation'],
        eventName: 'graphql-test/test-query.query',
        result: { errors: [{ message: 'Oops' }], data: {} },
        logger: buildLogger({ logging: false }),
      })

      expect(should).toBe(false)
    })

    it('should send when has errors and configured to send', async () => {
      const should = await shouldSendEvent({
        sendErrors: true,
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
        sendOperations: ['query', 'mutation'],
        eventName: 'graphql-test/test-query.query',
        result: { errors: [{ message: 'Oops' }], data: {} },
        logger: buildLogger({ logging: false }),
      })

      expect(should).toBe(true)
    })
  })
})
