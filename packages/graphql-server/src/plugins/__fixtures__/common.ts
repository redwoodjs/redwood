import { makeExecutableSchema } from '@graphql-tools/schema'

export const testSchema = makeExecutableSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      me: User!
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
    },
    User: {
      id: (u) => u._id,
      name: (u) => `${u.firstName} ${u.lastName}`,
    },
  },
})

export const testQuery = /* GraphQL */ `
  query me {
    me {
      id
      name
    }
  }
`
