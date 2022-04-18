export const schema = gql`
  type Query {
    todosWithBuiltInDeprecatedDirective(id: Int!): Todo! @deprecated(reason: "Don't use this query anymore")
  }
`
