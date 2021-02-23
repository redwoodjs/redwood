export default `
// web/src/components/BlogPostCell/BlogPostCell.js

import BlogPost from 'src/components/BlogPost'

export const QUERY = gql\`
  query BlogPostQuery($id: Int!) {
    post(id: $id) {
      id
      title
      body
    }
  }
\`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ post }) => {
  return <BlogPost post={post} />
}
`
