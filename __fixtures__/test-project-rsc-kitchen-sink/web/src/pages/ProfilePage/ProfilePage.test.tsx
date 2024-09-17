import { render, waitFor, screen } from '@redwoodjs/testing/web'

import ProfilePage from './ProfilePage'

describe('ProfilePage', () => {
  it('renders successfully', async () => {
    mockCurrentUser({
      email: 'danny@bazinga.com',
      id: 84849020,
      roles: 'BAZINGA',
    })

    await waitFor(async () => {
      expect(() => {
        render(<ProfilePage />)
      }).not.toThrow()
    })

    expect(await screen.findByText('danny@bazinga.com')).toBeInTheDocument()
  })
})
