import { describe, expect, it, vitest } from 'vitest'

import type { Middleware } from './invokeMiddleware'
import type { MiddlewareReg } from './registerMIddleware'
import { groupByRoutePatterns } from './registerMIddleware'

const fakeMiddleware: Middleware = vitest.fn()

describe('groupByRoutePatterns', () => {
  it('should group middleware by default *', () => {
    const simpleExample = [fakeMiddleware]

    const output = groupByRoutePatterns(simpleExample)

    expect(output['*']).toStrictEqual([fakeMiddleware])
  })

  it('should handle when mixed types are provided', () => {
    const mixedTypes: MiddlewareReg = [
      fakeMiddleware,
      [fakeMiddleware, '/*.{extension}'],
    ]

    const output = groupByRoutePatterns(mixedTypes)

    expect(output['*']).toStrictEqual([fakeMiddleware])
    expect(output['/*.{extension}']).toStrictEqual([fakeMiddleware])
  })

  it('Should multiple middleware for the same pattern', () => {
    const multiple: MiddlewareReg = [
      fakeMiddleware,
      [fakeMiddleware, '/*.png'],
      [fakeMiddleware, '/*.png'],
      [fakeMiddleware, '/*.png'],
      fakeMiddleware,
    ]

    const output = groupByRoutePatterns(multiple)

    expect(output['*'].length).toBe(2)
    expect(output['/*.png'].length).toBe(3)
  })
})
