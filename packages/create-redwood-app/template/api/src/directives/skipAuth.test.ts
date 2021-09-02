import { schema, skipAuth } from './skipAuth.directive'

describe('skipAuth directive', () => {
  it('declares the directive sdl as schema', () => {
    expect(schema).toBeTruthy()
  })

  it('has a skipAuth implementation that does not error', () => {
    expect(skipAuth).not.toThrow()
  })
})
