import { act, renderHook } from '@testing-library/react'

import { createMiddlewareAuth, createDbAuthClient } from '../dbAuth'

import { fetchMock } from './dbAuth.test'

export function getMwDbAuth(args = defaultArgs) {
  const dbAuthClient = createDbAuthClient(args)
  const { useAuth, AuthProvider } = createMiddlewareAuth(dbAuthClient, {
    useHasRole: args.useHasRole,
    useCurrentUser: args.useCurrentUser,
  })
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result
}

// These tests are on top of the other tests in dbAuth.test.ts
// They test the middleware specific things about the dbAuth client

describe('dbAuth web ~ cookie/middleware auth edition', () => {
  it('will create a middleware version of the auth client', async () => {
    const { current: dbAuthInstance } = getMwDbAuth({
      middleware: true,
    })

    // Middleware auth clients should not return tokens
    expect(await dbAuthInstance.getToken()).toBeNull()

    let currentUser
    await act(async () => {
      currentUser = await dbAuthInstance.getCurrentUser()
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      // Doesn't speak to graphql!
      '/middleware/dbauth/currentUser',
      expect.objectContaining({
        credentials: 'include',
        method: 'GET', // in mw auth, we use GET for currentUser
      }),
    )

    expect(currentUser).toEqual({
      id: 'middleware-user-555',
      username: 'user@middleware.auth',
    })
  })

  it('allows you to override the middleware endpoint', async () => {
    const auth = getMwDbAuth({
      dbAuthUrl: '/hello/handsome',
      middleware: true,
    }).current

    await act(async () => await auth.forgotPassword('username'))

    expect(fetchMock).toHaveBeenCalledWith(
      '/hello/handsome',
      expect.any(Object),
    )
  })

  it('calls login at the middleware endpoint', async () => {
    const auth = (
      await getMwDbAuth({
        middleware: true,
      })
    ).current

    await act(
      async () =>
        await auth.logIn({ username: 'username', password: 'password' }),
    )

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/middleware/dbauth',
      expect.any(Object),
    )
  })

  it('calls middleware endpoint for logout', async () => {
    const auth = getMwDbAuth({
      middleware: true,
    }).current
    await act(async () => {
      await auth.logOut()
    })

    expect(globalThis.fetch).toHaveBeenCalledWith('/middleware/dbauth', {
      body: '{"method":"logout"}',
      credentials: 'same-origin',
      method: 'POST',
    })
  })

  it('calls reset password at the correct endpoint', async () => {
    const auth = getMwDbAuth({
      middleware: true,
    }).current

    await act(
      async () =>
        await auth.resetPassword({
          resetToken: 'reset-token',
          password: 'password',
        }),
    )

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/middleware/dbauth',
      expect.objectContaining({
        body: '{"resetToken":"reset-token","password":"password","method":"resetPassword"}',
      }),
    )
  })

  it('passes through fetchOptions to signup calls', async () => {
    const auth = getMwDbAuth({
      middleware: true,
    }).current

    await act(
      async () =>
        await auth.signUp({
          username: 'username',
          password: 'password',
        }),
    )

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/middleware/dbauth',
      expect.objectContaining({
        method: 'POST',
        body: '{"username":"username","password":"password","method":"signup"}',
      }),
    )
  })
})
