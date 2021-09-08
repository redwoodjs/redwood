import { mockRedwoodDirective, getDirectiveName } from '@redwoodjs/testing/api'

import { schema, requireAuth } from './requireAuth.directive'

describe('requireAuth directive', () => {
  it('declares the directive sdl as schema, with the correct name', () => {
    expect(schema).toBeTruthy()
    expect(getDirectiveName(schema)).toBe('requireAuth')
  })

  it('requireAuth has stub implementation. Should not throw when current user', () => {
    // If you want to set values in context, pass it through e.g.
    // mockRedwoodDirective(requireAuth, { context: { currentUser: { id: 1, name: 'Lebron McGretzky' } }})

    expect(
      mockRedwoodDirective(requireAuth, { context: {} })
    ).not.toThrowError()
  })
})
