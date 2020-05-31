import { render, cleanup } from '@redwoodjs/testing'

import JavascriptUser from './JavascriptUser'

describe('JavascriptUser', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders successfully', () => {
    expect(() => {
      render(<JavascriptUser />)
    }).not.toThrow()
  })
})
