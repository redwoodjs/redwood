export const schema = gql`
  type Query {
    todosWithInvalidRoles: [Todo] @requireAuth(roles: ["admin", 12])
  }
`
