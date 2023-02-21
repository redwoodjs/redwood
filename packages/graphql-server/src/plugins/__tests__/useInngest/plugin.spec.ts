import {
  assertSingleExecutionValue,
  createTestkit,
  createSpiedPlugin,
} from '@envelop/testing'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { createGraphQLError } from '@graphql-tools/utils'
import { parse } from 'graphql'
import type { EventPayload, Inngest } from 'inngest'

import { useInngest } from '../../useInngest'

describe('useInngest', () => {
  const testEventKey = 'foo-bar-baz-test'

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
        fails: String!
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
          comments: [{ id: 3, body: 'message' }],
        }),
        posts: () => [
          { id: '1', title: 'hello' },
          { id: '2', title: 'world' },
        ],
        fails: () => {
          throw createGraphQLError('test error')
        },
      },
      Mutation: {
        updatePost: (_id, _title) => {
          return { id: '99', title: 'Title TK' }
        },
      },
    },
  })

  const mockedInngestClient = {
    name: 'TEST',
    eventKey: testEventKey,
    send: jest.fn(),
    setEventKey: jest.fn(),
  } as unknown as Inngest<Record<string, EventPayload>>

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('queries', () => {
    it('sends', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({ inngestClient: mockedInngestClient }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query TestQuery2 { test }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ test: 'hello' })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'graphql/test-query2.query',
        data: {
          variables: {},
          identifiers: [],
          types: [],
          result: {},
          operation: { id: 'test-query2', name: 'TestQuery2', type: 'query' },
        },
        user: {},
      })
    })

    it('sends with types and identifiers', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({ inngestClient: mockedInngestClient }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(
        `query FindPost { post { id title } }`
      )
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ post: { id: '1', title: 'hello' } })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'graphql/find-post.query',
        data: {
          variables: {},
          identifiers: [
            {
              id: '1',
              typename: 'Post',
            },
          ],
          types: ['Post'],
          result: {},
          operation: { id: 'find-post', name: 'FindPost', type: 'query' },
        },
        user: {},
      })
    })

    it('sends with types and identifiers when nested query', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({ inngestClient: mockedInngestClient }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(
        `query FindPost { post { id title comments { id body } } }`
      )
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({
        post: {
          id: '1',
          title: 'hello',
          comments: [{ id: '3', body: 'message' }],
        },
      })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'graphql/find-post.query',
        data: {
          variables: {},
          identifiers: [
            {
              id: '1',
              typename: 'Post',
            },
            {
              id: '3',
              typename: 'Comment',
            },
          ],
          types: ['Post', 'Comment'],
          result: {},
          operation: { id: 'find-post', name: 'FindPost', type: 'query' },
        },
        user: {},
      })
    })
  })

  describe('mutations', () => {
    it('sends', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({ inngestClient: mockedInngestClient, logging: true }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(
        parse(
          `mutation UpdateMyPost($id: ID!, $title: String!) { updatePost(id: $id, title: $title) { id title } }`
        ),
        { id: 99, title: 'Title TK' }
      )
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({
        updatePost: { id: '99', title: 'Title TK' },
      })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'graphql/update-my-post.mutation',
        data: {
          variables: { id: 99, title: 'Title TK' },
          identifiers: [{ id: '99', typename: 'Post' }],
          types: ['Post'],
          result: {},
          operation: {
            id: 'update-my-post',
            name: 'UpdateMyPost',
            type: 'mutation',
          },
        },
        user: {},
      })
    })
  })

  describe('with anonymous operations', () => {
    it('does not send anonymous operations', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({ inngestClient: mockedInngestClient }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query { test }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ test: 'hello' })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).not.toHaveBeenCalled()
    })

    it('send anonymous operations when configured to send anonymous operations', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            sendAnonymousOperations: true,
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query { test }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ test: 'hello' })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        data: {
          identifiers: [],
          operation: {
            id: 'anonymous-d32327f2ad0fef67462baf2b8410a2b4b2cc8db57e67bb5b3c95efa595b39f30',
            name: '',
            type: 'query',
          },
          result: {},
          types: [],
          variables: {},
        },
        name: 'graphql/anonymous-7b06f59976962bf7b47e2f2f29142661407818808663d8cf5a68c9cee38c11ff.query',
        user: {},
      })
    })
  })

  describe('with introspection', () => {
    it('sends', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            sendIntrospection: true,
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`{
        __schema {
          types {
            name
          }
        }
      }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({
        __schema: {
          types: [
            {
              name: 'Post',
            },
            {
              name: 'ID',
            },
            {
              name: 'String',
            },
            {
              name: 'Comment',
            },
            {
              name: 'User',
            },
            {
              name: 'Query',
            },
            {
              name: 'Mutation',
            },
            {
              name: 'Boolean',
            },
            {
              name: '__Schema',
            },
            {
              name: '__Type',
            },
            {
              name: '__TypeKind',
            },
            {
              name: '__Field',
            },
            {
              name: '__InputValue',
            },
            {
              name: '__EnumValue',
            },
            {
              name: '__Directive',
            },
            {
              name: '__DirectiveLocation',
            },
          ],
        },
      })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        data: {
          identifiers: [],
          operation: {
            id: 'anonymous-d32327f2ad0fef67462baf2b8410a2b4b2cc8db57e67bb5b3c95efa595b39f30',
            name: '',
            type: 'query',
          },
          result: {},
          types: [],
          variables: {},
        },
        name: 'graphql/anonymous-5108c04af181e341370ee067909f9cd8ecc3b3fde333c2205cbede1d3d6f1ec5.query',
        user: {},
      })
    })

    it('blocks', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            sendIntrospection: false,
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`{
        __schema {
          types {
            name
          }
        }
      }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({
        __schema: {
          types: [
            {
              name: 'Post',
            },
            {
              name: 'ID',
            },
            {
              name: 'String',
            },
            {
              name: 'Comment',
            },
            {
              name: 'User',
            },
            {
              name: 'Query',
            },
            {
              name: 'Mutation',
            },
            {
              name: 'Boolean',
            },
            {
              name: '__Schema',
            },
            {
              name: '__Type',
            },
            {
              name: '__TypeKind',
            },
            {
              name: '__Field',
            },
            {
              name: '__InputValue',
            },
            {
              name: '__EnumValue',
            },
            {
              name: '__Directive',
            },
            {
              name: '__DirectiveLocation',
            },
          ],
        },
      })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).not.toHaveBeenCalled()
    })
  })

  describe('with errors', () => {
    it('sends', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({ inngestClient: mockedInngestClient, sendErrors: true }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query FailQuery { fails }`)
      assertSingleExecutionValue(result)

      expect(result.data).toBeNull()
      expect(result.errors).not.toBeNull()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalled()
    })

    it('blocks', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({ inngestClient: mockedInngestClient }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query FailQuery { fails }`)
      assertSingleExecutionValue(result)

      expect(result.data).toBeNull()
      expect(result.errors).not.toBeNull()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).not.toHaveBeenCalled()
    })
  })

  describe('with deny lists', () => {
    it('blocks types', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            denylist: { types: ['Post'] },
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(
        `query FindPost { post { id title } }`
      )
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ post: { id: '1', title: 'hello' } })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).not.toHaveBeenCalled()
    })

    it('blocks schema coordinates', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            denylist: { schemaCoordinates: ['Query.post'] },
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(
        `query FindPost { post { id title } }`
      )
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ post: { id: '1', title: 'hello' } })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).not.toHaveBeenCalled()
    })
  })

  describe('when including result data', () => {
    it('sends with data', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            includeRawResult: true,
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query TestQuery2 { test }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ test: 'hello' })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'graphql/test-query2.query',
        data: {
          variables: {},
          identifiers: [],
          types: [],
          result: { data: { test: 'hello' } },
          operation: { id: 'test-query2', name: 'TestQuery2', type: 'query' },
        },
        user: {},
      })
    })
  })

  describe('when redacting', () => {
    it('sends with redacted data', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            includeRawResult: true,
            redactRawResultOptions: { paths: ['*.test'] },
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query TestQuery2 { test }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ test: 'hello' })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'graphql/test-query2.query',
        data: {
          variables: {},
          identifiers: [],
          types: [],
          result: { data: { test: '[REDACTED]' } },
          operation: { id: 'test-query2', name: 'TestQuery2', type: 'query' },
        },
        user: {},
      })
    })

    it('sends with redacted mutation variables', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            logging: true,
            redactRawResultOptions: { paths: ['title'] },
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(
        parse(
          `mutation UpdateMyPost($id: ID!, $title: String!) { updatePost(id: $id, title: $title) { id title } }`
        ),
        { id: 99, title: 'Title TK' }
      )
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({
        updatePost: { id: '99', title: 'Title TK' },
      })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'graphql/update-my-post.mutation',
        data: {
          variables: { id: 99, title: '[REDACTED]' },
          identifiers: [{ id: '99', typename: 'Post' }],
          types: ['Post'],
          result: {},
          operation: {
            id: 'update-my-post',
            name: 'UpdateMyPost',
            type: 'mutation',
          },
        },
        user: {},
      })
    })
  })

  describe('with a custom event prefix function', () => {
    it('sends', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            buildEventNamePrefixFunction: async () => 'custom-prefix-graphql',
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query TestQuery5 { test }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ test: 'hello' })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'custom-prefix-graphql/test-query5.query',
        data: {
          variables: {},
          identifiers: [],
          types: [],
          result: {},
          operation: { id: 'test-query5', name: 'TestQuery5', type: 'query' },
        },
        user: {},
      })
    })
  })

  describe('with a custom event name function', () => {
    it('sends', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            buildEventNameFunction: async () => 'custom-graphql/noun.verb',
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query TestQuery6 { test }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ test: 'hello' })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'custom-graphql/noun.verb',
        data: {
          variables: {},
          identifiers: [],
          types: [],
          result: {},
          operation: { id: 'test-query6', name: 'TestQuery6', type: 'query' },
        },
        user: {},
      })
    })
  })

  describe('with a custom user context function', () => {
    it('sends', async () => {
      const spiedPlugin = createSpiedPlugin()

      const testInstance = createTestkit(
        [
          useInngest({
            inngestClient: mockedInngestClient,
            buildUserContextFunction: async () => {
              return { currentUser: { id: '123', name: 'Usuario Clave' } }
            },
          }),
          spiedPlugin.plugin,
        ],
        schema
      )

      const result = await testInstance.execute(`query TestQuery6 { test }`)
      assertSingleExecutionValue(result)

      expect(result.data).toEqual({ test: 'hello' })
      expect(result.errors).toBeUndefined()

      expect(spiedPlugin.spies.afterExecute).toHaveBeenCalled()

      expect(mockedInngestClient.send).toHaveBeenCalledWith({
        name: 'graphql/test-query6.query',
        data: {
          variables: {},
          identifiers: [],
          types: [],
          result: {},
          operation: { id: 'test-query6', name: 'TestQuery6', type: 'query' },
        },
        user: { currentUser: { id: '123', name: 'Usuario Clave' } },
      })
    })
  })
})
