import { renderHook, act } from '@testing-library/react-hooks'

import { createDbAuth } from '../dbAuth'

global.RWJS_API_DBAUTH_URL = '/.redwood/functions'

jest.mock('cross-undici-fetch', () => {
  return
})

beforeAll(() => {
  global.fetch = jest.fn().mockImplementation(async () => {
    return { text: () => '', json: () => ({}) }
  })
})

beforeEach(() => {
  global.fetch.mockClear()
})

async function getDbAuth() {
  const { useAuth, AuthProvider } = createDbAuth({
    fetchConfig: { credentials: 'include' },
  })
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result.current
}

describe('dbAuth', () => {
  it('sets a default credentials value if not included', async () => {
    const { useAuth, AuthProvider } = createDbAuth()
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    // act is okay here
    // https://egghead.io/lessons/jest-fix-the-not-wrapped-in-act-warning-when-testing-custom-hooks
    // plus, we're note rendering anything, so there is nothing to use
    // `screen.getByText()` etc with to wait for
    await act(async () => await result.current.getToken())

    expect(global.fetch).toBeCalledWith(
      `${global.RWJS_API_DBAUTH_URL}?method=getToken`,
      {
        credentials: 'same-origin',
      }
    )
  })

  it('passes through fetchOptions to forgotPassword calls', async () => {
    const auth = await getDbAuth()

    await act(async () => await auth.forgotPassword('username'))

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to getToken calls', async () => {
    const auth = await getDbAuth()

    await act(async () => await auth.getToken())

    expect(global.fetch).toBeCalledWith(
      `${global.RWJS_API_DBAUTH_URL}?method=getToken`,
      {
        credentials: 'include',
      }
    )
  })

  it('passes through fetchOptions to login calls', async () => {
    const auth = await getDbAuth()

    await act(
      async () =>
        await auth.logIn({ username: 'username', password: 'password' })
    )

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to logout calls', async () => {
    const auth = await getDbAuth()
    await act(async () => await auth.logOut())

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to resetPassword calls', async () => {
    const auth = await getDbAuth()
    await act(async () => await auth.resetPassword({}))

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to signup calls', async () => {
    const auth = await getDbAuth()
    await act(async () => await auth.signUp({}))

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to validateResetToken calls', async () => {
    const auth = await getDbAuth()
    await act(async () => await auth.validateResetToken('token'))

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })
})
