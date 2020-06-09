import { render, cleanup } from '@redwoodjs/testing'

import SinglePageLayout from './SinglePageLayout'

describe('SinglePageLayout', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders successfully', () => {
    expect(() => {
      render(<SinglePageLayout />)
    }).not.toThrow()
  })
})
