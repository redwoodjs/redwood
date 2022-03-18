export const schema = gql`
  type Query {
    todosWithInvalidRole: [Todo] @requireAuth(roles: 12)
  }
`
