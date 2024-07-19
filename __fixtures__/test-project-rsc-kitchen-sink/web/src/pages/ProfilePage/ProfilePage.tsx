import { getAuthState } from '@redwoodjs/server-store'
import { Metadata } from '@redwoodjs/web/dist/components/Metadata'

import { LogOutButton } from './LogOutButton'

// TODO (RSC): Remove this when hasRole is included in getAuthState
function hasRole(_role: string) {
  return false
}

const ProfilePage = () => {
  // TODO (RSC): Include hasRole in getAuthState
  // const { currentUser, isAuthenticated, hasRole } = getAuthState()
  const { currentUser, isAuthenticated } = getAuthState()

  return (
    <>
      <Metadata title="Profile" description="Profile page" og />

      <h1 className="text-2xl">Profile</h1>

      <table className="rw-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ID</td>
            <td>{currentUser.id}</td>
          </tr>
          <tr>
            <td>ROLES</td>
            <td>{currentUser.roles}</td>
          </tr>
          <tr>
            <td>EMAIL</td>
            <td>{currentUser.email}</td>
          </tr>

          <tr key="isAuthenticated">
            <td>isAuthenticated</td>
            <td>{JSON.stringify(isAuthenticated)}</td>
          </tr>

          <tr key="hasRole">
            <td>Is Admin</td>
            <td>{JSON.stringify(hasRole('ADMIN'))}</td>
          </tr>
        </tbody>
      </table>

      <LogOutButton />
    </>
  )
}

export default ProfilePage
