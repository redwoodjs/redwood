import type {
  DeleteEmptyUserMutation,
  DeleteEmptyUserMutationVariables,
  FindEmptyUserById,
} from 'types/graphql'

import { Link, routes, navigate } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import type { TypedDocumentNode } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import {} from 'src/lib/formatters'

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

interface Props {
  emptyUser: NonNullable<FindEmptyUserById['emptyUser']>
}

const EmptyUser = ({ emptyUser }: Props) => {
  const [deleteEmptyUser] = useMutation(DELETE_EMPTY_USER_MUTATION, {
    onCompleted: () => {
      toast.success('EmptyUser deleted')
      navigate(routes.emptyUsers())
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onDeleteClick = (id: DeleteEmptyUserMutationVariables['id']) => {
    if (confirm('Are you sure you want to delete emptyUser ' + id + '?')) {
      deleteEmptyUser({ variables: { id } })
    }
  }

  return (
    <>
      <div className="rw-segment">
        <header className="rw-segment-header">
          <h2 className="rw-heading rw-heading-secondary">
            EmptyUser {emptyUser.id} Detail
          </h2>
        </header>
        <table className="rw-table">
          <tbody>
            <tr>
              <th>Id</th>
              <td>{emptyUser.id}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>{emptyUser.email}</td>
            </tr>
            <tr>
              <th>Name</th>
              <td>{emptyUser.name}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav className="rw-button-group">
        <Link
          to={routes.editEmptyUser({ id: emptyUser.id })}
          className="rw-button rw-button-blue"
        >
          Edit
        </Link>
        <button
          type="button"
          className="rw-button rw-button-red"
          onClick={() => onDeleteClick(emptyUser.id)}
        >
          Delete
        </button>
      </nav>
    </>
  )
}

export default EmptyUser
