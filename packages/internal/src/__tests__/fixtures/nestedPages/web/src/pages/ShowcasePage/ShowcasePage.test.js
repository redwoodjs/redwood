import { render } from '@redwoodjs/testing/web'

import ShowcasePage from './ShowcasePage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('ShowcasePage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ShowcasePage />)
    }).not.toThrow()
  })
})
