'use client'

import { Link, routes, navigate } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import {} from 'src/lib/formatters'

import type {
  DeleteUserExampleMutationVariables,
  FindUserExampleById,
} from 'types/graphql'

const DELETE_USER_EXAMPLE_MUTATION = gql`
  mutation DeleteUserExampleMutation($id: Int!) {
    deleteUserExample(id: $id) {
      id
    }
  }
`

interface Props {
  userExample: NonNullable<FindUserExampleById['userExample']>
}

const UserExample = ({ userExample }: Props) => {
  const [deleteUserExample] = useMutation(DELETE_USER_EXAMPLE_MUTATION, {
    onCompleted: () => {
      toast.success('UserExample deleted')
      navigate(routes.userExamples())
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onDeleteClick = (id: DeleteUserExampleMutationVariables['id']) => {
    if (confirm('Are you sure you want to delete userExample ' + id + '?')) {
      deleteUserExample({ variables: { id } })
    }
  }

  return (
    <>
      <div className="rw-segment">
        <header className="rw-segment-header">
          <h2 className="rw-heading rw-heading-secondary">
            UserExample {userExample.id} Detail
          </h2>
        </header>
        <table className="rw-table">
          <tbody>
            <tr>
              <th>Id</th>
              <td>{userExample.id}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>{userExample.email}</td>
            </tr>
            <tr>
              <th>Name</th>
              <td>{userExample.name}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav className="rw-button-group">
        <Link
          // TODO (RSC): Fix this link
          to={'routes.editUserExample({ id: userExample.id })'}
          className="rw-button rw-button-blue"
        >
          Edit
        </Link>
        <button
          type="button"
          className="rw-button rw-button-red"
          onClick={() => onDeleteClick(userExample.id)}
        >
          Delete
        </button>
      </nav>
    </>
  )
}

export default UserExample
