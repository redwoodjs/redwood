export const store = {
  d67f5d54ba7d2a94e34809f20a0380f9921a5586:
    'mutation AddTodo_CreateTodo($body: String!) { __typename createTodo(body: $body) { __typename body id status } }',
  '81a7e7b720f992f8cfcaab15f42cf5a6802ed338':
    'query NumTodosCell_GetCount { __typename todosCount }',
  a9d0f2c090ac4320919f631ab0003fcdd2c30652:
    'query TodoListCell_GetTodos { __typename todos { __typename body id status } }',
  '69a8d2c6640912a8323a729adae2cc2f2f1bdb59':
    'mutation TodoListCell_CheckTodo($id: Int!, $status: String!) { __typename updateTodoStatus(id: $id, status: $status) { __typename id status } }',
}
