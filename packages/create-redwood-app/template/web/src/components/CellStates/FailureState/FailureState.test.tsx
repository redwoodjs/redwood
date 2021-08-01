import { render } from '@redwoodjs/testing'

import FailureState from './FailureState'

describe('FailureState', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<FailureState error={new Error('Oh no')}/>)
    }).not.toThrow()
  })
})
