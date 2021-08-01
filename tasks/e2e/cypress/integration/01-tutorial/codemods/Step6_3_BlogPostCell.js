export default `
// web/src/components/BlogPostCell/BlogPostCell.js

import BlogPost from 'src/components/BlogPost'

import EmptyState from 'src/components/CellStates/EmptyState'
import FailureState from 'src/components/CellStates/FailureState'
import LoadingState from 'src/components/CellStates/LoadingState'

export const QUERY = gql\`
  query BlogPostQuery($id: Int!) {
    post(id: $id) {
      id
      title
      body
    }
  }
\`

export const Loading = () => <LoadingState />

export const Empty = () => <EmptyState />

export const Failure = ({ error }) => <FailureState error={error} />

export const Success = ({ post }) => {
  return <BlogPost post={post} />
}
`
