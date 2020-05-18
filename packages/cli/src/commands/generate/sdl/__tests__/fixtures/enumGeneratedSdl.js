import gql from 'graphql-tag'

export const schema = gql`
  type Shoe {
    id: Int!
    color: Color!
  }

  enum Color {
    RED
    GREEN
    BLUE
  }

  type Query {
    shoes: [Shoe!]!
    shoe(id: Int!): Shoe!
  }

  input CreateShoeInput {
    color: Color!
  }

  input UpdateShoeInput {
    color: Color
  }

  type Mutation {
    createShoe(input: CreateShoeInput!): Shoe!
    updateShoe(id: Int!, input: UpdateShoeInput!): Shoe!
    deleteShoe(id: Int!): Shoe!
  }
`
