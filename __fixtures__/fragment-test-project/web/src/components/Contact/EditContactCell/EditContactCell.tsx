import type {
  EditContactById,
  UpdateContactInput,
  UpdateContactMutationVariables,
} from 'types/graphql'

import { navigate, routes } from '@redwoodjs/router'
import type {
  CellSuccessProps,
  CellFailureProps,
  TypedDocumentNode,
} from '@redwoodjs/web'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import ContactForm from 'src/components/Contact/ContactForm'

export const QUERY: TypedDocumentNode<EditContactById> = gql`
  query EditContactById($id: Int!) {
    contact: contact(id: $id) {
      id
      name
      email
      message
      createdAt
    }
  }
`

const UPDATE_CONTACT_MUTATION: TypedDocumentNode<
  EditContactById,
  UpdateContactMutationVariables
> = gql`
  mutation UpdateContactMutation($id: Int!, $input: UpdateContactInput!) {
    updateContact(id: $id, input: $input) {
      id
      name
      email
      message
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({ contact }: CellSuccessProps<EditContactById>) => {
  const [updateContact, { loading, error }] = useMutation(
    UPDATE_CONTACT_MUTATION,
    {
      onCompleted: () => {
        toast.success('Contact updated')
        navigate(routes.contacts())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (
    input: UpdateContactInput,
    id: EditContactById['contact']['id']
  ) => {
    updateContact({ variables: { id, input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">
          Edit Contact {contact?.id}
        </h2>
      </header>
      <div className="rw-segment-main">
        <ContactForm
          contact={contact}
          onSave={onSave}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  )
}
