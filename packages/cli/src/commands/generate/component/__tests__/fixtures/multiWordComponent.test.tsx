import { render } from '@redwoodjs/testing'

import UserProfile from './UserProfile'

describe('UserProfile', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<UserProfile />)
    }).not.toThrow()
  })
})
