'use client'

import type {
  EditEmptyUserById,
  UpdateEmptyUserInput,
  UpdateEmptyUserMutationVariables,
} from 'types/graphql'

import { navigate, routes } from '@redwoodjs/router'
import type {
  CellSuccessProps,
  CellFailureProps,
  TypedDocumentNode,
} from '@redwoodjs/web'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import EmptyUserForm from 'src/components/EmptyUser/EmptyUserForm'

export const QUERY: TypedDocumentNode<EditEmptyUserById> = gql`
  query EditEmptyUserById($id: Int!) {
    emptyUser: emptyUser(id: $id) {
      id
      email
      name
    }
  }
`

const UPDATE_EMPTY_USER_MUTATION: TypedDocumentNode<
  EditEmptyUserById,
  UpdateEmptyUserMutationVariables
> = gql`
  mutation UpdateEmptyUserMutation($id: Int!, $input: UpdateEmptyUserInput!) {
    updateEmptyUser(id: $id, input: $input) {
      id
      email
      name
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({ emptyUser }: CellSuccessProps<EditEmptyUserById>) => {
  const [updateEmptyUser, { loading, error }] = useMutation(
    UPDATE_EMPTY_USER_MUTATION,
    {
      onCompleted: () => {
        toast.success('EmptyUser updated')
        navigate(routes.emptyUsers())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (
    input: UpdateEmptyUserInput,
    id: EditEmptyUserById['emptyUser']['id']
  ) => {
    updateEmptyUser({ variables: { id, input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">
          Edit EmptyUser {emptyUser?.id}
        </h2>
      </header>
      <div className="rw-segment-main">
        <EmptyUserForm
          emptyUser={emptyUser}
          onSave={onSave}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  )
}
