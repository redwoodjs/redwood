export const schema = gql`
  type Query {
    deleteTodo(id: Int!): Todo! @requireAuth(roles: ["ADMIN"])
  }
`
