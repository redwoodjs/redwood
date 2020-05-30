import { useMutation } from '@redwoodjs/web'
import { navigate, routes } from '@redwoodjs/router'
import UserProfileForm from 'src/components/UserProfileForm'

export const QUERY = gql`
  query FIND_USER_PROFILE_BY_ID($id: Int!) {
    userProfile: userProfile(id: $id) {
      id
      username
      userId
    }
  }
`
const UPDATE_USER_PROFILE_MUTATION = gql`
  mutation UpdateUserProfileMutation(
    $id: Int!
    $input: UpdateUserProfileInput!
  ) {
    updateUserProfile(id: $id, input: $input) {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Success = ({ userProfile }) => {
  const [updateUserProfile, { loading, error }] = useMutation(
    UPDATE_USER_PROFILE_MUTATION,
    {
      onCompleted: () => {
        navigate(routes.userProfiles())
      },
    }
  )

  const onSave = (input, id) => {
    const castInput = Object.assign(input, { userId: parseInt(input.userId) })
    updateUserProfile({ variables: { id, input: castInput } })
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <header className="bg-gray-300 text-gray-700 py-3 px-4">
        <h2 className="text-sm font-semibold">
          Edit UserProfile {userProfile.id}
        </h2>
      </header>
      <div className="bg-gray-100 p-4">
        <UserProfileForm
          userProfile={userProfile}
          onSave={onSave}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  )
}
