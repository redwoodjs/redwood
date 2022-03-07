import { useMutation } from '@redwoodjs/web'
import AddTodoControl from 'src/components/AddTodoControl'
import { QUERY as TODOS } from 'src/components/TodoListCell'

// Note that `__typename` is required here in order for optimistic responses to
// function properly.
const CREATE_TODO = gql`
  mutation AddTodo_CreateTodo($body: String!) {
    createTodo(body: $body) {
      id
      __typename
      body
      status
    }
  }
`
const AddTodo = () => {
  const [createTodo] = useMutation(CREATE_TODO, {
    // An example of updating Apollo's cache. This will trigger a re-rended of any
    // affected components, so we don't need to do anything but update the cache.
    update: (cache, { data: { createTodo } }) => {
      const { todos } = cache.readQuery({ query: TODOS })
      cache.writeQuery({
        query: TODOS,
        data: { todos: todos.concat([createTodo]) },
      })
    },
  })

  const submitTodo = (body) => {
    // An example of providing an optimistic response to a GraphQL mutation. Note
    // that `__typename` is required for each object in order to make this work.
    createTodo({
      variables: { body },
      optimisticResponse: {
        __typename: 'Mutation',
        createTodo: { __typename: 'Todo', id: 0, body, status: 'loading' },
      },
    })
  }

  return <AddTodoControl submitTodo={submitTodo} />
}

export default AddTodo
