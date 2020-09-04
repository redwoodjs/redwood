import { render } from '@redwoodjs/testing'

import PostPage from './PostPage'

describe('PostPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PostPage id="42" />)
    }).not.toThrow()
  })
})
