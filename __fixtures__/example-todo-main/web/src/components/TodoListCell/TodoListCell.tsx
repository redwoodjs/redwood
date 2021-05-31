import styled from 'styled-components'

import { useMutation } from '@redwoodjs/web'

import TodoItem from 'src/components/TodoItem'

export const QUERY = gql`
  query TodoListCell_GetTodos {
    todos {
      id
      body
      status
    }
  }
`
// This is a no-op used for testing the mock-data-cell babel-plugin.
export const afterQuery = (d) => d

const UPDATE_TODO_STATUS = gql`
  mutation TodoListCell_CheckTodo($id: Int!, $status: String!) {
    updateTodoStatus(id: $id, status: $status) {
      id
      __typename
      status
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Success = ({ todos }) => {
  const [updateTodoStatus] = useMutation(UPDATE_TODO_STATUS)

  const handleCheckClick = (id, status) => {
    updateTodoStatus({
      variables: { id, status },
      optimisticResponse: {
        __typename: 'Mutation',
        updateTodoStatus: { __typename: 'Todo', id, status: 'loading' },
      },
    })
  }

  const list = todos.map((todo) => (
    <TodoItem key={todo.id} {...todo} onClickCheck={handleCheckClick} />
  ))

  return <SC.List>{list}</SC.List>
}

const SC = {}
SC.List = styled.ul`
  padding: 0;
`
