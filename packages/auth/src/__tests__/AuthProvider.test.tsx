require('whatwg-fetch')

import React, { useEffect, useState } from 'react'

import {
  render,
  screen,
  fireEvent,
  waitFor,
  configure,
} from '@testing-library/react'
import { renderHook, act } from '@testing-library/react-hooks'
import '@testing-library/jest-dom/extend-expect'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'

import {
  CustomTestAuthClient,
  createCustomTestAuth,
} from './fixtures/customTestAuth'

configure({
  asyncUtilTimeout: 5_000,
})

let CURRENT_USER_DATA: {
  name: string
  email: string
  roles?: string | string[]
} = {
  name: 'Peter Pistorius',
  email: 'nospam@example.net',
}

global.RWJS_API_GRAPHQL_URL = '/.netlify/functions/graphql'

const server = setupServer(
  graphql.query('__REDWOOD__AUTH_GET_CURRENT_USER', (_req, res, ctx) => {
    return res(
      ctx.data({
        redwood: {
          currentUser: CURRENT_USER_DATA,
        },
      })
    )
  })
)

const consoleError = console.error

beforeAll(() => {
  server.listen()
  console.error = () => {}
})

afterAll(() => {
  server.close()
  console.error = consoleError
})

const customTestAuth: CustomTestAuthClient = {
  login: () => true,
  signup: () => {},
  logout: () => {},
  getToken: () => 'hunter2',
  getUserMetadata: jest.fn(() => null),
  forgotPassword: () => {},
  resetPassword: () => true,
  validateResetToken: () => ({}),
}

async function getCustomTestAuth() {
  const { AuthProvider, useAuth } = createCustomTestAuth(customTestAuth)
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  return result.current
}

beforeEach(() => {
  server.resetHandlers()
  CURRENT_USER_DATA = {
    name: 'Peter Pistorius',
    email: 'nospam@example.net',
  }
  customTestAuth.getUserMetadata = jest.fn(() => null)
})

describe('Custom auth provider', () => {
  const { AuthProvider, useAuth } = createCustomTestAuth(customTestAuth)

  const AuthConsumer = () => {
    const {
      loading,
      isAuthenticated,
      logOut,
      logIn,
      getToken,
      userMetadata,
      currentUser,
      reauthenticate,
      hasError,
      hasRole,
      error,
    } = useAuth()

    const [authToken, setAuthToken] = useState<string | null>(null)

    useEffect(() => {
      const retrieveToken = async () => {
        const token = await getToken()
        setAuthToken(token)
      }
      retrieveToken()
    }, [getToken])

    if (loading) {
      return <>Loading...</>
    }

    if (hasError) {
      return <>{error?.message}</>
    }

    return (
      <>
        <button
          onClick={() => {
            isAuthenticated ? logOut() : logIn()
          }}
        >
          {isAuthenticated ? 'Log Out' : 'Log In'}
        </button>

        {isAuthenticated && (
          <>
            <p>userMetadata: {JSON.stringify(userMetadata)}</p>
            <p>authToken: {authToken}</p>
            <p>
              currentUser:{' '}
              {(currentUser && JSON.stringify(currentUser)) ||
                'no current user data'}
            </p>
            <p>Has Admin: {hasRole('admin') ? 'yes' : 'no'}</p>
            <p>Has Super User: {hasRole('superuser') ? 'yes' : 'no'}</p>
            <p>Has Admin as Array: {hasRole(['admin']) ? 'yes' : 'no'}</p>
            <p>Has Editor: {hasRole(['editor', 'publisher']) ? 'yes' : 'no'}</p>
            <p>
              Has Editor or Author:{' '}
              {hasRole(['editor', 'author']) ? 'yes' : 'no'}
            </p>

            <button onClick={() => reauthenticate()}>Update auth data</button>
          </>
        )}
      </>
    )
  }

  /**
   * A logged out user can login, view their personal account information and logout.
   */
  test('Authentication flow (logged out -> login -> logged in -> logout) works as expected', async () => {
    const mockAuthClient = customTestAuth

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))
    expect(mockAuthClient.getUserMetadata).toBeCalledTimes(1)

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))
    expect(mockAuthClient.getUserMetadata).toBeCalledTimes(1)
    expect(
      screen.getByText(
        'userMetadata: {"sub":"abcdefg|123456","username":"peterp"}'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'currentUser: {"name":"Peter Pistorius","email":"nospam@example.net"}'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('authToken: hunter2')).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  test('Fetching the current user can be skipped', async () => {
    const mockAuthClient = customTestAuth

    render(
      <AuthProvider skipFetchCurrentUser>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))
    expect(mockAuthClient.getUserMetadata).toBeCalledTimes(1)

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))
    expect(mockAuthClient.getUserMetadata).toBeCalledTimes(1)
    expect(screen.getByText(/no current user data/)).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  /**
   * This is especially helpful if you want to update the currentUser state.
   */
  test('A user can be re-authenticated to update the "auth state"', async () => {
    const mockAuthClient = customTestAuth

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))
    expect(mockAuthClient.getUserMetadata).toBeCalledTimes(1)

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))
    expect(mockAuthClient.getUserMetadata).toBeCalledTimes(1)

    // The original current user data is fetched.
    expect(
      screen.getByText(
        'currentUser: {"name":"Peter Pistorius","email":"nospam@example.net"}'
      )
    ).toBeInTheDocument()

    CURRENT_USER_DATA = { ...CURRENT_USER_DATA, name: 'Rambo' }
    fireEvent.click(screen.getByText('Update auth data'))

    await waitFor(() =>
      screen.getByText(
        'currentUser: {"name":"Rambo","email":"nospam@example.net"}'
      )
    )
  })

  test('When the current user cannot be fetched the user is not authenticated', async () => {
    server.use(
      graphql.query('__REDWOOD__AUTH_GET_CURRENT_USER', (_req, res, ctx) => {
        return res(ctx.status(404))
      })
    )

    const mockAuthClient = customTestAuth
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() =>
      screen.getByText('Could not fetch current user: Not Found (404)')
    )
  })

  /**
   * Check assigned role access
   */
  test('Authenticated user has assigned role access as expected', async () => {
    const mockAuthClient = customTestAuth

    CURRENT_USER_DATA = {
      name: 'Peter Pistorius',
      email: 'nospam@example.net',
      roles: ['janitor'],
    }

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))

    expect(screen.queryByText('Has Admin:')).not.toBeInTheDocument()
    expect(screen.queryByText('Has Super User:')).not.toBeInTheDocument()

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))

    expect(screen.getByText('Has Admin: no')).toBeInTheDocument()
    expect(screen.getByText('Has Super User: no')).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  /**
   * Check unassigned role access
   */
  test('Authenticated user has not been assigned role access as expected', async () => {
    const mockAuthClient = customTestAuth

    CURRENT_USER_DATA = {
      name: 'Peter Pistorius',
      email: 'nospam@example.net',
      roles: ['admin', 'superuser'],
    }

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))

    expect(screen.queryByText('Has Admin:')).not.toBeInTheDocument()
    expect(screen.queryByText('Has Super User:')).not.toBeInTheDocument()

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))

    expect(screen.getByText('Has Admin: yes')).toBeInTheDocument()
    expect(screen.getByText('Has Super User: yes')).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  /**
   * Check some unassigned role access
   */
  test('Authenticated user has not been assigned some role access but not others as expected', async () => {
    const mockAuthClient = customTestAuth

    CURRENT_USER_DATA = {
      name: 'Peter Pistorius',
      email: 'nospam@example.net',
      roles: ['admin'],
    }

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))

    expect(screen.queryByText('Has Admin:')).not.toBeInTheDocument()
    expect(screen.queryByText('Has Super User:')).not.toBeInTheDocument()

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))

    expect(screen.getByText('Has Admin: yes')).toBeInTheDocument()
    expect(screen.getByText('Has Super User: no')).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  /**
   * Check assigned role access when specified as single array element
   */
  test('Authenticated user has assigned role access as expected', async () => {
    const mockAuthClient = customTestAuth

    CURRENT_USER_DATA = {
      name: 'Peter Pistorius',
      email: 'nospam@example.net',
      roles: ['admin'],
    }

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))

    expect(screen.queryByText('Has Admin:')).not.toBeInTheDocument()
    expect(screen.queryByText('Has Super User:')).not.toBeInTheDocument()

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))

    expect(screen.getByText('Has Admin as Array: yes')).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  /**
   * Check assigned role access when specified as array element
   */
  test('Authenticated user has assigned role access as expected', async () => {
    const mockAuthClient = customTestAuth

    CURRENT_USER_DATA = {
      name: 'Peter Pistorius',
      email: 'nospam@example.net',
      roles: ['admin'],
    }

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))

    expect(screen.queryByText('Has Admin:')).not.toBeInTheDocument()
    expect(screen.queryByText('Has Super User:')).not.toBeInTheDocument()

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))

    expect(screen.getByText('Has Admin as Array: yes')).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  test('Checks roles successfully when roles in currentUser is a string', async () => {
    const mockAuthClient = customTestAuth

    CURRENT_USER_DATA = {
      name: 'Peter Pistorius',
      email: 'nospam@example.net',
      roles: 'admin',
    }

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))

    expect(screen.queryByText('Has Admin:')).not.toBeInTheDocument()
    expect(screen.queryByText('Has Super User:')).not.toBeInTheDocument()

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))

    expect(screen.getByText('Has Admin: yes')).toBeInTheDocument()
    expect(screen.getByText('Has Admin as Array: yes')).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  /**
   * Check if assigned one of the roles in an array
   */
  test('Authenticated user has assigned role access as expected', async () => {
    const mockAuthClient = customTestAuth

    CURRENT_USER_DATA = {
      name: 'Peter Pistorius',
      email: 'nospam@example.net',
      roles: ['editor'],
    }

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))

    expect(screen.queryByText('Has Admin:')).not.toBeInTheDocument()
    expect(screen.queryByText('Has Super User:')).not.toBeInTheDocument()

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))

    expect(screen.getByText('Has Editor: yes')).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  /**
   * Check if not assigned any of the roles in an array
   */
  test('Authenticated user has assigned role access as expected', async () => {
    const mockAuthClient = customTestAuth

    CURRENT_USER_DATA = {
      name: 'Peter Pistorius',
      email: 'nospam@example.net',
      roles: ['admin'],
    }

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    // We're booting up!
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // The user is not authenticated
    await waitFor(() => screen.getByText('Log In'))

    expect(screen.queryByText('Has Admin:')).not.toBeInTheDocument()
    expect(screen.queryByText('Has Super User:')).not.toBeInTheDocument()

    // Replace "getUserMetadata" with actual data, and login!
    mockAuthClient.getUserMetadata = jest.fn(() => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    })
    fireEvent.click(screen.getByText('Log In'))

    // Check that you're logged in!
    await waitFor(() => screen.getByText('Log Out'))

    expect(screen.getByText('Has Admin: yes')).toBeInTheDocument()
    expect(screen.getByText('Has Editor: no')).toBeInTheDocument()
    expect(screen.getByText('Has Editor or Author: no')).toBeInTheDocument()

    // Log out
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => screen.getByText('Log In'))
  })

  test('proxies forgotPassword() calls to client', async () => {
    const mockedForgotPassword = jest.spyOn(customTestAuth, 'forgotPassword')
    mockedForgotPassword.mockImplementation((username: string) => {
      expect(username).toEqual('username')
    })

    const TestAuthConsumer = () => {
      const { loading, forgotPassword } = useAuth()

      useEffect(() => {
        if (!loading) {
          forgotPassword('username')
        }
      }, [loading, forgotPassword])

      return null
    }

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => mockedForgotPassword.mock.calls.length === 1)

    expect.assertions(1)
  })

  test('proxies resetPassword() calls to client', async () => {
    customTestAuth.resetPassword = (password: string) => {
      expect(password).toEqual('password')

      return true
    }

    const auth = await getCustomTestAuth()

    // act is generally frowned upon in test cases. But it's okay here, see
    // https://egghead.io/lessons/jest-fix-the-not-wrapped-in-act-warning-when-testing-custom-hooks
    // plus, we're note rendering anything, so there is nothing to use
    // `screen.getByText()` etc with to wait for
    await act(async () => {
      await auth.resetPassword('password')
    })

    expect.assertions(1)
  })

  test('proxies validateResetToken() calls to client', async () => {
    customTestAuth.validateResetToken = (resetToken: string | null) => {
      expect(resetToken).toEqual('12345')

      return {}
    }

    const auth = await getCustomTestAuth()

    await act(async () => {
      await auth.validateResetToken('12345')
    })

    expect.assertions(1)
  })

  test("getToken doesn't fail if client throws an error", async () => {
    customTestAuth.getToken = jest.fn(() => {
      throw 'Login Required'
    })

    const auth = await getCustomTestAuth()

    await act(async () => {
      await auth.getToken()
    })

    expect(customTestAuth.getToken).toBeCalledTimes(1)
  })
})
