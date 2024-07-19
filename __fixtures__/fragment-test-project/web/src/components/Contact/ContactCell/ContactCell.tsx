import type { FindContactById, FindContactByIdVariables } from 'types/graphql'

import type {
  CellSuccessProps,
  CellFailureProps,
  TypedDocumentNode,
} from '@redwoodjs/web'

import Contact from 'src/components/Contact/Contact'

export const QUERY: TypedDocumentNode<
  FindContactById,
  FindContactByIdVariables
> = gql`
  query FindContactById($id: Int!) {
    contact: contact(id: $id) {
      id
      name
      email
      message
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Contact not found</div>

export const Failure = ({
  error,
}: CellFailureProps<FindContactByIdVariables>) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  contact,
}: CellSuccessProps<FindContactById, FindContactByIdVariables>) => {
  return <Contact contact={contact} />
}
