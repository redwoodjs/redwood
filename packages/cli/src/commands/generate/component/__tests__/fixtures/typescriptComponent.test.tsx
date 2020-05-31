import { render, cleanup } from '@redwoodjs/testing'

import TypescriptUser from './TypescriptUser'

describe('TypescriptUser', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders successfully', () => {
    expect(() => {
      render(<TypescriptUser />)
    }).not.toThrow()
  })
})
