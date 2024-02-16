import { describe, expect, test, vi } from 'vitest'

import { defaultAuthProviderState } from '@redwoodjs/auth'

import { invoke } from './invokeMiddleware'
import type { MiddlewareRequest } from './MiddlewareRequest'
import { MiddlewareResponse } from './MiddlewareResponse'

describe('Invoke middleware', () => {
  test('returns a MiddlewareResponse, even if no middleware defined', async () => {
    const [mwRes, authState] = await invoke(new Request('https://example.com'))
    expect(mwRes).toBeInstanceOf(MiddlewareResponse)
    expect(authState).toEqual(defaultAuthProviderState)
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
      fakeMiddleware
    )

    expect(mwRes).toBeInstanceOf(MiddlewareResponse)
    expect(authState).toEqual({
      user: BOB,
    })
  })

  test('returns a MiddlewareResponse, even if middleware throws', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const throwingMiddleware = () => {
      throw new Error('I want to break free')
    }

    const [mwRes, authState] = await invoke(
      new Request('https://example.com'),
      throwingMiddleware
    )

    expect(mwRes).toBeInstanceOf(MiddlewareResponse)
    expect(authState).toEqual(defaultAuthProviderState)
    consoleErrorSpy.mockRestore()
  })

  test('returns a MiddlewareResponse, even if middleware returns a Response', async () => {
    const respondingMiddleware = () =>
      new Response('See ya, Pal', { status: 302 })

    const [mwRes] = await invoke(
      new Request('https://example.com'),
      respondingMiddleware
    )

    expect(mwRes).toBeInstanceOf(MiddlewareResponse)
    expect(await mwRes.toResponse().text()).toEqual('See ya, Pal')
    expect(mwRes.isRedirect()).toEqual(true)
  })
})
