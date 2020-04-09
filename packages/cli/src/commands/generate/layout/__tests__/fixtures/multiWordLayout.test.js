import { render, cleanup } from '@testing-library/react'

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
