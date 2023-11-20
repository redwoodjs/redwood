import type {
  AuthenticationInfo,
  IAuthClient,
  User,
} from '@propelauth/javascript'
import { renderHook, act } from '@testing-library/react'

import { createAuth } from '../propelauth'

const mockUser: User = {
  userId: 'mock_user_id',
  email: 'mock@email.com',
  emailConfirmed: true,
  hasPassword: true,
  locked: false,
  enabled: true,
  mfaEnabled: false,
  createdAt: new Date().getTime(),
  lastActiveAt: new Date().getTime(),
}

const mockAuthenticationInfo: Partial<AuthenticationInfo> = {
  accessToken: 'mock_access_token',
  orgIdToOrgMemberInfo: {
    mock_org_id: {
      orgId: 'mock_org_id',
      orgName: 'Mock Org Name',
      urlSafeOrgName: 'mock_org_name',
      userAssignedRole: 'Admin',
      userInheritedRolesPlusCurrentRole: ['Admin', 'Member'],
      userPermissions: ['org:read', 'org:write'],
    },
  },
  user: mockUser,
}

let loggedInUser: User | undefined

const mockPropelauthClient: Partial<IAuthClient> = {
  redirectToLoginPage: async () => {
    loggedInUser = mockUser
    return null
  },
  redirectToSignupPage: async () => {
    loggedInUser = mockUser
  },
  logout: async () => {
    loggedInUser = undefined
  },
  getAuthenticationInfoOrNull: async () => {
    return mockAuthenticationInfo as AuthenticationInfo
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
            },
          },
        },
      }),
    }
  }

  return { ok: true, text: () => '', json: () => ({}) }
})

beforeAll(() => {
  globalThis.fetch = fetchMock
})

beforeEach(() => {
  fetchMock.mockClear()
  loggedInUser = undefined
})

function getPropelauthAuth() {
  const { useAuth, AuthProvider } = createAuth(
    mockPropelauthClient as IAuthClient
  )
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result
}

describe('PropelAuth Authentication', () => {
  it('is not authenticated before logging in', async () => {
    const authRef = getPropelauthAuth()

    await act(async () => {
      expect(authRef.current.isAuthenticated).toBeFalsy()
    })
  })

  it('is authenticated after logging in', async () => {
    const authRef = getPropelauthAuth()

    await act(async () => {
      authRef.current.logIn()
    })

    const currentUser = authRef.current.currentUser

    expect(authRef.current.isAuthenticated).toBeTruthy()
    expect(currentUser?.email).toEqual('mock@example.com')
  })

  it('is not authenticated after logging out', async () => {
    const authRef = getPropelauthAuth()

    await act(async () => {
      authRef.current.logIn()
    })

    await act(async () => {
      authRef.current.logOut()
    })

    expect(authRef.current.isAuthenticated).toBeFalsy()
  })
  it('is authenticated after signing up', async () => {
    const authRef = getPropelauthAuth()

    await act(async () => {
      authRef.current.signUp()
    })

    const currentUser = authRef.current.currentUser

    expect(authRef.current.isAuthenticated).toBeTruthy()
    expect(currentUser?.email).toEqual('mock@email.com')
  })
})
