import { render, cleanup } from '@redwoodjs/testing'

import AppLayout from './AppLayout'

describe('AppLayout', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders successfully', () => {
    expect(() => {
      render(<AppLayout />)
    }).not.toThrow()
  })
})
