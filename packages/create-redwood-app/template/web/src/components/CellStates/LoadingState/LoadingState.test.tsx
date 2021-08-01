import { render } from '@redwoodjs/testing'

import LoadingState from './LoadingState'

describe('LoadingState', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<LoadingState />)
    }).not.toThrow()
  })
})
