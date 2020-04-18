export const schema = gql`
  type UserProfile {
    id: Int!
    username: String!
    userId: Int!
    user: User!
  }

  type Query {
    userProfiles: [UserProfile!]!
  }

  input CreateUserProfileInput {
    username: String!
    userId: Int!
  }

  input UpdateUserProfileInput {
    username: String
    userId: Int
  }
`
