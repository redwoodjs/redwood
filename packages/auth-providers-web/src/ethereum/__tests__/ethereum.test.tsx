import { renderHook, act } from '@testing-library/react-hooks'

import { CurrentUser } from '@redwoodjs/auth'

import { createEthereumAuth, Ethereum } from '../ethereum'

type User = Record<string, any>

const user: Partial<User> = {
  address: '0x71c7656ec7ab88b098de1b751b7401b5f688user',
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
  address: '0x71c7656ec7ab88b098de1b751b7401b5f68admin',
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

const ethereumMockClient: Ethereum = {
  login: async (address: string) => {
    loggedInUser = address.endsWith('admin')
      ? (adminUser as User)
      : (user as User)

    return loggedInUser
  },
  logout: async () => {
    loggedInUser = undefined
  },
  getToken: async () => {
    return loggedInUser ? 'token' : null
  },
  getUserMetadata: async () => {
    return loggedInUser as any
  },
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

function getEthereumAuth(customProviderHooks?: {
  useCurrentUser?: () => Promise<Record<string, unknown>>
  useHasRole?: (
    currentUser: CurrentUser | null
  ) => (rolesToCheck: string | string[]) => boolean
}) {
  const { useAuth, AuthProvider } = createEthereumAuth(
    ethereumMockClient,
    customProviderHooks
  )
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result
}

describe('Ethereum', () => {
  it('is not authenticated before logging in', async () => {
    const auth = getEthereumAuth().current

    await act(async () => {
      expect(auth.isAuthenticated).toBeFalsy()
    })
  })

  it('is authenticated after logging in', async () => {
    const authRef = getEthereumAuth()

    await act(async () => {
      authRef.current.logIn('0x71c7656ec7ab88b098de1b751b7401b5f688user')
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()
  })

  it('is not authenticated after logging out', async () => {
    const authRef = getEthereumAuth()

    await act(async () => {
      authRef.current.logIn('0x71c7656ec7ab88b098de1b751b7401b5f688user')
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()

    await act(async () => {
      await authRef.current.logOut()
    })

    expect(authRef.current.isAuthenticated).toBeFalsy()
  })

  it('has role "user"', async () => {
    const authRef = getEthereumAuth()

    expect(authRef.current.hasRole('user')).toBeFalsy()

    await act(async () => {
      authRef.current.logIn('0x71c7656ec7ab88b098de1b751b7401b5f688user')
    })

    expect(authRef.current.hasRole('user')).toBeTruthy()
  })

  it('has role "admin"', async () => {
    const authRef = getEthereumAuth()

    expect(authRef.current.hasRole('admin')).toBeFalsy()

    await act(async () => {
      loggedInUser = adminUser as User
      authRef.current.logIn('0x71c7656ec7ab88b098de1b751b7401b5f68admin')
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

    const authRef = getEthereumAuth({ useHasRole })

    expect(authRef.current.hasRole('user')).toBeFalsy()

    await act(async () => {
      authRef.current.logIn('0x71c7656ec7ab88b098de1b751b7401b5f688user')
    })

    expect(authRef.current.hasRole('user')).toBeTruthy()
    expect(authRef.current.hasRole('admin')).toBeFalsy()

    await act(async () => {
      loggedInUser = adminUser as User
      authRef.current.logIn('0x71c7656ec7ab88b098de1b751b7401b5f68admin')
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

    const authRef = getEthereumAuth({ useCurrentUser })

    // Need to be logged in, otherwise getCurrentUser won't be invoked
    await act(async () => {
      authRef.current.logIn('0x71c7656ec7ab88b098de1b751b7401b5f688user')
    })

    await act(async () => {
      expect(authRef.current.hasRole('user')).toBeFalsy()
      expect(authRef.current.hasRole('custom-current-user')).toBeTruthy()
    })
  })
})
