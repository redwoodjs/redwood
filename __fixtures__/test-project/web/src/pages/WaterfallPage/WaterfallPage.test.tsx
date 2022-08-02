import { render } from '@redwoodjs/testing/web'

import WaterfallPage from './WaterfallPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('WaterfallPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<WaterfallPage id={42} />)
    }).not.toThrow()
  })
})
