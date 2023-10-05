export const schema = gql`
  interface Grocery {
    id: ID!
    name: String!
    quantity: Int!
    price: Int!
    nutrients: String
    stall: Stall!
    region: String!
  }

  type Fruit implements Grocery {
    id: ID!
    name: String!
    quantity: Int!
    price: Int!
    nutrients: String
    stall: Stall!
    region: String!
    "Seedless is only for fruits"
    isSeedless: Boolean
    "Ripeness is only for fruits"
    ripenessIndicators: String
  }

  type Vegetable implements Grocery {
    id: ID!
    name: String!
    quantity: Int!
    price: Int!
    nutrients: String
    stall: Stall!
    region: String!
    "Veggie Family is only for vegetables"
    vegetableFamily: String
    "Pickled is only for vegetables"
    isPickled: Boolean
  }

  union Groceries = Fruit | Vegetable

  type Query {
    groceries: [Groceries!]! @skipAuth
    fruits: [Fruit!]! @skipAuth
    fruitById(id: ID!): Fruit @skipAuth
    vegetables: [Vegetable!]! @skipAuth
    vegetableById(id: ID!): Vegetable @skipAuth
  }
`
