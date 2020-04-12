import { render, cleanup } from '@testing-library/react'

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
