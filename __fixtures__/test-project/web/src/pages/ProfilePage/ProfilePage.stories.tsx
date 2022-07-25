import ProfilePage from './ProfilePage'

export const generated = (args) => {
  mockCurrentUser({
    email: 'ba@zinga.com',
    id: 55,
    roles: 'ADMIN',
  })

  return <ProfilePage {...args} />
}

export default { title: 'Pages/ProfilePage' }
