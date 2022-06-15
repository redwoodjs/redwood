/**
 * NOTE: This module should not contain any nodejs functionality,
 * because it's also used by Storybook in the browser.
 */
import React, { PropsWithChildren } from 'react'

import type { AuthContextInterface } from '@redwoodjs/auth'
import { AuthProvider } from '@redwoodjs/auth'
import { AuthClient } from '@redwoodjs/auth/src/authClients'
import { LocationProvider } from '@redwoodjs/router'
import { RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import { MockParamsProvider } from './MockParamsProvider'
import { mockedUserMeta } from './mockRequests'

// Import the user's Router from `./web/src/Router.{tsx,js}`,
// we pass the `children` from the user's Router to `./MockRouter.Router`
// so that we can populate the `routes object` in Storybook and tests.
const {
  default: UserRouterWithRoutes,
} = require('~__REDWOOD__USER_ROUTES_FOR_MOCK')

// TODO: make this AuthContextInterface & the below AuthClient more composable/extendable|"overwriteable"
const fakeUseAuth = (): AuthContextInterface => ({
  loading: false,
  isAuthenticated: false,
  currentUser: null,
  userMetadata: null,
  logIn: async () => undefined,
  logOut: async () => undefined,
  signUp: async () => undefined,
  getToken: async () => null,
  getCurrentUser: async () => null,
  hasRole: () => false,
  reauthenticate: async () => undefined,
  forgotPassword: async () => undefined,
  resetPassword: async () => undefined,
  validateResetToken: async () => undefined,
  client: null,
  type: 'custom',
  hasError: false,
})

export const mockAuthClient: AuthClient = {
  restoreAuthState: () => {},
  login: async () => {},
  logout: () => {},
  signup: () => {},
  getToken: async () => {
    return 'token'
  },
  getUserMetadata: async () => {
    return mockedUserMeta.currentUser
  },
  forgotPassword: () => {},
  resetPassword: () => {},
  validateResetToken: () => {},
  client: 'Custom',
  type: 'custom',
}

export const MockProviders: React.FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  return (
    <AuthProvider client={mockAuthClient} type="custom">
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <RedwoodApolloProvider useAuth={fakeUseAuth}>
          <UserRouterWithRoutes />
          <LocationProvider>
            <MockParamsProvider>{children}</MockParamsProvider>
          </LocationProvider>
        </RedwoodApolloProvider>
      </RedwoodProvider>
    </AuthProvider>
  )
}
