import type { FindAuthorQuery, FindAuthorQueryVariables } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import Author from "src/components/Author";

export const QUERY = gql`
  query FindAuthorQuery($id: Int!) {
    author: user(id: $id) {
      email
      fullName
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({
  error,
}: CellFailureProps<FindAuthorQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error.message}</div>
)

export const Success = (
  {
    author,
  }: CellSuccessProps<FindAuthorQuery, FindAuthorQueryVariables>
) => <span className="author-cell">
  <Author author={author} />
</span>
