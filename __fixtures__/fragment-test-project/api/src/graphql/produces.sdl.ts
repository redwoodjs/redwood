export const schema = gql`
  type Produce {
    id: String!
    name: String!
    quantity: Int!
    price: Int!
    nutrients: String
    region: String!
    isSeedless: Boolean
    ripenessIndicators: String
    vegetableFamily: String
    isPickled: Boolean
    stall: Stall!
    stallId: String!
  }

  type Query {
    produces: [Produce!]! @skipAuth
    produce(id: String!): Produce @skipAuth
  }

  input CreateProduceInput {
    name: String!
    quantity: Int!
    price: Int!
    nutrients: String
    region: String!
    isSeedless: Boolean
    ripenessIndicators: String
    vegetableFamily: String
    isPickled: Boolean
    stallId: String!
  }

  input UpdateProduceInput {
    name: String
    quantity: Int
    price: Int
    nutrients: String
    region: String
    isSeedless: Boolean
    ripenessIndicators: String
    vegetableFamily: String
    isPickled: Boolean
    stallId: String
  }

  type Mutation {
    createProduce(input: CreateProduceInput!): Produce! @skipAuth
    updateProduce(id: String!, input: UpdateProduceInput!): Produce!
      @skipAuth
    deleteProduce(id: String!): Produce! @skipAuth
  }
`
