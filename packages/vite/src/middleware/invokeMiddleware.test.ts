import type { MockInstance } from 'vitest'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import { middlewareDefaultAuthProviderState } from '@redwoodjs/auth'

import { invoke } from './invokeMiddleware'
import type { MiddlewareRequest } from './MiddlewareRequest'
import { MiddlewareResponse } from './MiddlewareResponse'
import type { Middleware } from './types'

describe('Invoke middleware', () => {
  test('returns a MiddlewareResponse, even if no middleware defined', async () => {
    const [mwRes, authState] = await invoke(new Request('https://example.com'))
    expect(mwRes).toBeInstanceOf(MiddlewareResponse)
    expect(authState).toEqual(middlewareDefaultAuthProviderState)
  })

  test('extracts auth state correctly, and always returns a MWResponse', async () => {
    const BOB = { name: 'Bob', occupation: 'The builder' }
    const fakeMiddleware = (req: MiddlewareRequest) => {
      req.serverAuthContext.set({
        user: BOB,
      })
    }

    const [mwRes, authState] = await invoke(
      new Request('https://example.com'),
      fakeMiddleware,
    )

    expect(mwRes).toBeInstanceOf(MiddlewareResponse)
    expect(authState).toEqual({
      user: BOB,
    })
  })

  describe('throwing middleware behavior', () => {
    let consoleErrorSpy: MockInstance

    beforeAll(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterAll(() => {
      consoleErrorSpy.mockRestore()
    })

    // This means that will CONTINUE execution of the middleware chain, and react rendering
    test('returns a MiddlewareResponse, even if middleware throws', async () => {
      const throwingMiddleware = () => {
        throw new Error('I want to break free')
      }

      const [mwRes, authState] = await invoke(
        new Request('https://example.com'),
        throwingMiddleware,
      )

      expect(mwRes).toBeInstanceOf(MiddlewareResponse)
      expect(authState).toEqual(middlewareDefaultAuthProviderState)
    })

    // A short-circuit is a way to stop the middleware chain immediately, and return a response
    test('will return a MiddlewareResposne, if a short-circuit is thrown', async () => {
      const shortCircuitMW: Middleware = (_req, res) => {
        res.shortCircuit('Zap', {
          status: 999,
          statusText: 'Ouch',
        })
      }

      const [mwRes, authState] = await invoke(
        new Request('https://example.com'),
        shortCircuitMW,
      )

      expect(mwRes).toBeInstanceOf(MiddlewareResponse)
      expect(mwRes.body).toEqual('Zap')
      expect(mwRes.status).toEqual(999)
      expect(mwRes.statusText).toEqual('Ouch')
      expect(authState).toEqual(middlewareDefaultAuthProviderState)
    })
  })
})
