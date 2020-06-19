import { render } from '@redwoodjs/testing'

import BlogLayout from './BlogLayout'

describe('BlogLayout', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<BlogLayout />)
    }).not.toThrow()
  })
})
