export const schema = gql`
  type UserExample {
    id: Int!
    email: String!
    name: String
  }

  type Query {
    userExamples: [UserExample!]! @requireAuth
    userExample(id: Int!): UserExample @requireAuth
  }

  input CreateUserExampleInput {
    email: String!
    name: String
  }

  input UpdateUserExampleInput {
    email: String
    name: String
  }

  type Mutation {
    createUserExample(input: CreateUserExampleInput!): UserExample! @requireAuth
    updateUserExample(id: Int!, input: UpdateUserExampleInput!): UserExample!
      @requireAuth
    deleteUserExample(id: Int!): UserExample! @requireAuth
  }
`
