import type { SupabaseClient, User } from '@supabase/supabase-js'
import { renderHook, act } from '@testing-library/react-hooks'

import { CurrentUser } from '@redwoodjs/auth'

import { createSupabaseAuth } from '../supabase'

const user: Partial<User> = {
  id: 'unique_user_id',
  user_metadata: {
    full_name: 'John Doe',
  },
  email: 'john.doe@example.com',
  app_metadata: {
    provider: 'netlify',
    roles: ['user'],
  },
}

const adminUser: Partial<User> = {
  id: 'unique_user_id_admin',
  user_metadata: {
    full_name: 'Mr Smith',
  },
  email: 'admin@example.com',
  app_metadata: {
    provider: 'netlify',
    roles: ['user', 'admin'],
  },
}

let loggedInUser: User | undefined

const supabaseAuth: Partial<SupabaseClient['auth']> = {
  signIn: async ({ email }: { email: string }) => {
    loggedInUser =
      email === 'admin@example.com' ? (adminUser as User) : (user as User)

    return {
      user: loggedInUser,
      session: null,
      error: null,
    }
  },
  signOut: async () => {
    loggedInUser = undefined

    return { error: null }
  },
  signUp: async ({ email }: { email: string }) => {
    loggedInUser =
      email === 'admin@example.com' ? (adminUser as User) : (user as User)

    return {
      user: loggedInUser,
      session: null,
      error: null,
    }
  },
  user: () => loggedInUser || null,
  getSessionFromUrl: async () => ({ data: null, error: null }),
  session: () => ({
    access_token: 'token',
    token_type: '',
    user: loggedInUser || null,
  }),
}

const supabaseMockClient: Partial<SupabaseClient> = {
  auth: supabaseAuth as SupabaseClient['auth'],
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
      json: () => ({
        data: {
          redwood: {
            currentUser: {
              ...loggedInUser,
              roles: loggedInUser?.app_metadata?.roles,
            },
          },
        },
      }),
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

function getSupabaseAuth(customProviderHooks?: {
  useCurrentUser?: () => Promise<Record<string, unknown>>
  useHasRole?: (
    currentUser: CurrentUser | null
  ) => (rolesToCheck: string | string[]) => boolean
}) {
  const { useAuth, AuthProvider } = createSupabaseAuth(
    supabaseMockClient as SupabaseClient,
    customProviderHooks
  )
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result
}

describe('Supabase', () => {
  it('is not authenticated before logging in', async () => {
    const authRef = getSupabaseAuth()

    await act(async () => {
      expect(authRef.current.isAuthenticated).toBeFalsy()
    })
  })

  it('is authenticated after logging in', async () => {
    const authRef = getSupabaseAuth()

    await act(async () => {
      authRef.current.logIn({
        email: 'john.doe@example.com',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()
  })

  it('is not authenticated after logging out', async () => {
    const authRef = getSupabaseAuth()

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
    const authRef = getSupabaseAuth()

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
    const authRef = getSupabaseAuth()

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

    const authRef = getSupabaseAuth({ useHasRole })

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

    const authRef = getSupabaseAuth({ useCurrentUser })

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
