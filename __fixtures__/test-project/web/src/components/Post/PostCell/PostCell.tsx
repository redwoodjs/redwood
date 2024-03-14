import type { FindPostById, FindPostByIdVariables } from 'types/graphql'

import type {
  CellSuccessProps,
  CellFailureProps,
  TypedDocumentNode,
} from '@redwoodjs/web'

import Post from 'src/components/Post/Post'

export const QUERY: TypedDocumentNode<
  FindPostById,
  FindPostByIdVariables
> = gql`
  query FindPostById($id: Int!) {
    post: post(id: $id) {
      id
      title
      body
      authorId
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Post not found</div>

export const Failure = ({ error }: CellFailureProps<FindPostByIdVariables>) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  post,
}: CellSuccessProps<FindPostById, FindPostByIdVariables>) => {
  return <Post post={post} />
}
