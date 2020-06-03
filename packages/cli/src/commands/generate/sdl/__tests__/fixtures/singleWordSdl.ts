import gql from 'graphql-tag'

export const schema = gql`
  type User {
    id: Int!
    name: String
    email: String!
    isAdmin: Boolean!
    profiles: UserProfile
  }

  type Query {
    users: [User!]!
  }

  input CreateUserInput {
    name: String
    email: String!
    isAdmin: Boolean!
  }

  input UpdateUserInput {
    name: String
    email: String
    isAdmin: Boolean
  }
`
