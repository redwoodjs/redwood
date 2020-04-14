export const schema = gql`
  type UserProfile {
    id: Int!
    username: String!
    userId: Int!
    user: User!
  }

  type Query {
    userProfiles: [UserProfile!]!
    userProfile(id: Int!): UserProfile!
  }

  input UserProfileInput {
    username: String!
    userId: Int!
  }

  type Mutation {
    createUserProfile(input: UserProfileInput!): UserProfile
    updateUserProfile(id: Int!, input: UserProfileInput!): UserProfile
    deleteUserProfile(id: Int!): UserProfile
  }
`
