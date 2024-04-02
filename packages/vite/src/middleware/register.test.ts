import { describe, expect, it, vitest } from 'vitest'

import { MiddlewareRequest } from './MiddlewareRequest'
import { MiddlewareResponse } from './MiddlewareResponse'
import type { MiddlewareReg } from './register'
import { groupByRoutePatterns } from './register'
import type { Middleware, MiddlewareClass } from './types'

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

  it('Throws if not a function, instance or tuple', () => {
    const badInput: MiddlewareReg = ['/badinput'] as any

    expect(() => groupByRoutePatterns(badInput)).toThrow()
  })

  it('Handles class based middleware', async () => {
    class FakeMiddleware implements MiddlewareClass {
      value: number
      constructor(value: number) {
        this.value = value
      }
      async invoke() {
        return new MiddlewareResponse('MW initialized with ' + this.value)
      }
    }

    const classBased: MiddlewareReg = [
      new FakeMiddleware(1),
      [new FakeMiddleware(2), '/second-path'],
    ]

    const output = groupByRoutePatterns(classBased)

    const exampleRequest = new MiddlewareRequest(
      new Request('https://example.com'),
    )

    const firstOutput = await output['*'][0]?.(exampleRequest)
    expect(firstOutput?.body).toBe('MW initialized with 1')

    const secondOutput = await output['/second-path'][0]?.(exampleRequest)
    expect(secondOutput?.body).toBe('MW initialized with 2')
  })
})
