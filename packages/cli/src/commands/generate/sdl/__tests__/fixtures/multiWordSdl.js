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

  input UserProfileInput {
    username: String
    userId: Int
  }
`
