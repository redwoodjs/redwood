import { render, cleanup } from '@redwoodjs/testing'

import HomePage from './HomePage'

describe('HomePage', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders successfully', () => {
    expect(() => {
      render(<HomePage />)
    }).not.toThrow()
  })
})
