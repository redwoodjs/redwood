export const schema = gql`
  type Stall {
    id: String!
    name: String!
    stallNumber: String!
    produce: [Produce]!
  }

  type Query {
    stalls: [Stall!]! @requireAuth
    stall(id: String!): Stall @requireAuth
  }

  input CreateStallInput {
    name: String!
    stallNumber: String!
  }

  input UpdateStallInput {
    name: String
    stallNumber: String
  }

  type Mutation {
    createStall(input: CreateStallInput!): Stall! @requireAuth
    updateStall(id: String!, input: UpdateStallInput!): Stall! @requireAuth
    deleteStall(id: String!): Stall! @requireAuth
  }
`
