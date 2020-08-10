export const schema = gql`
  type Todo {
    id: Int!
    body: String!
    status: String!
  }

  type Query {
    todos: [Todo]
  }

  type Mutation {
    createTodo(body: String!): Todo
    updateTodoStatus(id: Int!, status: String!): Todo
    renameTodo(id: Int!, body: String!): Todo
  }
`
