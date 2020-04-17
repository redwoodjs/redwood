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

  input CreateUserProfileInput {
    username: String!
    userId: Int!
  }

  input UpdateUserProfileInput {
    username: String
    userId: Int
  }

  type Mutation {
    createUserProfile(input: CreateUserProfileInput!): UserProfile!
    updateUserProfile(id: Int!, input: UpdateUserProfileInput!): UserProfile!
    deleteUserProfile(id: Int!): UserProfile!
  }
`
