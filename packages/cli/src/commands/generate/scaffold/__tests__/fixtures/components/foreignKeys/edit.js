import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'
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
      username
      userId
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Success = ({ userProfile }) => {
  const [updateUserProfile, { loading, error }] = useMutation(
    UPDATE_USER_PROFILE_MUTATION,
    {
      onCompleted: () => {
        toast.success('UserProfile updated')
        navigate(routes.userProfiles())
      },
    }
  )

  const onSave = (input, id) => {
    const castInput = Object.assign(input, { userId: parseInt(input.userId) })
    updateUserProfile({ variables: { id, input: castInput } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">
          Edit UserProfile {userProfile.id}
        </h2>
      </header>
      <div className="rw-segment-main">
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
