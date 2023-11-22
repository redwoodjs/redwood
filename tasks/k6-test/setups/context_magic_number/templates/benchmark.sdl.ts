export const schema = gql`
  type MagicNumber {
    value: Int!
  }
  type Mutation {
    magicNumber(value: Int!): MagicNumber! @skipAuth
  }
`
