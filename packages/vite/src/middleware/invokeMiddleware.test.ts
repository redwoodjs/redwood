import type { MockInstance } from 'vitest'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import { middlewareDefaultAuthProviderState } from '@redwoodjs/auth'

import { createServerStorage } from '../serverStore'

import { invoke } from './invokeMiddleware'
import type { MiddlewareRequest } from './MiddlewareRequest'
import { MiddlewareResponse } from './MiddlewareResponse'

describe('Invoke middleware', () => {
  beforeAll(() => {
    createServerStorage()
  })

  test('returns a MiddlewareResponse, even if no middleware defined', async () => {
    const [mwRes, authState] = await invoke(new Request('https://example.com'))
    expect(mwRes).toBeInstanceOf(MiddlewareResponse)
    expect(authState).toEqual(middlewareDefaultAuthProviderState)
  })

  test('extracts auth state correctly, and always returns a MWResponse', async () => {
    const BOB = { name: 'Bob', occupation: 'The builder' }
    const fakeMiddleware = (req: MiddlewareRequest) => {
      req.serverAuthState.set({
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
  })
})
