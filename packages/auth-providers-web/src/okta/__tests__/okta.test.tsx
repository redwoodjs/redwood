import {
  OktaAuth,
  SigninWithRedirectOptions,
  UserClaims,
  CustomUserClaims,
  TokenAPI,
  TokenManager,
  AuthStateManager,
} from '@okta/okta-auth-js'
import { renderHook, act } from '@testing-library/react-hooks'

import { CurrentUser } from '@redwoodjs/auth'

import { createOktaAuth } from '../okta'

const user: Partial<UserClaims> = {
  sub: 'unique_user_id',
  name: 'John Doe',
  email: 'john.doe@example.com',
}

const adminUser: Partial<UserClaims> = {
  sub: 'unique_user_id_admin',
  name: 'Mr Smith',
  email: 'admin@example.com',
}

let loggedInUser: UserClaims | undefined

const isLoginWithEmail = (
  options: SigninWithRedirectOptions | { email: string } | undefined
): options is { email: string } => {
  return !!options && !!(options as { email: string }).email
}

const oktaToken: Partial<TokenAPI> = {
  getUserInfo: <S extends CustomUserClaims>() => {
    return new Promise<UserClaims<S>>((resolve, reject) => {
      if (loggedInUser) {
        resolve(loggedInUser as UserClaims<S>)
      } else {
        reject('Not logged in')
      }
    })
  },
}

const oktaTokenManager: Partial<TokenManager> = {
  get: async () => {
    return { res: { accessToken: 'token' } }
  },
}

const oktaAuthStateManager: Partial<AuthStateManager> = {
  getPreviousAuthState: () => null,
}

const oktaMockClient: Partial<OktaAuth> = {
  signInWithRedirect: async (options?: SigninWithRedirectOptions) => {
    if (isLoginWithEmail(options)) {
      loggedInUser =
        options.email === 'admin@example.com'
          ? (adminUser as UserClaims<CustomUserClaims>)
          : (user as UserClaims<CustomUserClaims>)
    }
  },
  signOut: async () => {
    loggedInUser = undefined
  },
  isLoginRedirect: () => false,
  isAuthenticated: async () => !!loggedInUser,
  token: oktaToken as TokenAPI,
  tokenManager: oktaTokenManager as TokenManager,
  authStateManager: oktaAuthStateManager as AuthStateManager,
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

function getOktaAuth(customProviderHooks?: {
  useCurrentUser?: () => Promise<Record<string, unknown>>
  useHasRole?: (
    currentUser: CurrentUser | null
  ) => (rolesToCheck: string | string[]) => boolean
}) {
  const { useAuth, AuthProvider } = createOktaAuth(
    oktaMockClient as OktaAuth,
    customProviderHooks
  )
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result
}

describe('Okta', () => {
  it('is not authenticated before logging in', async () => {
    const auth = getOktaAuth().current

    await act(async () => {
      expect(auth.isAuthenticated).toBeFalsy()
    })
  })

  it('is authenticated after logging in', async () => {
    const authRef = getOktaAuth()

    await act(async () => {
      authRef.current.logIn({
        email: 'john.doe@example.com',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()
  })

  it('is not authenticated after logging out', async () => {
    const authRef = getOktaAuth()

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

  it.skip('has role "user"', async () => {
    const authRef = getOktaAuth()

    expect(authRef.current.hasRole('user')).toBeFalsy()

    await act(async () => {
      authRef.current.logIn({
        email: 'john.doe@example.com',
        password: 'ThereIsNoSpoon',
      })
    })

    expect(authRef.current.hasRole('user')).toBeTruthy()
  })

  it.skip('has role "admin"', async () => {
    const authRef = getOktaAuth()

    expect(authRef.current.hasRole('admin')).toBeFalsy()

    await act(async () => {
      loggedInUser = adminUser as UserClaims
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

    const authRef = getOktaAuth({ useHasRole })

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
      loggedInUser = adminUser as UserClaims
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

    const authRef = getOktaAuth({ useCurrentUser })

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
