import { render } from '@redwoodjs/testing/web'

import GroceriesPage from './GroceriesPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('GroceriesPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<GroceriesPage />)
    }).not.toThrow()
  })
})
