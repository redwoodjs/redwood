require('whatwg-fetch')

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { setupServer } from 'msw/node'
import { graphql } from 'msw'

import { useAuth } from '../useAuth'
import { AuthProvider } from '../AuthProvider'
import type { AuthClient } from '../authClients'

let CURRENT_USER_DATA = {
  name: 'Peter Pistorius',
  email: 'nospam@example.net',
}

window.__REDWOOD__API_PROXY_PATH = '/.netlify/functions'
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
beforeAll(() => server.listen())
afterAll(() => server.close())

beforeEach(() => {
  server.resetHandlers()
  CURRENT_USER_DATA = {
    name: 'Peter Pistorius',
    email: 'nospam@example.net',
  }
})

const AuthConsumer = () => {
  const {
    loading,
    isAuthenticated,
    logOut,
    logIn,
    userMetadata,
    currentUser,
    reauthenticate,
    hasError,
    error,
  } = useAuth()

  if (loading) {
    return <>Loading...</>
  }

  if (hasError) {
    return <>{error.message}</>
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
          <p>
            currentUser:{' '}
            {(currentUser && JSON.stringify(currentUser)) ||
              'no current user data'}
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
test('Authentication flow (logged out -> login -> logged in -> logout) works as expected', async (done) => {
  const mockAuthClient: AuthClient = {
    login: async () => {
      return true
    },
    logout: async () => {},
    getToken: async () => 'hunter2',
    getUserMetadata: jest.fn(async () => {
      return null
    }),
    client: () => {},
    type: 'custom',
  }

  render(
    <AuthProvider client={mockAuthClient} type="custom">
      <AuthConsumer />
    </AuthProvider>
  )

  // We're booting up!
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  // The user is not authenticated
  await waitFor(() => screen.getByText('Log In'))
  expect(mockAuthClient.getUserMetadata).toBeCalledTimes(1)

  // Replace "getUserMetadata" with actual data, and login!
  mockAuthClient.getUserMetadata = jest.fn(async () => {
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

  // Log out
  fireEvent.click(screen.getByText('Log Out'))
  await waitFor(() => screen.getByText('Log In'))

  done()
})

test('Fetching the current user can be skipped', async (done) => {
  const mockAuthClient: AuthClient = {
    login: async () => {
      return true
    },
    logout: async () => {},
    getToken: async () => 'hunter2',
    getUserMetadata: jest.fn(async () => {
      return null
    }),
    client: () => {},
    type: 'custom',
  }
  render(
    <AuthProvider client={mockAuthClient} type="custom" skipFetchCurrentUser>
      <AuthConsumer />
    </AuthProvider>
  )

  // We're booting up!
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  // The user is not authenticated
  await waitFor(() => screen.getByText('Log In'))
  expect(mockAuthClient.getUserMetadata).toBeCalledTimes(1)

  // Replace "getUserMetadata" with actual data, and login!
  mockAuthClient.getUserMetadata = jest.fn(async () => {
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
  done()
})

/**
 * This is especially helpful if you want to update the currentUser state.
 */
test('A user can be reauthenticated to update the "auth state"', async (done) => {
  const mockAuthClient: AuthClient = {
    login: async () => {
      return true
    },
    logout: async () => {},
    getToken: async () => 'hunter2',
    getUserMetadata: jest.fn(async () => {
      return null
    }),
    client: () => {},
    type: 'custom',
  }
  render(
    <AuthProvider client={mockAuthClient} type="custom">
      <AuthConsumer />
    </AuthProvider>
  )

  // The user is not authenticated
  await waitFor(() => screen.getByText('Log In'))
  expect(mockAuthClient.getUserMetadata).toBeCalledTimes(1)

  // Replace "getUserMetadata" with actual data, and login!
  mockAuthClient.getUserMetadata = jest.fn(async () => {
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

  done()
})

test('When the current user cannot be fetched the user is not authenticated', async (done) => {
  server.use(
    graphql.query('__REDWOOD__AUTH_GET_CURRENT_USER', (_req, res, ctx) => {
      return res(ctx.status(404))
    })
  )

  const mockAuthClient: AuthClient = {
    login: async () => {
      return true
    },
    logout: async () => {},
    getToken: async () => 'hunter2',
    getUserMetadata: jest.fn(async () => {
      return {
        sub: 'abcdefg|123456',
        username: 'peterp',
      }
    }),
    client: () => {},
    type: 'custom',
  }
  render(
    <AuthProvider client={mockAuthClient} type="custom">
      <AuthConsumer />
    </AuthProvider>
  )

  // We're booting up!
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  await waitFor(() =>
    screen.getByText('Could not fetch current user: Not Found (404)')
  )

  done()
})
