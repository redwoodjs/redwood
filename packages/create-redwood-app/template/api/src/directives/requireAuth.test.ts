import { setContext } from '@redwoodjs/graphql-server'

import { schema, requireAuth } from './requireAuth.directive'

describe('requireAuth directive', () => {
  it('declares the directive sdl as schema', () => {
    const directiveDefinition = schema.definitions.find(
      (definition) => definition.kind === 'DirectiveDefinition'
    )

    expect(schema).toBeTruthy()
    expect(directiveDefinition.name.value).toBe('requireAuth')
  })

  it('requireAuth has stub implementation. Should not throw', () => {
    setContext({ currentUser: null })
    expect(requireAuth).not.toThrowError()
  })
})
