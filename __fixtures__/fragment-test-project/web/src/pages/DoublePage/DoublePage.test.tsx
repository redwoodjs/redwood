import { render } from '@redwoodjs/testing/web'

import DoublePage from './DoublePage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('DoublePage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<DoublePage />)
    }).not.toThrow()
  })
})
