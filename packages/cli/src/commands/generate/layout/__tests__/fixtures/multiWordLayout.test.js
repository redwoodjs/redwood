import { render } from '@redwoodjs/testing'

import SinglePageLayout from './SinglePageLayout'

describe('SinglePageLayout', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<SinglePageLayout />)
    }).not.toThrow()
  })
})
