import type {
  DeleteEmptyUserMutation,
  DeleteEmptyUserMutationVariables,
  FindEmptyUsers,
} from 'types/graphql'

import { Link, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import type { TypedDocumentNode } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { QUERY } from 'src/components/EmptyUser/EmptyUsersCell'
import { truncate } from 'src/lib/formatters'

const DELETE_EMPTY_USER_MUTATION: TypedDocumentNode<
  DeleteEmptyUserMutation,
  DeleteEmptyUserMutationVariables
> = gql`
  mutation DeleteEmptyUserMutation($id: Int!) {
    deleteEmptyUser(id: $id) {
      id
    }
  }
`

const EmptyUsersList = ({ emptyUsers }: FindEmptyUsers) => {
  const [deleteEmptyUser] = useMutation(DELETE_EMPTY_USER_MUTATION, {
    onCompleted: () => {
      toast.success('EmptyUser deleted')
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

  const onDeleteClick = (id: DeleteEmptyUserMutationVariables['id']) => {
    if (confirm('Are you sure you want to delete emptyUser ' + id + '?')) {
      deleteEmptyUser({ variables: { id } })
    }
  }

  return (
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Email</th>
            <th>Name</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {emptyUsers.map((emptyUser) => (
            <tr key={emptyUser.id}>
              <td>{truncate(emptyUser.id)}</td>
              <td>{truncate(emptyUser.email)}</td>
              <td>{truncate(emptyUser.name)}</td>
              <td>
                <nav className="rw-table-actions">
                  <Link
                    to={routes.emptyUser({ id: emptyUser.id })}
                    title={'Show emptyUser ' + emptyUser.id + ' detail'}
                    className="rw-button rw-button-small"
                  >
                    Show
                  </Link>
                  <Link
                    to={routes.editEmptyUser({ id: emptyUser.id })}
                    title={'Edit emptyUser ' + emptyUser.id}
                    className="rw-button rw-button-small rw-button-blue"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    title={'Delete emptyUser ' + emptyUser.id}
                    className="rw-button rw-button-small rw-button-red"
                    onClick={() => onDeleteClick(emptyUser.id)}
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

export default EmptyUsersList
