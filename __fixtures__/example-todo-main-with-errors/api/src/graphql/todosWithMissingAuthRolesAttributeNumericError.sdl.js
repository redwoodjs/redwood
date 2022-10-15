export const schema = gql`
  type Query {
    todosWithMissingRolesAttributeNumeric: [Todo] @requireAuth(42)
  }
`
