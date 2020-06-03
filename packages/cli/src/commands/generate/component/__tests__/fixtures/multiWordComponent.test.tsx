import { render, cleanup } from '@redwoodjs/testing'

import UserProfile from './UserProfile'

describe('UserProfile', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders successfully', () => {
    expect(() => {
      render(<UserProfile />)
    }).not.toThrow()
  })
})
