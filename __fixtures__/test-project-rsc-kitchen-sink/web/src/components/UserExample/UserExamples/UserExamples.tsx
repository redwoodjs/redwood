'use client'

// import { Link, routes } from '@redwoodjs/router'
import { Link } from '@redwoodjs/router'
import type {
  DeleteUserExampleMutationVariables,
  FindUserExamples,
} from 'types/graphql'

import { useMutation } from '@redwoodjs/web/dist/components/GraphQLHooksProvider'
import { toast } from '@redwoodjs/web/toast'

import { truncate } from '../../../lib/formatters'
// import { QUERY } from '../UserExamplesCell/UserExamplesCell'

// TODO (RSC): Figure out why we can't import from the cell above
const QUERY = gql`
  query FindUserExamples {
    userExamples {
      id
      email
      name
    }
  }
`

const DELETE_USER_EXAMPLE_MUTATION = gql`
  mutation DeleteUserExampleMutation($id: Int!) {
    deleteUserExample(id: $id) {
      id
    }
  }
`

const UserExamplesList = ({ userExamples }: FindUserExamples) => {
  const [deleteUserExample] = useMutation(DELETE_USER_EXAMPLE_MUTATION, {
    onCompleted: () => {
      toast.success('UserExample deleted')
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

  const onDeleteClick = (id: DeleteUserExampleMutationVariables['id']) => {
    if (confirm('Are you sure you want to delete userExample ' + id + '?')) {
      deleteUserExample({ variables: { id } })
    }
  }

  const routes = {
    userExample: (args: { id: number }) => `/user-examples/${args.id}`,
    editUserExample: (args: { id: number }) => `/user-examples/${args.id}/edit`,
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
          {userExamples.map((userExample) => (
            <tr key={userExample.id}>
              <td>{truncate(userExample.id)}</td>
              <td>{truncate(userExample.email)}</td>
              <td>{truncate(userExample.name)}</td>
              <td>
                <nav className="rw-table-actions">
                  <Link
                    to={routes.userExample({ id: userExample.id })}
                    title={'Show userExample ' + userExample.id + ' detail'}
                    className="rw-button rw-button-small"
                  >
                    Show
                  </Link>
                  <Link
                    to={routes.editUserExample({ id: userExample.id })}
                    title={'Edit userExample ' + userExample.id}
                    className="rw-button rw-button-small rw-button-blue"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    title={'Delete userExample ' + userExample.id}
                    className="rw-button rw-button-small rw-button-red"
                    onClick={() => onDeleteClick(userExample.id)}
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

export default UserExamplesList
