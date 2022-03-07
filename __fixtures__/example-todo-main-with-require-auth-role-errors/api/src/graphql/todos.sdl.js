export const schema = gql`
  type Todo {
    id: Int!
    body: String!
    status: String!
  }

  type Query {
    todos: [Todo] @skipAuth
    todosCount: Int! @skipAuth
  }

  type Mutation {
    createTodo(body: String!): Todo @requireAuth(roles: 12)
    updateTodoStatus(id: Int!, status: String!): Todo @requireAuth(roles: ["admin", 12])
    renameTodo(id: Int!, body: String!): Todo @requireAuth(roles: [null, 12])
  }
`
