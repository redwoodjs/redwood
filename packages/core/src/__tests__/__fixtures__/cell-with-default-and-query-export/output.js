import { withCell } from '@redwoodjs/web'
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
export default withCell({
  QUERY,
})
