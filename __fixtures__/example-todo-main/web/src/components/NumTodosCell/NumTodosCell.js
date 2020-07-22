export const QUERY = gql`
  query NumTodosCell_GetCount {
    todosCount
  }
`

export const Loading = () => <div>Loading...</div>

export const Success = ({ todosCount }) => {
  return <>{todosCount}</>
}
