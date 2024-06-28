'use client'

import type {
  CreateEmptyUserMutation,
  CreateEmptyUserInput,
  CreateEmptyUserMutationVariables,
} from 'types/graphql'

import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import type { TypedDocumentNode } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import EmptyUserForm from 'src/components/EmptyUser/EmptyUserForm'

const CREATE_EMPTY_USER_MUTATION: TypedDocumentNode<
  CreateEmptyUserMutation,
  CreateEmptyUserMutationVariables
> = gql`
  mutation CreateEmptyUserMutation($input: CreateEmptyUserInput!) {
    createEmptyUser(input: $input) {
      id
    }
  }
`

const NewEmptyUser = () => {
  const [createEmptyUser, { loading, error }] = useMutation(
    CREATE_EMPTY_USER_MUTATION,
    {
      onCompleted: () => {
        toast.success('EmptyUser created')
        navigate(routes.emptyUsers())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (input: CreateEmptyUserInput) => {
    createEmptyUser({ variables: { input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">New EmptyUser</h2>
      </header>
      <div className="rw-segment-main">
        <EmptyUserForm onSave={onSave} loading={loading} error={error} />
      </div>
    </div>
  )
}

export default NewEmptyUser
