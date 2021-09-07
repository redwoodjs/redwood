import { getDirectiveName } from '@redwoodjs/testing/api'

import { schema } from './skipAuth.directive'

describe('skipAuth directive', () => {
  it('declares the directive sdl as schema, with the correct name', () => {
    expect(schema).toBeTruthy()
    expect(getDirectiveName(schema)).toBe('skipAuth')
  })
})
