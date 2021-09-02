import { schema, requireAuth } from './requireAuth'

describe('requireAuth directive', () => {
  it('declares the directive sdl as schema', () => {
    expect(schema).toBeTruthy()
  })

  it('has a requireAuth implementation that does not error', () => {
    expect(requireAuth).not.toThrow()
  })
})
