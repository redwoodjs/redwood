import type { FindAuthorQuery, FindAuthorQueryVariables } from 'types/graphql'

import type {
   CellFailureProps,
   CellLoadingProps,
   CellSuccessProps,
   TypedDocumentNode,
} from '@redwoodjs/web'

import Author from 'src/components/Author'

export const QUERY: TypedDocumentNode<
  FindAuthorQuery,
  FindAuthorQueryVariables
> = gql`
  query FindAuthorQuery($id: Int!) {
    author: user(id: $id) {
      email
      fullName
    }
  }
`

export const Loading: React.FC<
  CellLoadingProps<FindAuthorQueryVariables>
> = () => <span>Loading...</span>

export const Empty: React.FC<
  CellSuccessProps<FindAuthorQueryVariables>
> = () => <span>Empty</span>

export const Failure: React.FC<CellFailureProps<FindAuthorQueryVariables>> = ({
  error,
}) => <span style={{ color: 'red' }}>Error: {error?.message}</span>

export const Success: React.FC<
  CellSuccessProps<FindAuthorQuery, FindAuthorQueryVariables>
> = ({ author }) => (
  <span className="author-cell">
    <Author author={author} />
  </span>
)
