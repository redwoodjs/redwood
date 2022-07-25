import type { FindContactById } from 'types/graphql'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import Contact from 'src/components/Contact/Contact'

export const QUERY = gql`
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

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({ contact }: CellSuccessProps<FindContactById>) => {
  return <Contact contact={contact} />
}
