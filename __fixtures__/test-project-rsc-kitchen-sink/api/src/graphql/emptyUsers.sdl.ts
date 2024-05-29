export const schema = gql`
  type EmptyUser {
    id: Int!
    email: String!
    name: String
  }

  type Query {
    emptyUsers: [EmptyUser!]! @requireAuth
    emptyUser(id: Int!): EmptyUser @requireAuth
  }

  input CreateEmptyUserInput {
    email: String!
    name: String
  }

  input UpdateEmptyUserInput {
    email: String
    name: String
  }

  type Mutation {
    createEmptyUser(input: CreateEmptyUserInput!): EmptyUser! @requireAuth
    updateEmptyUser(id: Int!, input: UpdateEmptyUserInput!): EmptyUser!
      @requireAuth
    deleteEmptyUser(id: Int!): EmptyUser! @requireAuth
  }
`
