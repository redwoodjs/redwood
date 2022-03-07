import { render } from '@redwoodjs/testing/web'

import ProfilePage from './ProfilePage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('ProfilePage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ProfilePage />)
    }).not.toThrow()
  })
})
