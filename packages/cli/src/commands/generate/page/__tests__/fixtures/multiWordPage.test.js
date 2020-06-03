import { render, cleanup } from '@redwoodjs/testing'

import ContactUsPage from './ContactUsPage'

describe('ContactUsPage', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders successfully', () => {
    expect(() => {
      render(<ContactUsPage />)
    }).not.toThrow()
  })
})
