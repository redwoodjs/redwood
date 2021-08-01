import { render } from '@redwoodjs/testing'

import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<EmptyState />)
    }).not.toThrow()
  })
})
