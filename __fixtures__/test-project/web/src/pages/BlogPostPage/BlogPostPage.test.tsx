import { render } from '@redwoodjs/testing/web'

import BlogPostPage from './BlogPostPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('BlogPostPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<BlogPostPage id={42} />)
    }).not.toThrow()
  })
})
