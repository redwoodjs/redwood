'use client'

import type {
  FindEmptyUserById,
  FindEmptyUserByIdVariables,
} from 'types/graphql'

import type {
  CellSuccessProps,
  CellFailureProps,
  TypedDocumentNode,
} from '@redwoodjs/web'

import EmptyUser from 'src/components/EmptyUser/EmptyUser'

export const QUERY: TypedDocumentNode<
  FindEmptyUserById,
  FindEmptyUserByIdVariables
> = gql`
  query FindEmptyUserById($id: Int!) {
    emptyUser: emptyUser(id: $id) {
      id
      email
      name
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>EmptyUser not found</div>

export const Failure = ({
  error,
}: CellFailureProps<FindEmptyUserByIdVariables>) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  emptyUser,
}: CellSuccessProps<FindEmptyUserById, FindEmptyUserByIdVariables>) => {
  return <EmptyUser emptyUser={emptyUser} />
}
