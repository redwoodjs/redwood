import { setContext } from '@redwoodjs/graphql-server'
import { mockRedwoodDirective, getDirectiveName } from '@redwoodjs/testing/api'

import { schema, requireAuth } from './requireAuth.directive'

describe('requireAuth directive', () => {
  it('declares the directive sdl as schema, with the correct name', () => {
    expect(schema).toBeTruthy()
    expect(getDirectiveName(schema)).toBe('requireAuth')
  })

  it('requireAuth has stub implementation. Should not throw when current user', () => {
    // If you want to set values in context, use setContext:
    // import { setContext } from '@redwoodjs/graphql-server'
    // setContext({ currentUser: { id: 1, name: 'Lebron McGretzky' } })
    // or pass it to mockRedwoodDirective(requireAuth, { context: myMockedContext})

    expect(mockRedwoodDirective(requireAuth, {})).not.toThrowError()
  })
})
