import { render } from '@redwoodjs/testing/web'

import Icons from './Icons'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('Icons', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<Icons />)
    }).not.toThrow()
  })
})
