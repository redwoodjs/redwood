import ProfilePage from './ProfilePage'

export const generated = () => {
  mockCurrentUser({
    email: 'ba@zinga.com',
    id: 55,
    roles: 'ADMIN',
  })

  return <ProfilePage />
}

export default { title: 'Pages/ProfilePage' }
