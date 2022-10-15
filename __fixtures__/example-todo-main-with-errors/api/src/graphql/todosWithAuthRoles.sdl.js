export const schema = gql`
  type Query {
    todosWithStringRole: [Todo] @requireAuth(roles: "admin")
    todosWithMultipleRoles: [Todo] @requireAuth(roles: ["admin", "editor"])
  }
`
