import type { User } from '@nhost/hasura-auth-js'
import type { NhostClient } from '@nhost/nhost-js'
import { renderHook, act } from '@testing-library/react-hooks'

import { CurrentUser } from '@redwoodjs/auth'

import { createNhostAuth } from '../nhost'

const user: Partial<User> = {
  id: 'unique_user_id',
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  roles: ['user'],
}

const adminUser: Partial<User> = {
  id: 'unique_user_id_admin',
  displayName: 'Mr Smith',
  email: 'admin@example.com',
  roles: ['user', 'admin'],
}

let loggedInUser: User | undefined

const nhostAuth: Partial<NhostClient['auth']> = {
  signIn: async (options: { email: string }) => {
    loggedInUser =
      options.email === 'admin@example.com'
        ? (adminUser as User)
        : (user as User)

    return {
      ...loggedInUser,
      mfa: null,
      session: null,
      error: null,
    }
  },
  signUp: async (options: { email: string }) => {
    loggedInUser =
      options.email === 'admin@example.com'
        ? (adminUser as User)
        : (user as User)

    return {
      ...loggedInUser,
      mfa: null,
      session: null,
      error: null,
    }
  },
  signOut: async () => {
    loggedInUser = undefined
    return {
      error: null,
    }
  },
  getJWTToken: () => 'token',
  getUser: () => {
    return loggedInUser as User
  },
  refreshSession: async () => ({ session: null, error: null }),
}

const nhostMockClient: Partial<NhostClient> = {
  auth: nhostAuth as NhostClient['auth'],
}

const fetchMock = jest.fn()
fetchMock.mockImplementation(async (_url, options) => {
  const body = options?.body ? JSON.parse(options.body) : {}

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

function getNhostAuth(customProviderHooks?: {
  useCurrentUser?: () => Promise<Record<string, unknown>>
  useHasRole?: (
    currentUser: CurrentUser | null
  ) => (rolesToCheck: string | string[]) => boolean
}) {
  const { useAuth, AuthProvider } = createNhostAuth(
    nhostMockClient as NhostClient,
    customProviderHooks
  )
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result
}

describe('NHost', () => {
  it('is not authenticated before logging in', async () => {
    const authRef = getNhostAuth()

    await act(async () => {
      expect(authRef.current.isAuthenticated).toBeFalsy()
    })
  })

  it('is authenticated after logging in', async () => {
    const authRef = getNhostAuth()

    await act(async () => {
      authRef.current.logIn({
        email: 'john.doe@example.com',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()
  })

  it('is not authenticated after logging out', async () => {
    const authRef = getNhostAuth()

    await act(async () => {
      authRef.current.logIn({
        email: 'john.doe@example.com',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()

    await act(async () => {
      await authRef.current.logOut()
    })

    expect(authRef.current.isAuthenticated).toBeFalsy()
  })

  it('has role "user"', async () => {
    const authRef = getNhostAuth()

    expect(authRef.current.hasRole('user')).toBeFalsy()

    await act(async () => {
      authRef.current.logIn({
        email: 'john.doe@example.com',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.hasRole('user')).toBeTruthy()
  })

  it('has role "admin"', async () => {
    const authRef = getNhostAuth()

    expect(authRef.current.hasRole('admin')).toBeFalsy()

    await act(async () => {
      loggedInUser = adminUser as User
      authRef.current.logIn({
        email: 'admin@example.com',
        password: 'RedPill',
      })
    })

    expect(authRef.current.hasRole('admin')).toBeTruthy()
  })

  it('can specify custom hasRole function', async () => {
    function useHasRole(currentUser: CurrentUser | null) {
      return (rolesToCheck: string | string[]) => {
        if (!currentUser || typeof rolesToCheck !== 'string') {
          return false
        }

        if (rolesToCheck === 'user') {
          // Everyone has role "user"
          return true
        }

        // For the admin role we check their email address
        if (
          rolesToCheck === 'admin' &&
          currentUser.email === 'admin@example.com'
        ) {
          return true
        }

        return false
      }
    }

    const authRef = getNhostAuth({ useHasRole })

    expect(authRef.current.hasRole('user')).toBeFalsy()

    await act(async () => {
      authRef.current.logIn({
        email: 'john.doe@example.com',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.hasRole('user')).toBeTruthy()
    expect(authRef.current.hasRole('admin')).toBeFalsy()

    await act(async () => {
      loggedInUser = adminUser as User
      authRef.current.logIn({
        email: 'admin@example.com',
        password: 'RedPill',
      })
    })

    expect(authRef.current.hasRole('user')).toBeTruthy()
    expect(authRef.current.hasRole('admin')).toBeTruthy()
  })

  it('can specify custom getCurrentUser function', async () => {
    async function useCurrentUser() {
      return {
        ...loggedInUser,
        roles: ['custom-current-user'],
      }
    }

    const authRef = getNhostAuth({ useCurrentUser })

    // Need to be logged in, otherwise getCurrentUser won't be invoked
    await act(async () => {
      authRef.current.logIn({
        email: 'john.doe@example.com',
        password: 'ThereIsNoSpoon',
      })
    })

    await act(async () => {
      expect(authRef.current.hasRole('user')).toBeFalsy()
      expect(authRef.current.hasRole('custom-current-user')).toBeTruthy()
    })
  })
})
