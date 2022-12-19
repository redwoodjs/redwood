export const schema = gql`
  type Query {
    todosWithMissingRoles: [Todo] @requireAuth(roles: [null, 12])
  }
`
