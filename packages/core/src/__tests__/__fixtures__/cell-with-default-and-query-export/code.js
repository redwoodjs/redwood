export const QUERY = gql`
  query {
    posts {
      id
      title
      body
    }
  }
`

export default () => {
  return 'string'
}
