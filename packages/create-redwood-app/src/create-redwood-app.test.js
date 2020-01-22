import React from 'react'
import { render } from 'ink-testing-library'

jest.mock('fs')

import { CreateNewApp } from './create-redwood-app'

describe('Router', () => {
  it("'Usage' is shown when you don't prodive a target directory", () => {
    const { lastFrame } = render(<CreateNewApp args={undefined} />)
    expect(lastFrame()).toMatch(/Usage/g)
  })
})
