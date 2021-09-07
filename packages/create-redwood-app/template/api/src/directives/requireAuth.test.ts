import { ExecutableDefinitionNode } from 'graphql'

import { setContext } from '@redwoodjs/graphql-server'

import { schema, requireAuth } from './requireAuth.directive'

describe('requireAuth directive', () => {
  it('declares the directive sdl as schema, with the correct name', () => {
    const directiveDefinition = schema.definitions.find(
      (definition) => definition.kind === 'DirectiveDefinition'
    ) as ExecutableDefinitionNode

    expect(schema).toBeTruthy()
    expect(directiveDefinition.name.value).toBe('requireAuth')
  })

  it('requireAuth has stub implementation. Should not throw', () => {
    setContext({ currentUser: 'Lebron McGretzky' })
    expect(() =>
      requireAuth({
        getFieldValue: () => {
          return
        },

        context: {},
        root: {},
        args: {},
        info: undefined,
      })
    ).not.toThrowError()
  })

  it('requireAuth has stub implementation. Should not throw when current user', () => {
    setContext({ currentUser: { id: 1, name: 'Lebron McGretzky' } })

    expect(() =>
      requireAuth({
        getFieldValue: () => {
          return
        },

        context: { currentUser: { id: 1, name: 'Lebron McGretzky' } },
        root: {},
        args: {},
        info: undefined,
      })
    ).not.toThrowError()
  })
})
