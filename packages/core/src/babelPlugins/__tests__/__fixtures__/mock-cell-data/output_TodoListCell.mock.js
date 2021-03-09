import { afterQuery } from './TodoListCell.js'
export const standard = () =>
  afterQuery(
    mockGraphQLQuery('TodoListCell_GetTodos', () => ({
      todos: [
        {
          id: 1,
          body: 'Cheese',
          status: '',
        },
      ],
    }))()
  )
