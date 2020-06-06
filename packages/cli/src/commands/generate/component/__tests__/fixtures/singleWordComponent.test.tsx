import { render, cleanup } from '@redwoodjs/testing'

import User from './User'

describe('User', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders successfully', () => {
    expect(() => {
      render(<User />)
    }).not.toThrow()
  })
})
