import { schema, skipAuth } from './skipAuth.directive'

describe('skipAuth directive', () => {
  it('declares the directive sdl as schema', () => {
    const directiveDefinition = schema.definitions.find(
      (definition) => definition.kind === 'DirectiveDefinition'
    )

    expect(schema).toBeTruthy()
    expect(directiveDefinition.name.value).toBe('skipAuth')
  })

  it('has a skipAuth implementation that does not error', () => {
    expect(skipAuth).not.toThrow()
  })
})
