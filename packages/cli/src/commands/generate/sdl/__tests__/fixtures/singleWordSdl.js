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

  input UserInput {
    name: String
    email: String
    isAdmin: Boolean
  }
`
