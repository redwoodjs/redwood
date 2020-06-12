import { render } from '@redwoodjs/testing'

import ContactUsPage from './ContactUsPage'

describe('ContactUsPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ContactUsPage />)
    }).not.toThrow()
  })
})
