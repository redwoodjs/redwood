import { renderHook, act } from '@testing-library/react-hooks'

import { createDbAuth } from '../dbAuth'

global.RWJS_API_DBAUTH_URL = '/.redwood/functions'
global.RWJS_API_GRAPHQL_URL = '/.redwood/functions/graphql'

jest.mock('cross-undici-fetch', () => {
  return
})

let loggedInUser: { username: string } | undefined

const fetchMock = jest.fn()
fetchMock.mockImplementation(async (url, options) => {
  const body = options?.body ? JSON.parse(options.body) : {}

  if (url?.includes('method=getToken')) {
    return {
      ok: true,
      text: () => (loggedInUser ? 'token' : ''),
      json: () => ({}),
    }
  }

  if (body.method === 'login') {
    loggedInUser = { username: body.username }

    return {
      ok: true,
      text: () => '',
      json: () => ({ username: body.username }),
    }
  }

  if (body.method === 'logout') {
    loggedInUser = undefined

    return {
      ok: true,
      text: () => '',
      json: () => ({}),
    }
  }

  if (
    body.query ===
    'query __REDWOOD__AUTH_GET_CURRENT_USER { redwood { currentUser } }'
  ) {
    return {
      ok: true,
      text: () => '',
      json: () => ({ data: { redwood: { currentUser: loggedInUser } } }),
    }
  }

  return { ok: true, text: () => '', json: () => ({}) }
})

beforeAll(() => {
  global.fetch = fetchMock
})

beforeEach(() => {
  fetchMock.mockClear()
  loggedInUser = undefined
})

function getDbAuth() {
  const { useAuth, AuthProvider } = createDbAuth(undefined, {
    fetchConfig: { credentials: 'include' },
  })
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result
}

describe('dbAuth', () => {
  it('sets a default credentials value if not included', async () => {
    const { useAuth, AuthProvider } = createDbAuth()
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    // act is okay here
    // https://egghead.io/lessons/jest-fix-the-not-wrapped-in-act-warning-when-testing-custom-hooks
    // plus, we're note rendering anything, so there is nothing to use
    // `screen.getByText()` etc with to wait for
    await act(async () => {
      await result.current.getToken()
    })

    expect(global.fetch).toBeCalledWith(
      `${global.RWJS_API_DBAUTH_URL}?method=getToken`,
      {
        credentials: 'same-origin',
      }
    )
  })

  it('passes through fetchOptions to forgotPassword calls', async () => {
    const auth = getDbAuth().current

    await act(async () => await auth.forgotPassword('username'))

    expect(fetchMock).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to getToken calls', async () => {
    const auth = getDbAuth().current

    await act(async () => {
      await auth.getToken()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    expect(fetchMock).toBeCalledWith(
      `${global.RWJS_API_DBAUTH_URL}?method=getToken`,
      {
        credentials: 'include',
      }
    )
  })

  it('passes through fetchOptions to login calls', async () => {
    const auth = (await getDbAuth()).current

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
    const auth = getDbAuth().current
    await act(async () => {
      await auth.logOut()
    })

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to resetPassword calls', async () => {
    const auth = getDbAuth().current
    await act(async () => await auth.resetPassword({}))

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to signup calls', async () => {
    const auth = getDbAuth().current
    await act(async () => await auth.signUp({}))

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to validateResetToken calls', async () => {
    const auth = getDbAuth().current
    await act(async () => await auth.validateResetToken('token'))

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('is not authenticated before logging in', async () => {
    const auth = getDbAuth().current

    await act(async () => {
      expect(auth.isAuthenticated).toBeFalsy()
    })
  })

  it('is authenticated after logging in', async () => {
    const authRef = getDbAuth()

    await act(async () => {
      authRef.current.logIn({
        username: 'auth-test',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()
  })

  it('is not authenticated after logging out', async () => {
    const authRef = getDbAuth()

    await act(async () => {
      authRef.current.logIn({
        username: 'auth-test',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()

    await act(async () => {
      authRef.current.logOut({
        username: 'auth-test',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.isAuthenticated).toBeFalsy()
  })
})
