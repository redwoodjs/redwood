import { makeExecutableSchema } from '@graphql-tools/schema'

export const testSchema = makeExecutableSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      me: User!
    }

    type Query {
      forbiddenUser: User!
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
    },
    User: {
      id: (u) => u._id,
      name: (u) => `${u.firstName} ${u.lastName}`,
    },
  },
})

export const testQuery = /* GraphQL */ `
  query meQuery {
    me {
      id
      name
    }
  }
`

export const testFilteredQuery = /* GraphQL */ `
  query FilteredQuery {
    me {
      id
      name
    }
  }
`

export const testErrorQuery = /* GraphQL */ `
  query forbiddenUserQuery {
    forbiddenUser {
      id
      name
    }
  }
`
