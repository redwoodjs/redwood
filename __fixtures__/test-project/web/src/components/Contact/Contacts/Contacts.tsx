import type {
  DeleteContactMutation,
  DeleteContactMutationVariables,
  FindContacts,
} from 'types/graphql'

import { Link, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import type { TypedDocumentNode } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { QUERY } from 'src/components/Contact/ContactsCell'
import { timeTag, truncate } from 'src/lib/formatters'

const DELETE_CONTACT_MUTATION: TypedDocumentNode<
  DeleteContactMutation,
  DeleteContactMutationVariables
> = gql`
  mutation DeleteContactMutation($id: Int!) {
    deleteContact(id: $id) {
      id
    }
  }
`

const ContactsList = ({ contacts }: FindContacts) => {
  const [deleteContact] = useMutation(DELETE_CONTACT_MUTATION, {
    onCompleted: () => {
      toast.success('Contact deleted')
    },
    onError: (error) => {
      toast.error(error.message)
    },
    // This refetches the query on the list page. Read more about other ways to
    // update the cache over here:
    // https://www.apollographql.com/docs/react/data/mutations/#making-all-other-cache-updates
    refetchQueries: [{ query: QUERY }],
    awaitRefetchQueries: true,
  })

  const onDeleteClick = (id: DeleteContactMutationVariables['id']) => {
    if (confirm('Are you sure you want to delete contact ' + id + '?')) {
      deleteContact({ variables: { id } })
    }
  }

  return (
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Email</th>
            <th>Message</th>
            <th>Created at</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>{truncate(contact.id)}</td>
              <td>{truncate(contact.name)}</td>
              <td>{truncate(contact.email)}</td>
              <td>{truncate(contact.message)}</td>
              <td>{timeTag(contact.createdAt)}</td>
              <td>
                <nav className="rw-table-actions">
                  <Link
                    to={routes.contact({ id: contact.id })}
                    title={'Show contact ' + contact.id + ' detail'}
                    className="rw-button rw-button-small"
                  >
                    Show
                  </Link>
                  <Link
                    to={routes.editContact({ id: contact.id })}
                    title={'Edit contact ' + contact.id}
                    className="rw-button rw-button-small rw-button-blue"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    title={'Delete contact ' + contact.id}
                    className="rw-button rw-button-small rw-button-red"
                    onClick={() => onDeleteClick(contact.id)}
                  >
                    Delete
                  </button>
                </nav>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ContactsList
