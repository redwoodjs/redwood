import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import { useAuth } from 'src/auth'

const ProfilePage = () => {
  const { currentUser, isAuthenticated, hasRole, loading } = useAuth()

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <>
      <MetaTags title="Profile" description="Profile page" />

      <h1 className="text-2xl">Profile</h1>

      <table className="rw-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(currentUser).map((key) => {
            return (
              <tr key={key}>
                <td>{key.toUpperCase()}</td>
                <td>{currentUser[key]}</td>
              </tr>
            )
          })}

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
    </>
  )
}

export default ProfilePage
