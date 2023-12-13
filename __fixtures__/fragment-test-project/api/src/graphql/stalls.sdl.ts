export const schema = gql`
  type Stall {
    id: ID!
    stallNumber: String!
    name: String!
    fruits: [Fruit]
    vegetables: [Vegetable]
  }

  type Query {
    stalls: [Stall!]! @skipAuth
    stallById(id: ID!): Stall @skipAuth
  }
`
