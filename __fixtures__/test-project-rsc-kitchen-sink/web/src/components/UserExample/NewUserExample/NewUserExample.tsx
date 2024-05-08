'use client'

import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import UserExampleForm from 'src/components/UserExample/UserExampleForm'

import type { CreateUserExampleInput } from 'types/graphql'

const CREATE_USER_EXAMPLE_MUTATION = gql`
  mutation CreateUserExampleMutation($input: CreateUserExampleInput!) {
    createUserExample(input: $input) {
      id
    }
  }
`

const NewUserExample = () => {
  const [createUserExample, { loading, error }] = useMutation(
    CREATE_USER_EXAMPLE_MUTATION,
    {
      onCompleted: () => {
        toast.success('UserExample created')
        navigate(routes.userExamples())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (input: CreateUserExampleInput) => {
    createUserExample({ variables: { input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">New UserExample</h2>
      </header>
      <div className="rw-segment-main">
        <UserExampleForm onSave={onSave} loading={loading} error={error} />
      </div>
    </div>
  )
}

export default NewUserExample
