import { makeExecutableSchema } from '@graphql-tools/schema'
import { parse } from 'graphql'

import { buildLogger } from '../../useInngest/logger'
import {
  isAnonymousOperation,
  isIntrospectionQuery,
  sendOperation,
  getOperationInfo,
  buildTypeIdentifiers,
  denySchemaCoordinate,
  denyType,
} from '../../useInngest/schema-helpers'
import type { UseInngestExecuteOptions } from '../../useInngest/types'

describe('schema-helpers', () => {
  const logger = buildLogger({ logging: false })

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

  describe('isAnonymousOperation', () => {
    it('knows if the operation is anonymous', () => {
      const isAnon = isAnonymousOperation({
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`query { test }`),
          contextValue: {},
        },
      })

      expect(isAnon).toBe(true)
    })

    it('knows if the operation is not anonymous', () => {
      const isAnon = isAnonymousOperation({
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`query TestQuery { test }`),
          contextValue: {},
        },
      })

      expect(isAnon).toBe(false)
    })
  })

  describe('getOperation', () => {
    it('gets a query', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`query TestQuery { test }`),
          contextValue: {},
        },
      }

      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }
      const { operationType } = getOperationInfo(options)

      expect(operationType).toBe('query')
    })

    it('gets a mutation', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`mutation TestMutation { test }`),
          contextValue: {},
        },
      }

      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }
      const { operationType } = getOperationInfo(options)

      expect(operationType).toBe('mutation')
    })

    it('gets a subscription', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`subscription TestSubscription { test }`),
          contextValue: {},
        },
      }

      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }
      const { operationType } = getOperationInfo(options)

      expect(operationType).toBe('subscription')
    })
  })

  describe('extractOperationName', () => {
    it('gets a named query operation', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`query TestQuery { test }`),
          contextValue: {},
        },
      }
      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }
      const { operationName } = getOperationInfo(options)

      expect(operationName).toBe('TestQuery')
    })

    it('gets a named mutation operation', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`query TestMutation { test }`),
          contextValue: {},
        },
      }
      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }
      const { operationName } = getOperationInfo(options)

      expect(operationName).toBe('TestMutation')
    })

    it('gets a named subscription operation', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`query TestSubscription { test }`),
          contextValue: {},
        },
      }
      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }
      const { operationName } = getOperationInfo(options)

      expect(operationName).toBe('TestSubscription')
    })

    it('handles an unnamed query operation', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`query { test }`),
          contextValue: {},
        },
      }
      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }
      const { operationName } = getOperationInfo(options)

      expect(operationName).toBeUndefined()
    })
  })

  describe('allowOperation', () => {
    it('checks if queries are allowed', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`query { test }`),
          contextValue: {},
        },
      }

      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }

      const allowed = sendOperation({
        params: options.params,
        sendOperations: ['query'],
        logger,
      })

      expect(allowed).toBe(true)
    })

    it('checks if mutations are allowed', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`mutation { test }`),
          contextValue: {},
        },
      }

      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }

      const allowed = sendOperation({
        params: options.params,
        sendOperations: ['mutation'],
        logger,
      })

      expect(allowed).toBe(true)
    })

    it('checks if queries are not allowed', () => {
      const executeOptions = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`query { test }`),
          contextValue: {},
        },
      }

      const options: Pick<UseInngestExecuteOptions, 'params'> = {
        params: executeOptions,
      }

      const allowed = sendOperation({
        params: options.params,
        sendOperations: ['mutation'],
        logger,
      })

      expect(allowed).toBe(false)
    })
  })

  describe('isIntrospectionQuery', () => {
    it('knows if a schema introspection', () => {
      const options = {
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
      }

      const isIntrospection = isIntrospectionQuery(options)

      expect(isIntrospection).toBe(true)
    })

    it('knows if not a schema introspection', () => {
      const options = {
        executeFn: () => {},
        setExecuteFn: () => {},
        setResultAndStopExecution: () => {},
        extendContext: () => {},
        args: {
          schema,
          document: parse(`{
            query {
              test {
                name
              }
            }
          }`),
          contextValue: {},
        },
      }

      const isIntrospection = isIntrospectionQuery(options)

      expect(isIntrospection).toBe(false)
    })
  })

  describe('buildTypeIdentifiers', () => {
    describe('with a simple query', () => {
      it('builds type identifiers from a query', async () => {
        const executeOptions = {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query { post { id, title } }`),
            contextValue: {},
          },
        }

        // const options: Pick<UseInngestExecuteOptions, 'params'> = {
        //   params: executeOptions,
        // }

        const { types, identifiers } = await buildTypeIdentifiers({
          params: executeOptions,
          eventName: '',
          logger,
          result: {
            data: { post: { id: 4, title: 'hello', __typename: 'Post' } },
            errors: [],
            extensions: {},
          },
        })

        expect(types).toEqual(['Post'])
        expect(identifiers).toEqual([{ id: 4, typename: 'Post' }])
      })
    })

    describe('with a nested query', () => {
      it('builds type identifiers from a query', async () => {
        const executeOptions = {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(
              `query { post { id, title, comments { id, body } } }`
            ),
            contextValue: {},
          },
        }

        // const options: Pick<UseInngestExecuteOptions, 'params'> = {
        //   params: executeOptions,
        // }

        const { types, identifiers } = await buildTypeIdentifiers({
          params: executeOptions,
          eventName: '',
          logger,
          result: {
            data: {
              post: {
                id: 2,
                title: 'hello',
                __typename: 'Post',
                comments: [{ id: 3, body: 'message', __typename: 'Comment' }],
              },
            },
            errors: [],
            extensions: {},
          },
        })

        expect(types).toEqual(['Post', 'Comment'])
        expect(identifiers).toEqual([
          { id: 2, typename: 'Post' },
          { id: 3, typename: 'Comment' },
        ])
      })
    })

    describe('with a simple mutation', () => {
      it('builds type identifiers from a mutation', async () => {
        const executeOptions = {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(
              `mutation UpdatePost { updatePost(id: 1, title: "updated title") {  id title } }`
            ),
            contextValue: {},
          },
        }

        // const options: Pick<UseInngestExecuteOptions, 'params'> = {
        //   params: executeOptions,
        // }

        const { types, identifiers } = await buildTypeIdentifiers({
          params: executeOptions,
          eventName: 'graphql-test/update-post.mutation',
          result: {
            errors: [],
            data: {
              updatePost: {
                id: 19,
                title: 'updated title',
                __typename: 'Post',
              },
            },
          },
          logger,
        })

        expect(types).toEqual(['Post'])
        expect(identifiers).toEqual([{ id: 19, typename: 'Post' }])
      })
    })
  })

  describe('denyType', () => {
    describe('based on the query and a list of types to deny', () => {
      it('determines that query is denied', () => {
        const executeOptions = {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(
              `query { post { id, title, comments { id, body } } }`
            ),
            contextValue: {},
          },
        }

        // const options: Pick<UseInngestExecuteOptions, 'params'> = {
        //   params: executeOptions,
        // }

        const denied = denyType({
          params: executeOptions,
          eventName: '',
          logger,
          denylist: { types: ['Comment'] },
          result: {
            data: {
              post: {
                id: 2,
                title: 'hello',
                __typename: 'Post',
                comments: [{ id: 3, body: 'message', __typename: 'Comment' }],
              },
            },
            errors: [],
            extensions: {},
          },
        })

        expect(denied).toBe(true)
      })

      it('determines that query is allowed', () => {
        const executeOptions = {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(
              `query { post { id, title, comments { id, body } } }`
            ),
            contextValue: {},
          },
        }

        // const options: Pick<UseInngestExecuteOptions, 'params'> = {
        //   params: executeOptions,
        // }

        const denied = denyType({
          params: executeOptions,
          eventName: '',
          denylist: { types: ['User'] },
          logger,
          result: {
            data: {
              post: {
                id: 2,
                title: 'hello',
                __typename: 'Post',
                comments: [{ id: 3, body: 'message', __typename: 'Comment' }],
              },
            },
            errors: [],
            extensions: {},
          },
        })

        expect(denied).toBe(false)
      })
    })
  })

  describe('denySchemaCoordinate', () => {
    describe('based on the query and a list of schema coordinates to deny', () => {
      it('determines that query is denied', () => {
        const executeOptions = {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(
              `query { post { id, title, comments { id, body } } }`
            ),
            contextValue: {},
          },
        }

        // const options: Pick<UseInngestExecuteOptions, 'params'> = {
        //   params: executeOptions,
        // }

        const denied = denySchemaCoordinate({
          params: executeOptions,
          eventName: '',
          logger,
          denylist: { schemaCoordinates: ['Comment.body'] },
          result: {
            data: {
              post: {
                id: 2,
                title: 'hello',
                __typename: 'Post',
                comments: [{ id: 3, body: 'message', __typename: 'Comment' }],
              },
            },
            errors: [],
            extensions: {},
          },
        })

        expect(denied).toBe(true)
      })

      it('determines that query is allowed', () => {
        const executeOptions = {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(
              `query { post { id, title, comments { id, body } } }`
            ),
            contextValue: {},
          },
        }

        // const options: Pick<UseInngestExecuteOptions, 'params'> = {
        //   params: executeOptions,
        // }

        const denied = denySchemaCoordinate({
          params: executeOptions,
          eventName: '',
          logger,
          denylist: { schemaCoordinates: ['Query.user'] },
          result: {
            data: {
              post: {
                id: 2,
                title: 'hello',
                __typename: 'Post',
                comments: [{ id: 3, body: 'message', __typename: 'Comment' }],
              },
            },
            errors: [],
            extensions: {},
          },
        })

        expect(denied).toBe(false)
      })
    })
  })
})
