import { render } from '@redwoodjs/testing/web'

import NavigationLayout from './NavigationLayout'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('NavigationLayout', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<NavigationLayout />)
    }).not.toThrow()
  })
})
