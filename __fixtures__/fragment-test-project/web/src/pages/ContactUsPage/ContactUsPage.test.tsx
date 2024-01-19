import { render } from '@redwoodjs/testing/web'

import ContactUsPage from './ContactUsPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('ContactUsPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ContactUsPage />)
    }).not.toThrow()
  })
})
