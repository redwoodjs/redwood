export default `
// web/src/components/BlogPost/BlogPost.test.js

import { render } from '@redwoodjs/testing'

import BlogPost from './BlogPost'

const POST = {
  id: 42,
  title: 'The Answer',
}

describe('BlogPost', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<BlogPost post={POST} />)
    }).not.toThrow()
  })
})
`
