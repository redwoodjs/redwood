import { renderHook, act } from '@testing-library/react-hooks'
import { Magic, MagicUserMetadata } from 'magic-sdk'

import { CurrentUser } from '@redwoodjs/auth'

import { createMagicLinkAuth } from '../magicLink'

const user: MagicUserMetadata = {
  issuer: 'unique_user_id',
  email: 'john.doe@example.com',
  publicAddress: null,
  phoneNumber: null,
}

const adminUser: MagicUserMetadata = {
  issuer: 'unique_user_id_admin',
  email: 'admin@example.com',
  publicAddress: null,
  phoneNumber: null,
}

let loggedInUser: MagicUserMetadata | undefined

interface LogInSignUpOptions {
  email: string
  showUI?: boolean
}

type PromiEvent = any

const magicAuth: Partial<Magic['auth']> = {
  loginWithMagicLink: (async ({ email }: LogInSignUpOptions) => {
    if (email.startsWith('admin')) {
      loggedInUser = adminUser
    } else {
      loggedInUser = user
    }

    return loggedInUser.issuer
  }) as () => PromiEvent,
}

const magicUser: Partial<Magic['user']> = {
  isLoggedIn: (async () => !!loggedInUser) as PromiEvent,
  getMetadata: () =>
    new Promise<MagicUserMetadata>((resolve, reject) => {
      if (loggedInUser) {
        resolve(loggedInUser)
      }

      reject('No user logged in')
    }) as PromiEvent,
  getIdToken: (async () => 'token') as () => PromiEvent,
  logout: (async () => {
    loggedInUser = undefined
    return true
  }) as () => PromiEvent,
}

const magicLinkMockClient: Partial<Magic> = {
  auth: magicAuth as Magic['auth'],
  user: magicUser as Magic['user'],
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

function getMagicLinkAuth(customProviderHooks?: {
  useCurrentUser?: () => Promise<Record<string, unknown>>
  useHasRole?: (
    currentUser: CurrentUser | null
  ) => (rolesToCheck: string | string[]) => boolean
}) {
  const { useAuth, AuthProvider } = createMagicLinkAuth(
    magicLinkMockClient as Magic,
    customProviderHooks
  )
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result
}

describe('magicLinkAuth', () => {
  it('is not authenticated before logging in', async () => {
    const authRef = getMagicLinkAuth()

    await act(async () => {
      expect(authRef.current.isAuthenticated).toBeFalsy()
    })
  })

  it('is authenticated after logging in', async () => {
    const authRef = getMagicLinkAuth()

    await act(async () => {
      authRef.current.logIn({ email: 'john.doe@example.com' })
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()
  })

  it('is not authenticated after logging out', async () => {
    const authRef = getMagicLinkAuth()

    await act(async () => {
      authRef.current.logIn({ email: 'john.doe@example.com' })
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()

    await act(async () => {
      authRef.current.logOut()
    })

    expect(authRef.current.isAuthenticated).toBeFalsy()
  })

  // magicLink doesn't store role metadata for users, but we still want to
  // make sure it provides a reasonable default return value
  it('returns false for hasRole()', async () => {
    const authRef = getMagicLinkAuth()

    expect(authRef.current.hasRole('user')).toBeFalsy()

    await act(async () => {
      authRef.current.logIn({ email: 'john.doe@example.com' })
    })

    expect(authRef.current.isAuthenticated).toBeTruthy()
    expect(authRef.current.hasRole('user')).toBeFalsy()
  })

  // magicLink doesn't have support for roles
  it.skip('has role "admin"', async () => {
    const authRef = getMagicLinkAuth()

    expect(authRef.current.hasRole('admin')).toBeFalsy()

    await act(async () => {
      authRef.current.logIn({ email: 'admin@example.com' })
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

    const authRef = getMagicLinkAuth({ useHasRole })

    expect(authRef.current.hasRole('user')).toBeFalsy()

    await act(async () => {
      authRef.current.logIn({ email: 'john.doe@example.com' })
    })

    expect(authRef.current.hasRole('user')).toBeTruthy()
    expect(authRef.current.hasRole('admin')).toBeFalsy()

    await act(async () => {
      authRef.current.logIn({ email: 'admin@example.com' })
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

    const authRef = getMagicLinkAuth({ useCurrentUser })

    // Need to be logged in, otherwise getCurrentUser won't be invoked
    await act(async () => {
      authRef.current.logIn({ email: 'john.doe@example.com' })
    })

    await act(async () => {
      expect(authRef.current.hasRole('user')).toBeFalsy()
      expect(authRef.current.hasRole('custom-current-user')).toBeTruthy()
    })
  })
})
