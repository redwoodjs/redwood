export const schema = gql`
  type Query {
    todosWithMissingRolesAttribute: [Todo] @requireAuth("ADMIN")
  }
`
