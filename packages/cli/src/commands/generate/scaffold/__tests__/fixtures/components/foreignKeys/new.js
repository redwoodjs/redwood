import { useMutation, useFlash } from '@redwoodjs/web'
import { navigate, routes } from '@redwoodjs/router'
import UserProfileForm from 'src/components/UserProfileForm'

const CREATE_USER_PROFILE_MUTATION = gql`
  mutation CreateUserProfileMutation($input: CreateUserProfileInput!) {
    createUserProfile(input: $input) {
      id
    }
  }
`

const NewUserProfile = () => {
  const { addMessage } = useFlash()
  const [createUserProfile, { loading, error }] = useMutation(
    CREATE_USER_PROFILE_MUTATION,
    {
      onCompleted: () => {
        navigate(routes.userProfiles())
        addMessage('UserProfile created.', { classes: 'rw-flash-success' })
      },
    }
  )

  const onSave = (input) => {
    const castInput = Object.assign(input, { userId: parseInt(input.userId) })
    createUserProfile({ variables: { input: castInput } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">New UserProfile</h2>
      </header>
      <div className="rw-segment-main">
        <UserProfileForm onSave={onSave} loading={loading} error={error} />
      </div>
    </div>
  )
}

export default NewUserProfile
