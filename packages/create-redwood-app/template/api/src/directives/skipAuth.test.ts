import { ExecutableDefinitionNode } from 'graphql'

import { setContext } from '@redwoodjs/graphql-server'

import { schema, skipAuth } from './skipAuth.directive'

describe('skipAuth directive', () => {
  it('declares the directive sdl as schema, with the correct name', () => {
    const directiveDefinition = schema.definitions.find(
      (definition) => definition.kind === 'DirectiveDefinition'
    ) as ExecutableDefinitionNode

    expect(schema).toBeTruthy()
    expect(directiveDefinition.name.value).toBe('skipAuth')
  })

  it('skipAuth has stub implementation. Should not throw', () => {
    setContext({ currentUser: null })
    expect(() => skipAuth()).not.toThrowError()
  })
})
