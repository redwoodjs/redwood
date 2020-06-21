require('whatwg-fetch')

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { setupServer } from 'msw/node'
import { graphql } from 'msw'

import type { AuthClient } from './authClients'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

window.__REDWOOD__API_PROXY_PATH = '/.netlify/functions'
const server = setupServer(
  graphql.query('__REDWOOD__AUTH_GET_CURRENT_USER', (_req, res, ctx) => {
    return res(
      ctx.data({
        redwood: {
          currentUser: {
            name: 'Peter Pistorius',
            email: 'nospam@example.net',
          },
        },
      })
    )
  })
)
beforeAll(() => server.listen())
afterAll(() => server.close())

const AuthConsumer = () => {
  const {
    loading,
    isAuthenticated,
    logOut,
    logIn,
    userMetadata,
    currentUser,
  } = useAuth()

  if (loading) {
    return <>Loading...</>
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
          <p>currentUser: {JSON.stringify(currentUser)}</p>
        </>
      )}
    </>
  )
}

/**
 * A logged out user can login, view their personal account information and logout.
 */
test('Authentication flow (logged out -> login -> logged in -> logout) works as expected', async () => {
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
})

test('Fetching the current user can be skipped', async () => {
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
  expect(
    screen.getByText(
      'userMetadata: {"sub":"abcdefg|123456","username":"peterp"}'
    )
  ).toBeInTheDocument()
  expect(screen.getByText('currentUser:')).toBeInTheDocument()

  // Log out
  fireEvent.click(screen.getByText('Log Out'))
  await waitFor(() => screen.getByText('Log In'))
})
