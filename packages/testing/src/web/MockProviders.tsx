/**
 * NOTE: This module should not contain any nodejs functionality,
 * because it's also used by Storybook in the browser.
 */
import React from 'react'

import { useNoAuth } from '@redwoodjs/auth'
import { LocationProvider } from '@redwoodjs/router'
import { RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import { MockParamsProvider } from './MockParamsProvider'
// import { mockedUserMeta } from './mockRequests'

// Import the user's Router from `./web/src/Router.{tsx,js}`,
// we pass the `children` from the user's Router to `./MockRouter.Router`
// so that we can populate the `routes object` in Storybook and tests.
const {
  default: UserRouterWithRoutes,
} = require('~__REDWOOD__USER_ROUTES_FOR_MOCK')

// export const mockAuthClient: AuthClient = {
//   restoreAuthState: () => {},
//   login: async () => {},
//   logout: () => {},
//   signup: () => {},
//   getToken: async () => {
//     return 'token'
//   },
//   getUserMetadata: async () => {
//     return mockedUserMeta.currentUser
//   },
//   forgotPassword: () => {},
//   resetPassword: () => {},
//   validateResetToken: () => {},
//   client: 'Custom',
//   type: 'custom',
// }

export const MockProviders: React.FunctionComponent = ({ children }) => {
  return (
    // <AuthProvider client={mockAuthClient} type="custom">
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <RedwoodApolloProvider useAuth={useNoAuth}>
        <UserRouterWithRoutes />
        <LocationProvider>
          <MockParamsProvider>{children}</MockParamsProvider>
        </LocationProvider>
      </RedwoodApolloProvider>
    </RedwoodProvider>
    // </AuthProvider>
  )
}
