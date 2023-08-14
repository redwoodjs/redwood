import path from 'path'

import { DocumentNode } from 'graphql'
import gql from 'graphql-tag'

import { validateSchema } from '../validateSchema'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

const validateSdlFile = async (document: DocumentNode) => {
  validateSchema(document)
}

describe('SDL with no reserved names used', () => {
  describe('SDL is valid', () => {
    test('with proper type definition names', async () => {
      const document = gql`
        type Message {
          from: String
          body: String
        }

        type Query {
          room(id: ID!): [Message!]! @skipAuth
        }

        input SendMessageInput {
          roomId: ID!
          from: String!
          body: String!
        }

        type Mutation {
          sendMessage(input: SendMessageInput!): Message! @skipAuth
        }
      `

      await expect(validateSdlFile(document)).resolves.not.toThrowError()
    })
    test('with proper interface interface definition names', async () => {
      const document = gql`
        interface Node {
          id: ID!
        }

        type Message implements Node {
          id: ID!
          from: String
          body: String
        }

        type Query {
          room(id: ID!): [Message!]! @skipAuth
        }
      `
      await expect(validateSdlFile(document)).resolves.not.toThrowError()
    })
    test('with proper interface input type definition names', async () => {
      const document = gql`
        type Message {
          from: String
          body: String
        }

        type Query {
          room(id: ID!): [Message!]! @skipAuth
        }

        input SendMessageInput {
          roomId: ID!
          from: String!
          body: String!
        }

        type Mutation {
          sendMessage(input: SendMessageInput!): Message! @skipAuth
        }
      `
      await expect(validateSdlFile(document)).resolves.not.toThrowError()
    })
  })

  describe('SDL is invalid', () => {
    test('because uses a reserved name as a type', async () => {
      const document = gql`
        type Float {
          from: String
          body: String
        }

        type Query {
          room(id: ID!): [Message!]! @skipAuth
        }

        input SendMessageInput {
          roomId: ID!
          from: String!
          body: String!
        }

        type Mutation {
          sendMessage(input: SendMessageInput!): Message! @skipAuth
        }
      `
      await expect(
        validateSdlFile(document)
      ).rejects.toThrowErrorMatchingSnapshot()
    })
  })

  test('because uses a reserved name as an input', async () => {
    const document = gql`
      type Message {
        from: String
        body: String
      }

      type Query {
        room(id: ID!): [Message!]! @skipAuth
      }

      input Float {
        roomId: ID!
        from: String!
        body: String!
      }

      type Mutation {
        sendMessage(input: SendMessageInput!): Message! @skipAuth
      }
    `
    await expect(
      validateSdlFile(document)
    ).rejects.toThrowErrorMatchingSnapshot()
  })

  test('because uses a reserved name as an interface', async () => {
    const document = gql`
      interface Float {
        id: ID!
      }

      type Message implements Float {
        id: ID!
        from: String
        body: String
      }

      type Query {
        room(id: ID!): [Message!]! @skipAuth
      }

      input SendMessageInput {
        roomId: ID!
        from: String!
        body: String!
      }

      type Mutation {
        sendMessage(input: SendMessageInput!): Message! @skipAuth
      }
    `
    await expect(
      validateSdlFile(document)
    ).rejects.toThrowErrorMatchingSnapshot()
  })
})
