'use client'

import type { EditUserExampleById, UpdateUserExampleInput } from 'types/graphql'

import { navigate, routes } from '@redwoodjs/router'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import UserExampleForm from 'src/components/UserExample/UserExampleForm'

export const QUERY = gql`
  query EditUserExampleById($id: Int!) {
    userExample: userExample(id: $id) {
      id
      email
      name
    }
  }
`
const UPDATE_USER_EXAMPLE_MUTATION = gql`
  mutation UpdateUserExampleMutation(
    $id: Int!
    $input: UpdateUserExampleInput!
  ) {
    updateUserExample(id: $id, input: $input) {
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

export const Success = ({
  userExample,
}: CellSuccessProps<EditUserExampleById>) => {
  const [updateUserExample, { loading, error }] = useMutation(
    UPDATE_USER_EXAMPLE_MUTATION,
    {
      onCompleted: () => {
        toast.success('UserExample updated')
        navigate(routes.userExamples())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (
    input: UpdateUserExampleInput,
    id: EditUserExampleById['userExample']['id']
  ) => {
    updateUserExample({ variables: { id, input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">
          Edit UserExample {userExample?.id}
        </h2>
      </header>
      <div className="rw-segment-main">
        <UserExampleForm
          userExample={userExample}
          onSave={onSave}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  )
}
