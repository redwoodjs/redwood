import { render, cleanup } from '@testing-library/react'

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
