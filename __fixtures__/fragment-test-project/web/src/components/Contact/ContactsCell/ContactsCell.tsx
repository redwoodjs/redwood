import type { FindContacts, FindContactsVariables } from 'types/graphql'

import { Link, routes } from '@redwoodjs/router'
import type {
  CellSuccessProps,
  CellFailureProps,
  TypedDocumentNode,
} from '@redwoodjs/web'

import Contacts from 'src/components/Contact/Contacts'

export const QUERY: TypedDocumentNode<
  FindContacts,
  FindContactsVariables
> = gql`
  query FindContacts {
    contacts {
      id
      name
      email
      message
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => {
  return (
    <div className="rw-text-center">
      {'No contacts yet. '}
      <Link to={routes.newContact()} className="rw-link">
        {'Create one?'}
      </Link>
    </div>
  )
}

export const Failure = ({ error }: CellFailureProps<FindContacts>) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  contacts,
}: CellSuccessProps<FindContacts, FindContactsVariables>) => {
  return <Contacts contacts={contacts} />
}
