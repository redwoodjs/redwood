import { useMutation } from '@redwoodjs/web'
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
  const [createUserProfile, { loading, error }] = useMutation(
    CREATE_USER_PROFILE_MUTATION,
    {
      onCompleted: () => {
        navigate(routes.userProfiles())
      },
    }
  )

  const onSave = (input) => {
    const castInput = Object.assign(input, { userId: parseInt(input.userId) })
    createUserProfile({ variables: { input: castInput } })
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <header className="bg-gray-300 text-gray-700 py-3 px-4">
        <h2 className="text-sm font-semibold">New UserProfile</h2>
      </header>
      <div className="bg-gray-100 p-4">
        <UserProfileForm onSave={onSave} loading={loading} error={error} />
      </div>
    </div>
  )
}

export default NewUserProfile
