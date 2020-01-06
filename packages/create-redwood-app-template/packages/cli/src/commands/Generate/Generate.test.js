import React from 'react'
import { render } from 'ink-testing-library'

import Generate from './Generate'

describe('Command: Generate', () => {
  const generators = {
    testGenerator: () => ({ 'a.js': 'a', 'a.test.js': 'b' }),
  }

  it('command usage is shown when no generator or an unknown generator is selected', () => {
    const { lastFrame } = render(
      <Generate args={['generate']} generators={generators} />
    )
    expect(lastFrame()).toMatch(/Usage:/g)
  })

  it('routes to the correct command', () => {
    const { lastFrame } = render(
      <Generate
        args={['generate', 'testGenerator', 'NewComponent']}
        generators={generators}
        fileWriter={() => {}}
      />
    )
    expect(lastFrame()).toMatch(/Wrote a.js/g)
  })
})
