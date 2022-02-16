import { assertSingleExecutionValue, createTestkit } from '@envelop/testing'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { getDirectiveValues } from 'graphql'

import { GraphQLTypeWithFields } from '../../index'
import { useRedwoodDirective, DirectiveType } from '../useRedwoodDirective'

//  ===== Test Setup ======
const AUTH_ERROR_MESSAGE = 'Sorry, you cannot do that'
const schemaWithDirectiveQueries = makeExecutableSchema({
  typeDefs: `
    directive @requireAuth(roles: [String]) on FIELD_DEFINITION
    directive @skipAuth on FIELD_DEFINITION

    directive @truncate(maxLength: Int!, separator: String!) on FIELD_DEFINITION

    type Post {
      title: String! @skipAuth
      description: String! @truncate(maxLength: 5, separator: ".")
    }

    type UserProfile {
      name: String! @skipAuth
      email: String! @requireAuth
    }

    type WithoutDirectiveType {
      id: Int!
      description: String!
    }

    type Query {
      protected: String @requireAuth
      public: String @skipAuth
      noDirectiveSpecified: String
      posts: [Post!]! @skipAuth
      userProfiles: [UserProfile!]! @skipAuth
      ambiguousAuthQuery: String @requireAuth @skipAuth
      withoutDirective: WithoutDirectiveType @skipAuth
    }

    input CreatePostInput {
      title: String!
    }

    input UpdatePostInput {
      title: String!
    }

    type Mutation {
      createPost(input: CreatePostInput!): Post! @skipAuth
      updatePost(input: UpdatePostInput!): Post! @requireAuth
      deletePost(title: String!): Post! @requireAuth(roles: ["admin", "publisher"])
    }
    `,
  resolvers: {
    Query: {
      protected: (_root, _args, _context) => 'protected',
      public: (_root, _args, _context) => 'public',
      noDirectiveSpecified: () => 'i should not be returned',
      posts: () => [
        {
          title: 'Five ways to test Redwood directives',
          description: 'Read this to learn about directive testing',
        },
      ],
      userProfiles: () => [
        {
          name: 'John Doe',
          email: 'doe@example.com',
        },
      ],
      ambiguousAuthQuery: (_root, _args, _context) => 'am i allowed?',
      withoutDirective: (_root, _args, _context) => ({
        id: 42,
        description: 'I am a type without any directives',
      }),
    },
    Mutation: {
      createPost: (_root, args, _context) => {
        return {
          title: args.input.title,
        }
      },
      updatePost: (_root, args, _context) => {
        return {
          title: args.input.title,
        }
      },
      deletePost: (_root, _args, _context) => {},
    },
  },
})

const testInstance = createTestkit(
  [
    useRedwoodDirective({
      onResolverCalled: () => {
        throw new Error(AUTH_ERROR_MESSAGE)
      },
      type: DirectiveType.VALIDATOR,
      name: 'requireAuth',
    }),
    useRedwoodDirective({
      onResolverCalled: () => {
        return
      },
      type: DirectiveType.VALIDATOR,
      name: 'skipAuth',
    }),
  ],
  schemaWithDirectiveQueries
)

// ====== End Test Setup ======

describe('Directives on Queries', () => {
  it('Should disallow execution on requireAuth', async () => {
    const result = await testInstance.execute(`query { protected }`)

    assertSingleExecutionValue(result)

    expect(result.errors).toBeTruthy()
    expect(result.errors[0].message).toBe(AUTH_ERROR_MESSAGE)

    expect(result.data?.protected).toBeNull()
  })

  it('Should allow execution on skipAuth', async () => {
    const result = await testInstance.execute(`query { public }`)

    assertSingleExecutionValue(result)

    expect(result.errors).toBeFalsy()
    expect(result.data?.public).toBe('public')
  })

  it('Should not require Type fields (ie, not Query or Mutation root types) to have directives declared', async () => {
    const result = await testInstance.execute(`query { posts { title } }`)

    assertSingleExecutionValue(result)

    expect(result.errors).toBeFalsy()

    expect(result.data.posts).toBeTruthy()
    expect(result.data.posts[0]).toHaveProperty('title')
    expect(result.data.posts[0].title).toEqual(
      'Five ways to test Redwood directives'
    )
  })

  it('Should enforce a requireAuth() directive if a Type field declares that directive', async () => {
    const result = await testInstance.execute(
      `query { userProfiles { name, email } }`
    )

    assertSingleExecutionValue(result)

    expect(result.errors).toBeTruthy()
    expect(result.errors[0].message).toBe(AUTH_ERROR_MESSAGE)

    expect(result.data).toBeFalsy()
    expect(result.data?.name).toBeUndefined()
    expect(result.data?.email).toBeUndefined()
  })

  it('Should permit a skipAuth() directive if a Type field declares that directive', async () => {
    const result = await testInstance.execute(`query { userProfiles { name } }`)

    assertSingleExecutionValue(result)

    expect(result.errors).toBeFalsy()

    expect(result.data).toBeTruthy()
    expect(result.data.userProfiles).toBeTruthy()
    expect(result.data.userProfiles[0]).toHaveProperty('name')
    expect(result.data.userProfiles[0]).not.toHaveProperty('email')
    expect(result.data.userProfiles[0].name).toEqual('John Doe')
  })

  it('Should disallow execution of a Query with requireAuth() even if another directive says to skip', async () => {
    const result = await testInstance.execute(`query { ambiguousAuthQuery }`)

    assertSingleExecutionValue(result)
    expect(result.errors).toBeTruthy()
    expect(result.errors[0].message).toBe(AUTH_ERROR_MESSAGE)

    expect(result.data?.ambiguousAuthQuery).toBeNull()
  })

  it('Should allow querying of types with no directive, as long as the query has a directive', async () => {
    const result = await testInstance.execute(`query { withoutDirective {
      id
    } }`)

    assertSingleExecutionValue(result)
    expect(result.errors).toBeFalsy()

    expect(result.data.withoutDirective.id).toBe(42)
  })
})

describe('Directives on Mutations', () => {
  it('Should allow mutation on skipAuth', async () => {
    const result = await testInstance.execute(
      `mutation { createPost(input: { title: "Post Created" }) { title } }`
    )
    assertSingleExecutionValue(result)

    expect(result.errors).toBeFalsy()

    expect(result.data).toBeTruthy()
    expect(result.data.createPost).toBeTruthy()
    expect(result.data.createPost).toHaveProperty('title')
    expect(result.data?.createPost.title).toEqual('Post Created')
  })

  it('Should disallow mutation on requireAuth', async () => {
    const result = await testInstance.execute(
      `mutation { updatePost(input: { title: "Post changed" }) { title } }`
    )
    assertSingleExecutionValue(result)

    expect(result.errors).toBeTruthy()
    expect(result.errors[0].message).toBe(AUTH_ERROR_MESSAGE)

    expect(result.data).toBeFalsy()
  })

  // note there is no actual roles check here
  it('Should disallow mutation on requireAuth() with roles given', async () => {
    const result = await testInstance.execute(
      `mutation { deletePost(title: "Post to delete") { title } }`
    )

    assertSingleExecutionValue(result)

    expect(result.errors).toBeTruthy()
    expect(result.errors[0].message).toBe(AUTH_ERROR_MESSAGE)

    expect(result.data).toBeFalsy()
  })

  it('Should identify the role names specified in requireAuth()', async () => {
    const mutationType = schemaWithDirectiveQueries.getType(
      'Mutation'
    ) as GraphQLTypeWithFields

    const deletePost = mutationType.getFields()['deletePost']
    const directive = schemaWithDirectiveQueries.getDirective('requireAuth')

    const { roles } = getDirectiveValues(directive, deletePost.astNode, {
      args: 'roles',
    })

    expect(roles).toContain('admin')
    expect(roles).toContain('publisher')
    expect(roles).not.toContain('author')
  })

  it('Should get the argument values for a directive', async () => {
    const postType = schemaWithDirectiveQueries.getType(
      'Post'
    ) as GraphQLTypeWithFields

    const description = postType.getFields()['description']

    const directive = schemaWithDirectiveQueries.getDirective('truncate')

    const directiveArgs = getDirectiveValues(directive, description.astNode)

    expect(directiveArgs).toHaveProperty('maxLength')
    expect(directiveArgs.maxLength).toEqual(5)

    expect(directiveArgs).toHaveProperty('separator')
    expect(directiveArgs.separator).toEqual('.')
  })

  it('Should get the specified argument value for a directive', async () => {
    const postType = schemaWithDirectiveQueries.getType(
      'Post'
    ) as GraphQLTypeWithFields

    const description = postType.getFields()['description']

    const directive = schemaWithDirectiveQueries.getDirective('truncate')

    const { maxLength } = getDirectiveValues(directive, description.astNode)

    expect(maxLength).toEqual(5)
  })
})
